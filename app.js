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
const dojoSubjectList = document.querySelector("#dojoSubjectList");
const dojoSubjectCount = document.querySelector("#dojoSubjectCount");
const dojoTopicChips = document.querySelector("#dojoTopicChips");
const exerciseList = document.querySelector("#exerciseList");
const exerciseViewer = document.querySelector("#exerciseViewer");
const exerciseSearch = document.querySelector("#exerciseSearch");
const dojoDifficulty = document.querySelector("#dojoDifficulty");
const dojoCommunity = document.querySelector("#dojoCommunity");
const dojoYear = document.querySelector("#dojoYear");
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
const tutorSubject = document.querySelector("#tutorSubject");
const tutorTopic = document.querySelector("#tutorTopic");
const tutorMessage = document.querySelector("#tutorMessage");
const generalTutorButton = document.querySelector("#generalTutorButton");
const generalTutorOutput = document.querySelector("#generalTutorOutput");
const aiExamSubject = document.querySelector("#aiExamSubject");
const aiExamTopic = document.querySelector("#aiExamTopic");
const aiQuestionType = document.querySelector("#aiQuestionType");
const aiExamDifficulty = document.querySelector("#aiExamDifficulty");
const aiExamButton = document.querySelector("#aiExamButton");
const aiExamOutput = document.querySelector("#aiExamOutput");
const lessonSubject = document.querySelector("#lessonSubject");
const lessonTopic = document.querySelector("#lessonTopic");
const lessonLevel = document.querySelector("#lessonLevel");
const lessonButton = document.querySelector("#lessonButton");
const lessonOutput = document.querySelector("#lessonOutput");
const flashcardSubject = document.querySelector("#flashcardSubject");
const flashcardQuestion = document.querySelector("#flashcardQuestion");
const flashcardAnswer = document.querySelector("#flashcardAnswer");
const newFlashcardButton = document.querySelector("#newFlashcardButton");
const flashcardStatus = document.querySelector("#flashcardStatus");
let lastTutorExerciseId = "";

let subjects = [];
let questions = [];
let activeQuestionIndex = 0;
let activeSubjectName = "";
let activeDojoTopic = "all";
let activeExerciseId = "";
let currentGeneratedExam = null;
let activeFlashcardIndex = 0;
let flashcardReviews = 0;
let runningTimer = null;

init();

async function init() {
  setupReveal();
  await loadExerciseDatabase();
  renderSubjects();
  activeSubjectName = subjects[0]?.name || "";
  renderSubjectDetail(activeSubjectName);
  renderDojo();
  hydrateFilters();
  hydrateAiControls();
  hydrateDojoMetaFilters();
  renderQuestion();
  renderProgress();
  renderFlashcard();
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
    question: exercise.enhanced_question || exercise.question,
    originalQuestion: exercise.question,
    solution: exercise.solution,
    solutionSteps: exercise.solution_steps || [],
    method: exercise.method || "",
    learningObjective: exercise.learning_objective || "",
    qualityNotes: exercise.quality_notes || [],
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
      activeDojoTopic = "all";
      activeExerciseId = "";
      renderDojo();
      subjectFilter.value = activeSubjectName;
      hydrateTopics();
      activeQuestionIndex = 0;
      renderQuestion();
      document.querySelector("#dojo").scrollIntoView({ behavior: "smooth", block: "start" });
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

function renderDojo() {
  dojoSubjectCount.textContent = subjects.length;
  dojoSubjectList.innerHTML = subjects
    .map((subject) => `
      <button class="${subject.name === activeSubjectName ? "active" : ""}" data-subject="${subject.name}" type="button">
        <span style="--accent:${subject.accent}"></span>
        <strong>${subject.name}</strong>
        <small>${subject.count}</small>
      </button>
    `)
    .join("");

  dojoSubjectList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeSubjectName = button.dataset.subject;
      activeDojoTopic = "all";
      activeExerciseId = "";
      renderDojo();
      renderSubjectDetail(activeSubjectName);
    });
  });

  renderTopicChips();
  renderExerciseList();
}

function renderTopicChips() {
  const topics = [...new Set(questions.filter((question) => question.subject === activeSubjectName).map((question) => question.topic))].sort();

  dojoTopicChips.innerHTML = [
    `<button class="${activeDojoTopic === "all" ? "active" : ""}" data-topic="all" type="button">Todos</button>`,
    ...topics.map((topic) => `<button class="${topic === activeDojoTopic ? "active" : ""}" data-topic="${topic}" type="button">${topic}</button>`)
  ].join("");

  dojoTopicChips.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeDojoTopic = button.dataset.topic;
      activeExerciseId = "";
      renderTopicChips();
      renderExerciseList();
    });
  });
}

function getDojoExercises() {
  const query = exerciseSearch.value.trim().toLowerCase();
  const difficulty = dojoDifficulty.value;
  const community = dojoCommunity.value;
  const year = dojoYear.value;

  return questions.filter((question) => {
    const subjectMatch = question.subject === activeSubjectName;
    const topicMatch = activeDojoTopic === "all" || question.topic === activeDojoTopic;
    const difficultyMatch = difficulty === "all" || question.difficultyLabel === difficulty;
    const communityMatch = community === "all" || question.community === community;
    const yearMatch = year === "all" || question.year === year;
    const searchMatch = !query || `${question.topic} ${question.question} ${question.id}`.toLowerCase().includes(query);
    return subjectMatch && topicMatch && difficultyMatch && communityMatch && yearMatch && searchMatch;
  });
}

function renderExerciseList() {
  const exercises = getDojoExercises();
  const selected = exercises.find((exercise) => exercise.id === activeExerciseId) || exercises[0];
  activeExerciseId = selected?.id || "";

  exerciseList.innerHTML = exercises.length
    ? exercises
      .map((exercise) => `
        <button class="exercise-row ${exercise.id === activeExerciseId ? "active" : ""}" data-id="${exercise.id}" type="button">
          <div>
            <strong>${exercise.topic}</strong>
            <p>${exercise.question}</p>
          </div>
          <span>${exercise.difficultyLabel}</span>
        </button>
      `)
      .join("")
    : `<div class="empty-state"><h3>No hay ejercicios.</h3><p>Cambia el tema, búsqueda o dificultad.</p></div>`;

  exerciseList.querySelectorAll(".exercise-row").forEach((row) => {
    row.addEventListener("click", () => {
      activeExerciseId = row.dataset.id;
      renderExerciseList();
    });
  });

  renderExerciseViewer(selected);
}

function renderExerciseViewer(exercise) {
  if (!exercise) {
    exerciseViewer.innerHTML = `
      <div class="empty-state">
        <h3>Sin ejercicio seleccionado</h3>
        <p>Selecciona un ejercicio del banco.</p>
      </div>
    `;
    return;
  }

  exerciseViewer.innerHTML = `
    <div class="viewer-meta">
      <span>${exercise.difficultyLabel}</span>
      <span>${exercise.marks} pts</span>
    </div>
    <h3>${exercise.topic}</h3>
    <p class="learning-objective">${exercise.learningObjective}</p>
    <p class="viewer-question">${exercise.question}</p>
    <div class="method-box">
      <strong>Método sugerido</strong>
      <p>${exercise.method}</p>
    </div>
    <div class="viewer-context">
      <span>${exercise.community}</span>
      <span>${exercise.year}</span>
      <span>${exercise.id}</span>
    </div>
    <details open>
      <summary>Solución guiada</summary>
      <ol>
        ${(exercise.solutionSteps.length ? exercise.solutionSteps : solutionSteps(exercise.solution)).map((step) => `<li>${step}</li>`).join("")}
      </ol>
      <p>${exercise.solution}</p>
    </details>
    <div class="tutor-box">
      <div>
        <strong>Tutor IA</strong>
        <p>Pide una pista, una explicación más sencilla o una forma de empezar.</p>
      </div>
      <textarea id="tutorPrompt" rows="3" placeholder="Ej: explícame el primer paso sin darme la respuesta"></textarea>
      <button class="primary-button" type="button" id="askTutor">Preguntar al tutor</button>
      <div class="tutor-answer" id="tutorAnswer"></div>
    </div>
    <button class="primary-button viewer-practice" type="button" id="sendToPractice">Practicar en grande</button>
  `;

  exerciseViewer.querySelector("#askTutor").addEventListener("click", () => askTutor(exercise));
  exerciseViewer.querySelector("#sendToPractice").addEventListener("click", () => {
    subjectFilter.value = exercise.subject;
    hydrateTopics();
    topicFilter.value = exercise.topic;
    difficultyFilter.value = exercise.difficultyLabel;
    const pool = getFilteredQuestions();
    activeQuestionIndex = Math.max(0, pool.findIndex((item) => item.id === exercise.id));
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

function hydrateAiControls() {
  const options = subjects.map((subject) => `<option value="${subject.name}">${subject.name}</option>`).join("");
  tutorSubject.innerHTML = options;
  aiExamSubject.innerHTML = options;
  lessonSubject.innerHTML = options;
  hydrateTopicSelect(tutorSubject, tutorTopic);
  hydrateTopicSelect(aiExamSubject, aiExamTopic);
  hydrateTopicSelect(lessonSubject, lessonTopic);
}

function hydrateDojoMetaFilters() {
  const communities = [...new Set(questions.map((question) => question.community))].sort();
  const years = [...new Set(questions.map((question) => question.year))].sort();
  dojoCommunity.innerHTML = `<option value="all">Todas</option>${communities.map((item) => `<option value="${item}">${item}</option>`).join("")}`;
  dojoYear.innerHTML = `<option value="all">Todos</option>${years.map((item) => `<option value="${item}">${item}</option>`).join("")}`;
}

function hydrateTopicSelect(subjectSelect, topicSelect) {
  const topicSet = new Set(questions.filter((question) => question.subject === subjectSelect.value).map((question) => question.topic));
  topicSelect.innerHTML = [...topicSet].sort().map((topic) => `<option value="${topic}">${topic}</option>`).join("");
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
  exerciseSearch.addEventListener("input", renderExerciseList);
  dojoDifficulty.addEventListener("change", renderExerciseList);
  dojoCommunity.addEventListener("change", renderExerciseList);
  dojoYear.addEventListener("change", renderExerciseList);
  tutorSubject.addEventListener("change", () => hydrateTopicSelect(tutorSubject, tutorTopic));
  aiExamSubject.addEventListener("change", () => hydrateTopicSelect(aiExamSubject, aiExamTopic));
  lessonSubject.addEventListener("change", () => hydrateTopicSelect(lessonSubject, lessonTopic));
  generalTutorButton.addEventListener("click", askGeneralTutor);
  aiExamButton.addEventListener("click", buildAiExam);
  lessonButton.addEventListener("click", buildLesson);
  newFlashcardButton.addEventListener("click", () => {
    activeFlashcardIndex += 1;
    renderFlashcard();
  });
  document.querySelectorAll("[data-rating]").forEach((button) => {
    button.addEventListener("click", () => {
      flashcardReviews += 1;
      flashcardStatus.textContent = `Racha de memoria: ${flashcardReviews} tarjetas · última: ${button.dataset.rating}`;
      activeFlashcardIndex += 1;
      renderFlashcard();
    });
  });
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

async function buildMockExam() {
  const subjectName = mockSubject.value;
  const amount = Number(mockQuestions.value);
  const time = document.querySelector("#mockTime").value;
  mockResult.innerHTML = `
    <strong>Creando examen...</strong>
    <p>Seleccionando preguntas, bloques y hoja de corrección.</p>
  `;

  const exam = await postJson("/api/mock-exam", {
    subject: subjectName,
    amount,
    duration: Number(time),
    difficulty: "mixed"
  });

  if (!exam) {
    mockResult.innerHTML = `
      <strong>No se pudo crear el simulacro.</strong>
      <p>Revisa que el backend esté encendido y vuelve a intentarlo.</p>
    `;
    return;
  }

  mockResult.innerHTML = `
    ${renderExamOutput(exam)}
  `;
  wireExamForm(mockResult, exam);
}

async function askTutor(exercise) {
  const answerBox = exerciseViewer.querySelector("#tutorAnswer");
  const prompt = exerciseViewer.querySelector("#tutorPrompt").value;
  lastTutorExerciseId = exercise.id;
  answerBox.innerHTML = `<strong>El tutor está pensando...</strong>`;

  const tutor = await postJson("/api/tutor", {
    exerciseId: exercise.id,
    message: prompt
  });

  if (!tutor || lastTutorExerciseId !== exercise.id) return;

  answerBox.innerHTML = `
    ${renderTutorOutput(tutor)}
    <small>${tutor.disclaimer}</small>
  `;
}

async function askGeneralTutor() {
  generalTutorOutput.innerHTML = `<strong>El tutor está preparando una explicación...</strong>`;
  const tutor = await postJson("/api/tutor", {
    subject: tutorSubject.value,
    topic: tutorTopic.value,
    message: tutorMessage.value
  });

  generalTutorOutput.innerHTML = tutor ? renderTutorOutput(tutor) : `<strong>No se pudo contactar con el tutor.</strong>`;
}

async function buildAiExam() {
  aiExamOutput.innerHTML = `<strong>Generando preguntas nuevas...</strong>`;
  const exam = await postJson("/api/mock-exam", {
    subject: aiExamSubject.value,
    topic: aiExamTopic.value,
    amount: 5,
    duration: 90,
    difficulty: aiExamDifficulty.value,
    questionType: aiQuestionType.value,
    generateNew: true
  });

  aiExamOutput.innerHTML = exam ? renderExamOutput(exam) : `<strong>No se pudo generar el examen.</strong>`;
  currentGeneratedExam = exam;
  wireExamForm(aiExamOutput, exam);
}

async function buildLesson() {
  lessonOutput.innerHTML = `<strong>Creando lección...</strong>`;
  const lesson = await postJson("/api/lesson", {
    subject: lessonSubject.value,
    topic: lessonTopic.value,
    level: lessonLevel.value
  });

  if (!lesson) {
    lessonOutput.innerHTML = `<strong>No se pudo crear la lección.</strong>`;
    return;
  }

  lessonOutput.innerHTML = `
    <h4>${lesson.title}</h4>
    <p>${lesson.intro}</p>
    <h5>Ideas clave</h5>
    <ul>${lesson.keyIdeas.map((idea) => `<li>${idea}</li>`).join("")}</ul>
    <h5>Ejemplo guiado</h5>
    <ol>${lesson.guidedExample.map((step) => `<li>${step}</li>`).join("")}</ol>
    <h5>Mini práctica</h5>
    <p>${lesson.miniPractice.question}</p>
    <details>
      <summary>Ver solución</summary>
      <p>${lesson.miniPractice.solution}</p>
    </details>
  `;
}

function renderTutorOutput(tutor) {
  return `
    <strong>${tutor.response}</strong>
    <h5>Pistas</h5>
    <ul>${tutor.hints.map((hint) => `<li>${hint}</li>`).join("")}</ul>
    <h5>Pasos</h5>
    <ol>${tutor.steps.map((step) => `<li>${step}</li>`).join("")}</ol>
    <h5>Errores típicos</h5>
    <ul>${tutor.commonMistakes.map((mistake) => `<li>${mistake}</li>`).join("")}</ul>
    ${tutor.detectedError ? `<h5>Error detectado</h5><p>${tutor.detectedError}</p>` : ""}
    ${tutor.similarExercise ? `
      <h5>Ejercicio similar</h5>
      <p><strong>${tutor.similarExercise.topic}:</strong> ${tutor.similarExercise.question}</p>
    ` : ""}
    <p>${tutor.finalCheck}</p>
  `;
}

function renderExamOutput(exam) {
  return `
    <div class="exam-paper compact">
      <div class="exam-paper-cover">
        <span>${exam.header.examType} · ${exam.id}</span>
        <h3>${exam.title}</h3>
        <p>${exam.header.course} · ${exam.duration} minutos · ${exam.totalMarks.toFixed(1)} puntos</p>
        <div class="exam-timer">
          <strong data-exam-timer>${formatTimer(exam.duration * 60)}</strong>
          <button class="ghost-dark-button" type="button" data-start-timer>Iniciar temporizador</button>
        </div>
        <div class="official-meta">
          <strong>Material:</strong> ${exam.header.allowedMaterial}
        </div>
        <div class="official-meta">
          <strong>Criterio general:</strong> ${exam.header.scoring}
        </div>
      </div>
      <div class="exam-instructions">
        <strong>Instrucciones del examen</strong>
        <ol>${exam.instructions.map((item) => `<li>${item}</li>`).join("")}</ol>
      </div>
      ${exam.sections.map((section, sectionIndex) => `
        <section class="exam-section">
          <h4>${section.title}</h4>
          ${section.questions.map((question, index) => `
            <article class="exam-question">
              <strong>${sectionIndex + 1}.${index + 1} · ${question.topic} · ${question.marks} pts</strong>
              <p>${question.statement}</p>
              <label class="answer-field">
                Tu respuesta
                <textarea data-answer-id="${question.id}" rows="6" placeholder="Escribe aquí tu desarrollo, cálculos y conclusión..."></textarea>
              </label>
            </article>
          `).join("")}
        </section>
      `).join("")}
      <details class="answer-key">
        <summary>Hoja de corrección y soluciones</summary>
        ${exam.answerKey.map((item) => `
          <article>
            <strong>${item.number}. ${item.topic} · ${item.marks} pts</strong>
            <p>${item.solution}</p>
            ${item.rubric ? `<ul>${item.rubric.map((line) => `<li>${line}</li>`).join("")}</ul>` : ""}
          </article>
        `).join("")}
      </details>
      <button class="primary-button grade-exam-button" type="button" data-grade-exam>Corregir y dar nota</button>
      <div class="grade-output" data-grade-output></div>
    </div>
  `;
}

function wireExamForm(container, exam) {
  const gradeButton = container.querySelector("[data-grade-exam]");
  const output = container.querySelector("[data-grade-output]");
  const timerButton = container.querySelector("[data-start-timer]");
  const timerLabel = container.querySelector("[data-exam-timer]");
  if (!gradeButton || !output || !exam) return;

  if (timerButton && timerLabel) {
    timerButton.addEventListener("click", () => startExamTimer(timerLabel, exam.duration * 60, timerButton));
  }

  gradeButton.addEventListener("click", async () => {
    const answers = {};
    container.querySelectorAll("[data-answer-id]").forEach((textarea) => {
      answers[textarea.dataset.answerId] = textarea.value;
    });

    output.innerHTML = `<strong>Corrigiendo examen...</strong>`;
    const grade = await postJson("/api/grade-exam", { exam, answers });
    output.innerHTML = grade ? renderGradeOutput(grade) : `<strong>No se pudo corregir el examen.</strong>`;
  });
}

function startExamTimer(label, seconds, button) {
  clearInterval(runningTimer);
  let remaining = seconds;
  button.disabled = true;
  button.textContent = "Temporizador activo";
  label.textContent = formatTimer(remaining);
  runningTimer = setInterval(() => {
    remaining -= 1;
    label.textContent = formatTimer(Math.max(remaining, 0));
    if (remaining <= 0) {
      clearInterval(runningTimer);
      button.textContent = "Tiempo terminado";
      label.closest(".exam-timer")?.classList.add("is-finished");
    }
  }, 1000);
}

function formatTimer(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function renderGradeOutput(grade) {
  return `
    <div class="grade-summary">
      <span>Nota</span>
      <strong>${grade.score.toFixed(2)} / ${grade.maxScore.toFixed(2)}</strong>
      <p>${grade.gradeLabel} · ${grade.percentage}%</p>
      <p>${grade.summary}</p>
    </div>
    <div class="grade-breakdown">
      ${grade.graded.map((item) => `
        <article>
          <strong>Pregunta ${item.number}: ${item.score.toFixed(2)} / ${item.maxMarks.toFixed(2)}</strong>
          <p>${item.feedback}</p>
        </article>
      `).join("")}
    </div>
  `;
}

async function postJson(path, payload) {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Request failed");
    return await response.json();
  } catch {
    return null;
  }
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

function renderFlashcard() {
  if (!questions.length) return;
  const question = questions[activeFlashcardIndex % questions.length];
  flashcardSubject.textContent = `${question.subject} · ${question.topic}`;
  flashcardQuestion.textContent = `¿Cómo se empieza un ejercicio de ${question.topic}?`;
  flashcardAnswer.textContent = question.method || solutionSteps(question.solution)[0] || question.solution;
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
