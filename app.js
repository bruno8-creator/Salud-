const subjects = [
  {
    id: "matematicas-ii",
    name: "Matemáticas II",
    accent: "#5d7cff",
    mastery: 68,
    topics: ["Matrices", "Derivadas", "Integrales", "Probabilidad"],
    description: "Álgebra, análisis, geometría y probabilidad con problemas tipo examen."
  },
  {
    id: "lengua",
    name: "Lengua Castellana",
    accent: "#ff7a59",
    mastery: 81,
    topics: ["Comentario", "Sintaxis", "Literatura", "Argumentación"],
    description: "Comentario de texto, sintaxis, literatura y escritura argumentativa."
  },
  {
    id: "historia",
    name: "Historia de España",
    accent: "#14b87a",
    mastery: 74,
    topics: ["Siglo XIX", "Segunda República", "Franquismo", "Transición"],
    description: "Temas desarrollados, fuentes históricas y esquemas memorizables."
  },
  {
    id: "ingles",
    name: "Inglés",
    accent: "#a855f7",
    mastery: 88,
    topics: ["Reading", "Writing", "Use of English", "Vocabulary"],
    description: "Comprensión lectora, redacción, gramática y vocabulario útil."
  },
  {
    id: "fisica",
    name: "Física",
    accent: "#00a6c8",
    mastery: 62,
    topics: ["Campo gravitatorio", "Ondas", "Electricidad", "Óptica"],
    description: "Problemas guiados, fórmulas clave y razonamiento físico paso a paso."
  },
  {
    id: "quimica",
    name: "Química",
    accent: "#f6b73c",
    mastery: 71,
    topics: ["Equilibrio", "Redox", "Ácido-base", "Orgánica"],
    description: "Ejercicios de cálculo, formulación, equilibrios y reacciones."
  }
];

const questions = [
  {
    subject: "matematicas-ii",
    topic: "Matrices",
    difficulty: "Media",
    statement: "Sea A una matriz 3x3 dependiente del parámetro a. Estudia para qué valores de a la matriz tiene rango 2.",
    steps: ["Calcula el determinante de A.", "Iguala el determinante a cero para encontrar candidatos.", "Comprueba menores de orden 2 para confirmar el rango."],
    answer: "El rango baja a 2 cuando det(A)=0 y existe al menos un menor de orden 2 no nulo."
  },
  {
    subject: "lengua",
    topic: "Sintaxis",
    difficulty: "Fácil",
    statement: "Analiza sintácticamente: 'Los estudiantes que repasaron con tiempo llegaron tranquilos al examen'.",
    steps: ["Localiza el verbo principal.", "Identifica el sujeto y la subordinada adjetiva.", "Separa complementos del predicado."],
    answer: "Sujeto: 'Los estudiantes que repasaron con tiempo'. Predicado: 'llegaron tranquilos al examen'."
  },
  {
    subject: "historia",
    topic: "Transición",
    difficulty: "Media",
    statement: "Explica dos factores que facilitaron la transición democrática en España.",
    steps: ["Contextualiza tras la muerte de Franco.", "Menciona actores políticos y sociales.", "Relaciona reforma legal y consenso."],
    answer: "Fueron claves la reforma desde las instituciones y el consenso entre fuerzas políticas y sociales."
  },
  {
    subject: "ingles",
    topic: "Writing",
    difficulty: "Fácil",
    statement: "Write a 120-word opinion paragraph about whether students should work while studying.",
    steps: ["State your opinion clearly.", "Use two reasons and one example.", "Close with a short conclusion."],
    answer: "A strong answer uses connectors, clear opinion and specific examples without overcomplicating grammar."
  },
  {
    subject: "fisica",
    topic: "Ondas",
    difficulty: "Difícil",
    statement: "Una onda armónica tiene frecuencia 50 Hz y longitud de onda 0,4 m. Calcula su velocidad y periodo.",
    steps: ["Usa v = λf.", "Calcula T = 1/f.", "Incluye unidades en ambos resultados."],
    answer: "v = 0,4 · 50 = 20 m/s. T = 1/50 = 0,02 s."
  },
  {
    subject: "quimica",
    topic: "Ácido-base",
    difficulty: "Media",
    statement: "Calcula el pH de una disolución 0,01 M de HCl suponiendo disociación completa.",
    steps: ["Identifica que HCl es ácido fuerte.", "Calcula [H+] = 0,01 M.", "Aplica pH = -log[H+]."],
    answer: "pH = -log(10^-2) = 2."
  }
];

const subjectGrid = document.querySelector("#subjectGrid");
const subjectFilter = document.querySelector("#subjectFilter");
const topicFilter = document.querySelector("#topicFilter");
const difficultyFilter = document.querySelector("#difficultyFilter");
const questionCard = document.querySelector("#questionCard");
const newQuestionButton = document.querySelector("#newQuestionButton");
const mockSubject = document.querySelector("#mockSubject");
const mockQuestions = document.querySelector("#mockQuestions");
const mockOutput = document.querySelector("#mockOutput");
const buildMockButton = document.querySelector("#buildMockButton");
const mockResult = document.querySelector("#mockResult");
const progressList = document.querySelector("#progressList");

let activeQuestionIndex = 0;

init();

function init() {
  setupReveal();
  renderSubjects();
  hydrateFilters();
  renderQuestion();
  renderProgress();
  bindEvents();
}

function setupReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));
}

function renderSubjects() {
  subjectGrid.innerHTML = subjects
    .map(
      (subject) => `
        <article class="subject-card reveal" style="--accent:${subject.accent}">
          <div class="subject-top">
            <span>${subject.mastery}% dominio</span>
            <strong>${subject.name}</strong>
          </div>
          <p>${subject.description}</p>
          <div class="topic-tags">
            ${subject.topics.map((topic) => `<span>${topic}</span>`).join("")}
          </div>
        </article>
      `
    )
    .join("");

  setTimeout(() => {
    document.querySelectorAll(".subject-card").forEach((card) => card.classList.add("is-visible"));
  }, 80);
}

function hydrateFilters() {
  const options = subjects.map((subject) => `<option value="${subject.id}">${subject.name}</option>`).join("");
  subjectFilter.innerHTML = `<option value="all">Todas</option>${options}`;
  mockSubject.innerHTML = options;
  hydrateTopics();
}

function hydrateTopics() {
  const selected = subjectFilter.value;
  const topicSet = selected === "all"
    ? new Set(subjects.flatMap((subject) => subject.topics))
    : new Set(subjects.find((subject) => subject.id === selected).topics);

  topicFilter.innerHTML = `<option value="all">Todos</option>${[...topicSet].map((topic) => `<option value="${topic}">${topic}</option>`).join("")}`;
}

function bindEvents() {
  subjectFilter.addEventListener("change", () => {
    hydrateTopics();
    activeQuestionIndex = 0;
    renderQuestion();
  });
  topicFilter.addEventListener("change", renderQuestion);
  difficultyFilter.addEventListener("change", renderQuestion);
  newQuestionButton.addEventListener("click", () => {
    activeQuestionIndex += 1;
    renderQuestion();
  });
  mockQuestions.addEventListener("input", () => {
    mockOutput.textContent = `${mockQuestions.value} ejercicios`;
  });
  buildMockButton.addEventListener("click", buildMockExam);
}

function getFilteredQuestions() {
  const selectedSubject = subjectFilter.value;
  const selectedTopic = topicFilter.value;
  const selectedDifficulty = difficultyFilter.value;

  return questions.filter((question) => {
    const subjectMatch = selectedSubject === "all" || question.subject === selectedSubject;
    const topicMatch = selectedTopic === "all" || question.topic === selectedTopic;
    const difficultyMatch = selectedDifficulty === "all" || question.difficulty === selectedDifficulty;
    return subjectMatch && topicMatch && difficultyMatch;
  });
}

function renderQuestion() {
  const pool = getFilteredQuestions();
  const question = pool[activeQuestionIndex % pool.length] || questions[0];
  const subject = subjects.find((item) => item.id === question.subject);

  questionCard.innerHTML = `
    <div class="question-meta">
      <span>${subject.name}</span>
      <span>${question.topic}</span>
      <span>${question.difficulty}</span>
    </div>
    <h3>${question.statement}</h3>
    <div class="work-area">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
    <details>
      <summary>Ver solución paso a paso</summary>
      <ol>
        ${question.steps.map((step) => `<li>${step}</li>`).join("")}
      </ol>
      <strong>Respuesta:</strong>
      <p>${question.answer}</p>
    </details>
  `;
}

function buildMockExam() {
  const subject = subjects.find((item) => item.id === mockSubject.value);
  const amount = Number(mockQuestions.value);
  const time = document.querySelector("#mockTime").value;
  const selectedQuestions = questions
    .filter((question) => question.subject === subject.id)
    .concat(questions)
    .slice(0, amount);

  mockResult.innerHTML = `
    <strong>${subject.name} · ${time} minutos</strong>
    <p>${amount} ejercicios seleccionados con dificultad mezclada.</p>
    <ul>
      ${selectedQuestions.map((question) => `<li>${question.topic}: ${question.difficulty}</li>`).join("")}
    </ul>
  `;
}

function renderProgress() {
  progressList.innerHTML = subjects
    .map(
      (subject) => `
        <div class="progress-item" style="--accent:${subject.accent}">
          <div>
            <strong>${subject.name}</strong>
            <span>${subject.mastery}% dominio</span>
          </div>
          <meter min="0" max="100" value="${subject.mastery}"></meter>
        </div>
      `
    )
    .join("");
}
