const fallbackExercises = [
  {
    id: "demo-1",
    subject: "Matemáticas II",
    topic: "Matrices",
    difficulty: "media",
    question: "Sea A una matriz 3x3 dependiente del parámetro a. Estudia para qué valores de a la matriz tiene rango 2.",
    solution: "Calcula el determinante, iguala a cero y comprueba menores de orden 2.",
    marks: 2.5
  },
  {
    id: "demo-2",
    subject: "Lengua Castellana y Literatura II",
    topic: "Sintaxis",
    difficulty: "baja",
    question: "Analiza sintácticamente: 'Los estudiantes que repasaron con tiempo llegaron tranquilos al examen'.",
    solution: "Sujeto: 'Los estudiantes que repasaron con tiempo'. Predicado: 'llegaron tranquilos al examen'.",
    marks: 2
  }
];

const subjectGrid = document.querySelector("#subjectGrid");
const subjectDetail = document.querySelector("#subjectDetail");
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

let subjects = [];
let questions = [];
let activeQuestionIndex = 0;
let activeSubjectName = "";

init();

async function init() {
  setupReveal();
  await loadExerciseDatabase();
  renderSubjects();
  activeSubjectName = subjects[0]?.name || "";
  renderSubjectDetail(activeSubjectName);
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

async function loadExerciseDatabase() {
  try {
    const response = await fetch("/api/exercises");
    if (!response.ok) throw new Error("No exercise API");
    const payload = await response.json();
    questions = payload.exercises.map(normalizeExercise);
  } catch {
    questions = fallbackExercises.map(normalizeExercise);
  }

  subjects = buildSubjectsFromExercises(questions);
}

function normalizeExercise(exercise) {
  return {
    id: exercise.id,
    subject: exercise.subject,
    topic: exercise.topic,
    difficulty: exercise.difficulty,
    difficultyLabel: difficultyLabel(exercise.difficulty),
    question: exercise.question,
    solution: exercise.solution,
    marks: exercise.marks || 2,
    community: exercise.autonomous_community || "General España",
    year: exercise.year_reference || "PAU style",
    tags: exercise.tags || []
  };
}

function buildSubjectsFromExercises(items) {
  const accents = ["#5d7cff", "#ff7a59", "#14b87a", "#a855f7", "#00a6c8", "#f6b73c", "#ec4899", "#10b981", "#f97316", "#6366f1"];
  const grouped = new Map();

  items.forEach((item) => {
    if (!grouped.has(item.subject)) {
      grouped.set(item.subject, {
        id: slugify(item.subject),
        name: item.subject,
        accent: accents[grouped.size % accents.length],
        mastery: 58 + ((grouped.size * 7) % 34),
        topics: new Set(),
        count: 0
      });
    }

    const subject = grouped.get(item.subject);
    subject.topics.add(item.topic);
    subject.count += 1;
  });

  return [...grouped.values()].map((subject) => ({
    ...subject,
    topics: [...subject.topics].slice(0, 8),
    description: `${subject.count} ejercicios originales tipo PAU con temas filtrables y solución guiada.`
  }));
}

function renderSubjects() {
  subjectGrid.innerHTML = subjects
    .map(
      (subject) => `
        <button class="subject-card reveal" style="--accent:${subject.accent}" data-subject="${subject.name}" type="button">
          <div class="subject-top">
            <span>${subject.count} ejercicios · ${subject.mastery}% dominio</span>
            <strong>${subject.name}</strong>
          </div>
          <p>${subject.description}</p>
          <div class="topic-tags">
            ${subject.topics.map((topic) => `<span>${topic}</span>`).join("")}
          </div>
        </button>
      `
    )
    .join("");

  subjectGrid.querySelectorAll(".subject-card").forEach((card) => {
    card.addEventListener("click", () => {
      activeSubjectName = card.dataset.subject;
      renderSubjectDetail(activeSubjectName);
      subjectFilter.value = activeSubjectName;
      hydrateTopics();
      activeQuestionIndex = 0;
      renderQuestion();
      document.querySelector("#practica").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  setTimeout(() => {
    document.querySelectorAll(".subject-card").forEach((card) => card.classList.add("is-visible"));
  }, 80);
}

function renderSubjectDetail(subjectName) {
  const subject = subjects.find((item) => item.name === subjectName);
  if (!subject) return;

  const subjectQuestions = questions.filter((question) => question.subject === subjectName);
  const groupedTopics = subjectQuestions.reduce((acc, question) => {
    acc[question.topic] = (acc[question.topic] || 0) + 1;
    return acc;
  }, {});

  subjectDetail.innerHTML = `
    <div class="subject-detail-header" style="--accent:${subject.accent}">
      <div>
        <p class="eyebrow">Ejercicios de la asignatura</p>
        <h3>${subject.name}</h3>
        <p>${subject.count} ejercicios disponibles, organizados por temas PAU y dificultad.</p>
      </div>
      <button class="primary-button" id="practiceSubjectButton" type="button">Practicar ${subject.name}</button>
    </div>
    <div class="topic-summary">
      ${Object.entries(groupedTopics)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([topic, count]) => `<span>${topic} · ${count}</span>`)
        .join("")}
    </div>
    <div class="subject-exercise-list">
      ${subjectQuestions
        .slice(0, 10)
        .map((question) => `
          <article>
            <div>
              <strong>${question.topic}</strong>
              <p>${question.question}</p>
            </div>
            <span>${question.difficultyLabel} · ${question.marks} pts</span>
          </article>
        `)
        .join("")}
    </div>
  `;

  subjectDetail.querySelector("#practiceSubjectButton").addEventListener("click", () => {
    subjectFilter.value = subject.name;
    hydrateTopics();
    activeQuestionIndex = 0;
    renderQuestion();
    document.querySelector("#practica").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function hydrateFilters() {
  const options = subjects.map((subject) => `<option value="${subject.name}">${subject.name}</option>`).join("");
  subjectFilter.innerHTML = `<option value="all">Todas</option>${options}`;
  mockSubject.innerHTML = options;
  hydrateTopics();
}

function hydrateTopics() {
  const selected = subjectFilter.value;
  const topicSet = selected === "all"
    ? new Set(questions.map((question) => question.topic))
    : new Set(questions.filter((question) => question.subject === selected).map((question) => question.topic));

  topicFilter.innerHTML = `<option value="all">Todos</option>${[...topicSet].sort().map((topic) => `<option value="${topic}">${topic}</option>`).join("")}`;
}

function bindEvents() {
  subjectFilter.addEventListener("change", () => {
    hydrateTopics();
    activeQuestionIndex = 0;
    renderQuestion();
  });
  topicFilter.addEventListener("change", () => {
    activeQuestionIndex = 0;
    renderQuestion();
  });
  difficultyFilter.addEventListener("change", () => {
    activeQuestionIndex = 0;
    renderQuestion();
  });
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
    const difficultyMatch = selectedDifficulty === "all" || question.difficultyLabel === selectedDifficulty;
    return subjectMatch && topicMatch && difficultyMatch;
  });
}

function renderQuestion() {
  const pool = getFilteredQuestions();

  if (!pool.length) {
    questionCard.innerHTML = `
      <div class="empty-state">
        <h3>No hay ejercicios con esos filtros.</h3>
        <p>Prueba otra asignatura, tema o dificultad.</p>
      </div>
    `;
    return;
  }

  const question = pool[activeQuestionIndex % pool.length];

  questionCard.innerHTML = `
    <div class="question-meta">
      <span>${question.subject}</span>
      <span>${question.topic}</span>
      <span>${question.difficultyLabel}</span>
      <span>${question.marks} pts</span>
    </div>
    <h3>${question.question}</h3>
    <div class="exam-context">
      <span>${question.community}</span>
      <span>${question.year}</span>
      <span>${question.id}</span>
    </div>
    <div class="work-area">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
    <details>
      <summary>Ver solución paso a paso</summary>
      <ol>
        ${solutionSteps(question.solution).map((step) => `<li>${step}</li>`).join("")}
      </ol>
      <strong>Guía de corrección:</strong>
      <p>${question.solution}</p>
    </details>
  `;
}

function buildMockExam() {
  const subjectName = mockSubject.value;
  const amount = Number(mockQuestions.value);
  const time = document.querySelector("#mockTime").value;
  const selectedQuestions = questions
    .filter((question) => question.subject === subjectName)
    .slice(0, amount);

  mockResult.innerHTML = `
    <strong>${subjectName} · ${time} minutos</strong>
    <p>${selectedQuestions.length} ejercicios seleccionados desde la base PAU.</p>
    <ul>
      ${selectedQuestions.map((question) => `<li>${question.topic}: ${question.difficultyLabel} · ${question.marks} pts</li>`).join("")}
    </ul>
  `;
}

function renderProgress() {
  progressList.innerHTML = subjects
    .slice(0, 8)
    .map(
      (subject) => `
        <div class="progress-item" style="--accent:${subject.accent}">
          <div>
            <strong>${subject.name}</strong>
            <span>${subject.count} ejercicios</span>
          </div>
          <meter min="0" max="100" value="${subject.mastery}"></meter>
        </div>
      `
    )
    .join("");
}

function difficultyLabel(value) {
  const map = {
    baja: "Fácil",
    media: "Media",
    alta: "Difícil"
  };

  return map[String(value).toLowerCase()] || value;
}

function solutionSteps(solution) {
  return String(solution)
    .split(/(?<=[.!?])\s+/)
    .map((step) => step.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
