const form = document.querySelector("#routineForm");
const daysInput = document.querySelector("#days");
const daysOutput = document.querySelector("#daysOutput");
const result = document.querySelector("#routineResult");
const exerciseGrid = document.querySelector("#exerciseGrid");
const articleGrid = document.querySelector("#articleGrid");
const cursorGlow = document.querySelector(".cursor-glow");

const fallbackExercises = [
  {
    id: "bench-press",
    category: "Fuerza",
    name: "Press banca",
    summary: "Básico de empuje para pecho, tríceps y hombro anterior.",
    cues: ["Escápulas atrás", "Pies firmes", "Barra controlada"]
  },
  {
    id: "squat",
    category: "Pierna",
    name: "Sentadilla",
    summary: "Movimiento principal para pierna completa, core y estabilidad.",
    cues: ["Rodillas alineadas", "Espalda neutra", "Profundidad controlada"]
  },
  {
    id: "deadlift",
    category: "Posterior",
    name: "Peso muerto",
    summary: "Bisagra de cadera para cadena posterior y fuerza global.",
    cues: ["Barra cerca", "Cadera atrás", "Bloqueo fuerte"]
  },
  {
    id: "pull-up",
    category: "Espalda",
    name: "Dominadas",
    summary: "Tirón vertical para dorsales, bíceps y control corporal.",
    cues: ["Pecho alto", "Codos abajo", "Rango completo"]
  }
];

const fallbackArticles = [
  {
    tag: "Técnica",
    title: "Cómo progresar sin lesionarte",
    excerpt: "Sube carga cuando la técnica se mantenga estable y deja margen en las series clave."
  },
  {
    tag: "Nutrición",
    title: "Proteína y músculo",
    excerpt: "Reparte proteína durante el día y prioriza alimentos sencillos antes de complicarte."
  },
  {
    tag: "Recuperación",
    title: "Descanso que sí cuenta",
    excerpt: "Dormir bien, caminar y controlar volumen hace que la rutina funcione de verdad."
  }
];

init();

function init() {
  setupEffects();
  loadContent();
  setupRoutineForm();
}

function setupEffects() {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.55 }
  );

  document.querySelectorAll("[data-count]").forEach((item) => countObserver.observe(item));

  window.addEventListener("mousemove", (event) => {
    cursorGlow.style.opacity = "1";
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
  });
}

async function loadContent() {
  const content = await getJson("/api/content", {
    exercises: fallbackExercises,
    articles: fallbackArticles
  });

  renderExercises(content.exercises);
  renderArticles(content.articles);
}

function renderExercises(exercises) {
  exerciseGrid.innerHTML = exercises
    .map(
      (exercise, index) => `
        <article class="exercise-card reveal" style="transition-delay: ${index * 55}ms">
          <span>${exercise.category}</span>
          <h3>${exercise.name}</h3>
          <p>${exercise.summary}</p>
          <ul>
            ${exercise.cues.map((cue) => `<li>${cue}</li>`).join("")}
          </ul>
        </article>
      `
    )
    .join("");

  document.querySelectorAll(".exercise-card.reveal").forEach((item) => {
    setTimeout(() => item.classList.add("is-visible"), 80);
  });
}

function renderArticles(articles) {
  articleGrid.innerHTML = articles
    .map(
      (article, index) => `
        <article class="article-card reveal" style="transition-delay: ${index * 70}ms">
          <span>${article.tag}</span>
          <h3>${article.title}</h3>
          <p>${article.excerpt}</p>
        </article>
      `
    )
    .join("");

  document.querySelectorAll(".article-card.reveal").forEach((item) => {
    setTimeout(() => item.classList.add("is-visible"), 80);
  });
}

function setupRoutineForm() {
  daysInput.addEventListener("input", () => {
    daysOutput.textContent = `${daysInput.value} días`;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    result.className = "routine-plan";
    result.innerHTML = `
      <h3>Fitzerd Coach está pensando...</h3>
      <p class="routine-note">Analizando objetivo, nivel, días y material disponible.</p>
    `;

    const payload = {
      goal: document.querySelector("#goal").value,
      level: document.querySelector("#level").value,
      days: Number(daysInput.value),
      equipment: document.querySelector("#equipment").value,
      extras: [...document.querySelectorAll("fieldset input:checked")].map((item) => item.value)
    };

    const routine = await postJson("/api/routines", payload, buildFallbackRoutine(payload));
    renderRoutine(routine);
  });
}

function renderRoutine(routine) {
  const dayCards = routine.days
    .map(
      (day) => `
        <article class="day-card">
          <strong>${day.title}</strong>
          <ul>
            ${day.items.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </article>
      `
    )
    .join("");

  result.className = "routine-plan";
  result.innerHTML = `
    <h3>${routine.title}</h3>
    <p class="routine-note">${routine.note}</p>
    <p class="routine-note">${routine.guidance}</p>
    <div class="day-list">${dayCards}</div>
  `;
}

async function getJson(path, fallback) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error("Request failed");
    return await response.json();
  } catch {
    return fallback;
  }
}

async function postJson(path, payload, fallback) {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Request failed");
    return await response.json();
  } catch {
    return fallback;
  }
}

function animateCount(element) {
  const target = Number(element.dataset.count);
  const suffix = element.nextElementSibling?.textContent?.startsWith("%") ? "%" : "";
  const duration = 1100;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = `${Math.round(target * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function buildFallbackRoutine(payload) {
  const labels = {
    muscle: "Rutina de hipertrofia Fitzerd",
    strength: "Rutina de fuerza Fitzerd",
    fatloss: "Rutina de definición Fitzerd",
    health: "Rutina de salud Fitzerd"
  };

  const split = ["Torso", "Pierna", "Empuje", "Tirón", "Full body", "Core + cardio"];
  const items = [
    ["Press banca 4x8", "Remo sentado 4x10", "Elevaciones laterales 3x14", "Plancha 3x45s"],
    ["Sentadilla 4x8", "Peso muerto rumano 3x10", "Zancadas 3x12", "Gemelo 4x14"],
    ["Press militar 4x8", "Fondos asistidos 3x10", "Extensión tríceps 3x12", "Cardio zona 2 12min"],
    ["Dominadas o jalón 4x8", "Remo con barra 4x10", "Face pull 3x15", "Curl bíceps 3x12"],
    ["Prensa 3x12", "Press mancuernas 3x10", "Jalón 3x12", "Farmer walk 4x30m"],
    ["Dead bug 3x12", "Pallof press 3x12", "Bici 8x30s", "Movilidad 8min"]
  ];

  return {
    title: labels[payload.goal],
    note: "Plan generado localmente si el backend no está disponible.",
    guidance: "Mantén técnica limpia, registra cargas y ajusta volumen si la fatiga sube demasiado.",
    days: Array.from({ length: payload.days }, (_, index) => ({
      title: `Día ${index + 1}: ${split[index % split.length]}`,
      items: items[index % items.length]
    }))
  };
}
