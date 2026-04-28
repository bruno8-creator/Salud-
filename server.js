const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 5173;
const ROOT = __dirname;
const DATABASE_PATH = path.join(ROOT, "data", "pau_exercises_500.json");
const exerciseDatabase = loadExerciseDatabase();
const exercises = exerciseDatabase.exercises || [];

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const staticExtensions = [".css", ".js", ".svg", ".png", ".jpg", ".jpeg", ".webp"];

  if (req.method === "GET" && url.pathname === "/api/exercises") {
    return sendJson(res, filterExercises(url));
  }

  if (req.method === "GET" && url.pathname === "/api/subjects") {
    const subjects = [...new Set(exercises.map((exercise) => exercise.subject))];
    return sendJson(res, { subjects });
  }

  if (req.method === "POST" && url.pathname === "/api/mock-exam") {
    const body = await readJson(req);
    return sendJson(res, buildMockExam(body));
  }

  if (req.method === "POST" && url.pathname === "/api/tutor") {
    const body = await readJson(req);
    return sendJson(res, buildTutorReply(body));
  }

  if (req.method === "POST" && url.pathname === "/api/lesson") {
    const body = await readJson(req);
    return sendJson(res, buildLesson(body));
  }

  if (staticExtensions.includes(path.extname(url.pathname))) {
    return serveStatic(url.pathname, res);
  }

  return serveStatic("/index.html", res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`PAU Mastery running at http://127.0.0.1:${PORT}`);
});

function filterExercises(url) {
  const subject = url.searchParams.get("subject");
  const topic = url.searchParams.get("topic");
  const difficulty = url.searchParams.get("difficulty");
  const search = (url.searchParams.get("search") || "").toLowerCase();
  const limit = Number(url.searchParams.get("limit")) || exercises.length;

  const filtered = exercises.filter((exercise) => {
    const subjectMatch = !subject || subject === "all" || exercise.subject === subject;
    const topicMatch = !topic || topic === "all" || exercise.topic === topic;
    const difficultyMatch = !difficulty || difficulty === "all" || normalizeDifficulty(exercise.difficulty) === difficulty;
    const searchMatch = !search || `${exercise.question} ${exercise.topic} ${exercise.id}`.toLowerCase().includes(search);
    return subjectMatch && topicMatch && difficultyMatch && searchMatch;
  });

  return {
    metadata: {
      ...exerciseDatabase.metadata,
      returned_exercises: Math.min(filtered.length, limit)
    },
    exercises: filtered.slice(0, limit).map(enrichExercise)
  };
}

function buildMockExam(input = {}) {
  const subject = input.subject || exercises[0]?.subject;
  const topic = input.topic || "all";
  const amount = clamp(Number(input.amount) || 5, 3, 6);
  const duration = clamp(Number(input.duration) || 90, 45, 180);
  const difficulty = input.difficulty || "mixed";
  const questionType = input.questionType || "problema_guiado";
  const pool = exercises.filter((exercise) => {
    const subjectMatch = exercise.subject === subject;
    const topicMatch = topic === "all" || !topic || exercise.topic === topic;
    const difficultyMatch = difficulty === "mixed" || normalizeDifficulty(exercise.difficulty) === difficulty;
    return subjectMatch && topicMatch && difficultyMatch;
  });

  const selected = input.generateNew
    ? generateAiExercises({ subject, topic, difficulty, questionType, amount })
    : balancedPick(pool.length ? pool : exercises.filter((exercise) => exercise.subject === subject), amount);
  const examQuestions = normalizeExamMarks(selected);
  const totalMarks = examQuestions.reduce((sum, exercise) => sum + Number(exercise.marks || 0), 0);

  return {
    id: `SIM-${slugify(subject)}-${Date.now()}`,
    title: input.generateNew ? `Examen PAU generado - ${subject}` : `Simulacro PAU - ${subject}`,
    subject,
    duration,
    totalMarks,
    format: "PAU-style official practice paper",
    header: {
      course: "2º Bachillerato",
      examType: "PAU / EBAU",
      allowedMaterial: buildAllowedMaterial(subject),
      scoring: "La prueba se califica sobre 10 puntos."
    },
    instructions: [
      "Lee todas las preguntas antes de empezar y revisa la puntuación de cada apartado.",
      "Justifica todos los pasos: planteamiento, desarrollo y conclusión.",
      "Se valorará la claridad, el uso correcto de conceptos y la interpretación del resultado.",
      "No se puntuará únicamente el resultado numérico si no aparece el procedimiento."
    ],
    sections: [
      {
        title: "Bloque A - Cuestiones obligatorias",
        questions: examQuestions.slice(0, Math.ceil(examQuestions.length / 2)).map(toExamQuestion)
      },
      {
        title: "Bloque B - Problemas de desarrollo",
        questions: examQuestions.slice(Math.ceil(examQuestions.length / 2)).map(toExamQuestion)
      }
    ],
    answerKey: examQuestions.map((exercise, index) => ({
      number: index + 1,
      id: exercise.id,
      topic: exercise.topic,
      marks: exercise.marks,
      solution: exercise.solution,
      rubric: buildRubric(exercise)
    }))
  };
}

function buildTutorReply(input = {}) {
  const exercise = exercises.find((item) => item.id === input.exerciseId)
    || exercises.find((item) => item.subject === input.subject && item.topic === input.topic)
    || exercises.find((item) => item.subject === input.subject)
    || exercises[0];
  const userQuestion = String(input.message || "").trim();
  const steps = splitSolution(exercise.solution);
  const hints = [
    `Empieza identificando el tema: ${exercise.topic}.`,
    `Subraya qué te piden exactamente en el enunciado antes de calcular.`,
    "Escribe fórmulas, datos y objetivo en tres líneas separadas.",
    "No mires la solución completa hasta haber intentado el primer paso."
  ];

  return {
    tutor: "PAU Tutor",
    exerciseId: exercise.id,
    subject: exercise.subject,
    topic: exercise.topic,
    response: userQuestion
      ? `Para tu duda: "${userQuestion}", yo lo atacaría separando el ejercicio en pasos cortos. La clave es no saltar directamente al resultado, sino justificar el método.`
      : "Aquí tienes una explicación guiada para resolver el ejercicio sin memorizar la solución.",
    hints,
    steps,
    commonMistakes: buildCommonMistakes(exercise),
    finalCheck: `Cuando termines, comprueba que tu respuesta responde al enunciado y que optaría a ${exercise.marks || 2} puntos.`,
    disclaimer: "Tutor educativo generado por reglas locales. Después podemos conectarlo a un modelo IA real."
  };
}

function buildLesson(input = {}) {
  const subject = input.subject || exercises[0]?.subject;
  const topic = input.topic || exercises.find((exercise) => exercise.subject === subject)?.topic || "Tema PAU";
  const level = input.level || "nivel examen";
  const sample = exercises.find((exercise) => exercise.subject === subject && exercise.topic === topic)
    || exercises.find((exercise) => exercise.subject === subject)
    || exercises[0];

  return {
    title: `${topic} en ${subject}`,
    subject,
    topic,
    level,
    intro: `Lección ${level} para dominar ${topic} en ${subject}. La idea es entender el patrón de pregunta PAU, saber cómo empezar y practicar con una corrección clara.`,
    keyIdeas: buildKeyIdeas(subject, topic),
    guidedExample: [
      `Lee el enunciado y clasifica el ejercicio como ${topic}.`,
      "Escribe los datos relevantes antes de resolver.",
      "Aplica el método estándar del tema y justifica cada transformación.",
      "Cierra con una frase que responda exactamente a lo pedido."
    ],
    miniPractice: {
      question: sample.question,
      solution: sample.solution
    },
    generatedBy: "local-ai-ready-engine"
  };
}

function generateAiExercises({ subject, topic, difficulty, questionType, amount }) {
  const baseTopic = topic && topic !== "all"
    ? topic
    : exercises.find((exercise) => exercise.subject === subject)?.topic || "Tema PAU";
  const label = difficulty === "mixed" ? "media" : reverseDifficulty(difficulty);

  return Array.from({ length: amount }, (_, index) => {
    const number = index + 1;
    const statement = buildGeneratedStatement({ subject, topic: baseTopic, questionType, number, difficulty });
    return {
      id: `AI-${slugify(subject)}-${slugify(baseTopic)}-${Date.now()}-${number}`,
      subject,
      topic: baseTopic,
      difficulty: label,
      marks: 2,
      question: statement,
      solution: buildGeneratedSolution({ subject, topic: baseTopic, questionType, statement })
    };
  });
}

function buildGeneratedStatement({ subject, topic, questionType, number, difficulty }) {
  const seed = number + topic.length + subject.length;
  const subjectText = subject.toLowerCase();
  const topicText = topic.toLowerCase();

  if (subjectText.includes("matemáticas") && topicText.includes("deriv")) {
    const a = 2 + (seed % 4);
    const b = 1 + (seed % 5);
    return `Sea f(x)=${a}x^3-${b}x^2+${number}x-${a}. a) Calcula f'(x). b) Halla los puntos críticos de f. c) Clasifica cada punto crítico usando f''(x) o una tabla de signos. d) Explica qué información aporta este estudio sobre la gráfica de la función.`;
  }

  if (subjectText.includes("matemáticas") && topicText.includes("integr")) {
    const k = 3 + (seed % 5);
    return `Calcula el área de la región limitada por las curvas y=${k}x e y=x^2. a) Determina los puntos de corte. b) Plantea la integral definida adecuada. c) Calcula el área exacta. d) Justifica por qué la función superior es la que has elegido.`;
  }

  if (subjectText.includes("matemáticas") && topicText.includes("matriz")) {
    const a = 1 + (seed % 4);
    return `Sea A = [[1, ${a}], [${a + 2}, 1]]. a) Calcula det(A). b) Estudia si A es invertible. c) Si existe, halla A^(-1). d) Comprueba el resultado multiplicando A por su inversa.`;
  }

  if (subjectText.includes("física")) {
    const velocity = 12 + seed;
    const time = 2 + (seed % 4);
    return `Un cuerpo se desplaza con velocidad inicial ${velocity} m/s durante ${time} s bajo aceleración constante. a) Escribe las ecuaciones que usarías. b) Calcula el desplazamiento si a=2 m/s². c) Interpreta físicamente el signo de la aceleración. d) Indica las unidades de cada magnitud.`;
  }

  if (subjectText.includes("química")) {
    return `Se prepara una disolución ácida de concentración 0,01 M. a) Identifica si el cálculo de pH requiere considerar disociación completa. b) Calcula el pH para un ácido fuerte monoprótico. c) Explica cómo cambiaría el razonamiento si el ácido fuera débil. d) Indica dos errores frecuentes en este tipo de ejercicio.`;
  }

  if (subjectText.includes("lengua")) {
    return `Lee este enunciado base: "La tecnología ha cambiado la forma en que los jóvenes estudian, pero no siempre mejora su concentración". a) Resume la idea principal. b) Formula el tema en una frase. c) Propón una tesis para un comentario crítico. d) Escribe un párrafo argumentativo con dos conectores.`;
  }

  if (subjectText.includes("historia")) {
    return `Desarrolla una pregunta tipo PAU sobre ${topic}. a) Sitúa el tema en su contexto cronológico. b) Explica dos causas. c) Explica dos consecuencias. d) Valora su importancia histórica en la evolución de España contemporánea.`;
  }

  if (questionType === "desarrollo") {
    return `Desarrolla de forma razonada ${topic} en ${subject}. Incluye definición, contexto, ejemplo tipo PAU y conclusión. La respuesta debe estar organizada en apartados.`;
  }

  if (questionType === "comentario") {
    return `Analiza un caso relacionado con ${topic}. a) Identifica el problema. b) Explica los conceptos implicados. c) Resuelve o comenta el caso paso a paso. d) Redacta una conclusión final de 4-5 líneas.`;
  }

  if (questionType === "calculo") {
    return `Resuelve un ejercicio de cálculo de ${topic} en ${subject}. a) Define datos e incógnitas. b) Plantea la fórmula o método. c) Desarrolla el cálculo. d) Comprueba e interpreta el resultado.`;
  }

  return `Ejercicio PAU de ${topic} (${subject}). a) Identifica el método. b) Resuelve el caso propuesto con procedimiento completo. c) Interpreta el resultado. d) Señala un error típico que debe evitarse.`;
}

function buildGeneratedSolution({ subject, topic, questionType, statement }) {
  const core = [
    `Identificar que el ejercicio pertenece a ${topic}.`,
    "Anotar datos, incógnitas y objetivo.",
    "Aplicar el procedimiento estándar del tema sin saltar justificaciones.",
    "Revisar unidades, signos, conclusión y puntuación."
  ];

  if (questionType === "desarrollo") {
    return `${core.join(" ")} La respuesta debe incluir definición, explicación, ejemplo y cierre comparando con el enunciado.`;
  }

  if (String(subject).toLowerCase().includes("matemáticas")) {
    return `${core.join(" ")} En matemáticas se corrige especialmente el planteamiento algebraico, el desarrollo ordenado y la comprobación del resultado. No basta con escribir el resultado final.`;
  }

  return `${core.join(" ")} La solución completa debe mostrar el planteamiento, el desarrollo y una conclusión final clara. Enunciado generado: ${statement}`;
}

function buildKeyIdeas(subject, topic) {
  const text = `${subject} ${topic}`.toLowerCase();
  if (text.includes("matem")) return ["Plantea antes de calcular.", "Justifica transformaciones algebraicas.", "Comprueba soluciones y dominio.", "Escribe una conclusión interpretable."];
  if (text.includes("lengua")) return ["Distingue resumen, tema y comentario.", "Justifica con fragmentos del texto.", "Cuida conectores y precisión.", "Separa análisis de opinión."];
  if (text.includes("historia")) return ["Ordena cronológicamente.", "Relaciona causas y consecuencias.", "Incluye conceptos clave.", "Cierra con importancia histórica."];
  if (text.includes("física") || text.includes("química")) return ["Lista datos y unidades.", "Elige fórmula antes de sustituir.", "Mantén unidades en cada paso.", "Evalúa si el resultado tiene sentido."];
  return ["Lee el enunciado dos veces.", "Detecta qué tema se evalúa.", "Resuelve por pasos cortos.", "Cierra respondiendo a la pregunta exacta."];
}

function toExamQuestion(exercise, index) {
  const enriched = enrichExercise(exercise);
  return {
    number: index + 1,
    id: enriched.id,
    topic: enriched.topic,
    difficulty: normalizeDifficulty(enriched.difficulty),
    marks: enriched.marks,
    statement: enriched.enhanced_question
  };
}

function normalizeExamMarks(selected) {
  const count = selected.length || 1;
  const base = Number((10 / count).toFixed(2));
  let accumulated = 0;

  return selected.map((exercise, index) => {
    const marks = index === count - 1 ? Number((10 - accumulated).toFixed(2)) : base;
    accumulated += marks;
    return {
      ...exercise,
      marks
    };
  });
}

function buildAllowedMaterial(subject) {
  const text = String(subject).toLowerCase();
  if (text.includes("matemáticas") || text.includes("física") || text.includes("química")) {
    return "Calculadora no programable cuando la normativa de la comunidad lo permita.";
  }
  if (text.includes("inglés")) return "No se permite diccionario salvo indicación expresa.";
  return "Material ordinario de escritura. No se permite documentación adicional.";
}

function buildRubric(exercise) {
  const marks = Number(exercise.marks || 2);
  return [
    `Planteamiento correcto: ${(marks * 0.35).toFixed(2)} pts`,
    `Desarrollo y cálculos: ${(marks * 0.45).toFixed(2)} pts`,
    `Conclusión justificada: ${(marks * 0.2).toFixed(2)} pts`
  ];
}

function enrichExercise(exercise) {
  const steps = splitSolution(exercise.solution);
  const enhancedQuestion = String(exercise.question || "").length > 90
    ? exercise.question
    : `${exercise.question} Justifica el procedimiento y explica qué resultado responde al enunciado.`;

  return {
    ...exercise,
    enhanced_question: enhancedQuestion,
    learning_objective: `Dominar ${exercise.topic} en ${exercise.subject} con formato PAU.`,
    method: buildMethod(exercise),
    solution_steps: steps.length ? steps : ["Identifica datos e incógnitas.", "Aplica el método del tema.", "Justifica el resultado final."],
    quality_notes: [
      "Enunciado reforzado para exigir justificación.",
      "Solución separada en pasos para estudio guiado.",
      "Rúbrica generable por puntuación orientativa."
    ]
  };
}

function buildMethod(exercise) {
  const topic = String(exercise.topic || "").toLowerCase();
  if (topic.includes("deriv")) return "Deriva, iguala a cero, estudia puntos críticos y clasifica con la segunda derivada o tabla de signos.";
  if (topic.includes("integr")) return "Encuentra límites, identifica función superior, integra la diferencia y evalúa correctamente.";
  if (topic.includes("matriz") || topic.includes("matrices")) return "Calcula determinantes o menores, interpreta rango/invertibilidad y verifica condiciones.";
  if (topic.includes("probabilidad")) return "Define la variable aleatoria, el modelo y los sucesos antes de sustituir en la fórmula.";
  if (topic.includes("comentario")) return "Localiza tesis, estructura, recursos y relaciónalos con la intención comunicativa.";
  if (topic.includes("redox")) return "Separa semirreacciones, ajusta electrones y comprueba masa y carga.";
  return "Lee el enunciado, extrae datos, aplica el método del tema y cierra con una conclusión explícita.";
}

function buildCommonMistakes(exercise) {
  const topic = String(exercise.topic).toLowerCase();
  if (topic.includes("deriv")) return ["Derivar un término con signo incorrecto.", "Resolver f'(x)=0 y olvidar clasificar con f''(x)."];
  if (topic.includes("integr")) return ["Invertir la función superior e inferior.", "Olvidar evaluar la primitiva en ambos límites."];
  if (topic.includes("matriz") || topic.includes("matrices")) return ["Confundir determinante con rango.", "No comprobar menores cuando el determinante se anula."];
  if (topic.includes("comentario")) return ["Resumir demasiado y no comentar estructura o intención.", "No justificar con citas del texto."];
  return ["Saltar pasos de justificación.", "No revisar unidades, signos o conclusión final."];
}

function balancedPick(pool, amount) {
  const byDifficulty = ["baja", "media", "alta"].flatMap((difficulty) => pool.filter((exercise) => exercise.difficulty === difficulty));
  const source = byDifficulty.length ? byDifficulty : pool;
  return source.slice(0, amount);
}

function splitSolution(solution) {
  return String(solution)
    .split(/(?<=[.!?])\s+/)
    .map((step) => step.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function serveStatic(requestPath, res) {
  const safePath = path.normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": getContentType(filePath) });
    res.end(content);
  });
}

function loadExerciseDatabase() {
  try {
    return JSON.parse(fs.readFileSync(DATABASE_PATH, "utf8"));
  } catch {
    return {
      metadata: {
        name: "Fallback PAU exercise database",
        total_exercises: 0
      },
      exercises: []
    };
  }
}

function readJson(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function getContentType(filePath) {
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp"
  };

  return types[path.extname(filePath)] || "application/octet-stream";
}

function normalizeDifficulty(value) {
  const map = {
    baja: "Fácil",
    media: "Media",
    alta: "Difícil"
  };
  return map[String(value).toLowerCase()] || value;
}

function reverseDifficulty(value) {
  const map = {
    Fácil: "baja",
    Media: "media",
    Difícil: "alta"
  };
  return map[value] || "media";
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
