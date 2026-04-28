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
    exercises: filtered.slice(0, limit)
  };
}

function buildMockExam(input = {}) {
  const subject = input.subject || exercises[0]?.subject;
  const amount = clamp(Number(input.amount) || 5, 3, 10);
  const duration = clamp(Number(input.duration) || 90, 45, 180);
  const difficulty = input.difficulty || "mixed";
  const pool = exercises.filter((exercise) => {
    const subjectMatch = exercise.subject === subject;
    const difficultyMatch = difficulty === "mixed" || normalizeDifficulty(exercise.difficulty) === difficulty;
    return subjectMatch && difficultyMatch;
  });

  const selected = balancedPick(pool.length ? pool : exercises.filter((exercise) => exercise.subject === subject), amount);
  const totalMarks = selected.reduce((sum, exercise) => sum + Number(exercise.marks || 0), 0);

  return {
    id: `SIM-${slugify(subject)}-${Date.now()}`,
    title: `Simulacro PAU - ${subject}`,
    subject,
    duration,
    totalMarks,
    instructions: [
      "Lee todas las preguntas antes de empezar.",
      "Justifica los procedimientos cuando el ejercicio lo requiera.",
      "Reparte el tiempo según la puntuación de cada pregunta.",
      "Al terminar, compara tu respuesta con la guía de corrección."
    ],
    sections: [
      {
        title: "Bloque A - Ejercicios principales",
        questions: selected.slice(0, Math.ceil(selected.length / 2)).map(toExamQuestion)
      },
      {
        title: "Bloque B - Aplicación y cierre",
        questions: selected.slice(Math.ceil(selected.length / 2)).map(toExamQuestion)
      }
    ],
    answerKey: selected.map((exercise, index) => ({
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
  const exercise = exercises.find((item) => item.id === input.exerciseId) || exercises[0];
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

function toExamQuestion(exercise, index) {
  return {
    number: index + 1,
    id: exercise.id,
    topic: exercise.topic,
    difficulty: normalizeDifficulty(exercise.difficulty),
    marks: exercise.marks,
    statement: exercise.question
  };
}

function buildRubric(exercise) {
  const marks = Number(exercise.marks || 2);
  return [
    `Planteamiento correcto: ${(marks * 0.35).toFixed(2)} pts`,
    `Desarrollo y cálculos: ${(marks * 0.45).toFixed(2)} pts`,
    `Conclusión justificada: ${(marks * 0.2).toFixed(2)} pts`
  ];
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
