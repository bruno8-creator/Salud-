const form = document.querySelector("#routineForm");
const daysInput = document.querySelector("#days");
const daysOutput = document.querySelector("#daysOutput");
const result = document.querySelector("#routineResult");

const plans = {
  muscle: {
    title: "Rutina de hipertrofia estética",
    note: "Volumen medio-alto, técnica limpia y progresión semanal. Descansa 60-90 segundos en accesorios y 2 minutos en básicos.",
    split: ["Pecho + tríceps", "Espalda + bíceps", "Pierna completa", "Hombro + core", "Torso volumen", "Pierna + glúteo"],
    exercises: [
      ["Press banca 4x8", "Press inclinado mancuernas 3x10", "Fondos asistidos 3x10", "Extensión tríceps 3x12"],
      ["Dominadas o jalón 4x8", "Remo con barra 4x10", "Pullover polea 3x12", "Curl bíceps 3x12"],
      ["Sentadilla 4x8", "Prensa 3x12", "Peso muerto rumano 3x10", "Gemelo 4x14"],
      ["Press militar 4x8", "Elevaciones laterales 4x12", "Face pull 3x15", "Plancha 3x45s"],
      ["Press máquina 3x10", "Remo sentado 3x10", "Aperturas 3x12", "Curl martillo 3x12"],
      ["Hip thrust 4x10", "Zancadas 3x12", "Curl femoral 3x12", "Abductores 3x15"]
    ]
  },
  strength: {
    title: "Rutina de fuerza progresiva",
    note: "Prioriza básicos, descansos largos y margen técnico. Sube carga solo cuando completes todas las series con buena forma.",
    split: ["Sentadilla + empuje", "Peso muerto + tirón", "Press + pierna", "Full body pesado", "Técnica + accesorios", "Potencia controlada"],
    exercises: [
      ["Sentadilla 5x5", "Press banca 5x5", "Remo 4x6", "Core antirotación 3x10"],
      ["Peso muerto 5x3", "Dominadas 4x6", "Remo pecho apoyado 3x8", "Curl femoral 3x10"],
      ["Press militar 5x5", "Sentadilla frontal 4x6", "Fondos 3x8", "Farmer walk 4x30m"],
      ["Sentadilla 3x5", "Banca 3x5", "Peso muerto 3x3", "Dominadas 3x6"],
      ["Pausa sentadilla 4x4", "Press cerrado 4x6", "Face pull 3x15", "Plancha pesada 3x30s"],
      ["Saltos al cajón 5x3", "Kettlebell swing 4x12", "Empuje trineo 6x20m", "Movilidad cadera 8min"]
    ]
  },
  fatloss: {
    title: "Rutina de definición activa",
    note: "Combina fuerza, superseries y cardio dosificado. Mantén intensidad alta sin sacrificar técnica.",
    split: ["Full body A", "Cardio + core", "Full body B", "Metabólico", "Pierna + cardio", "Torso + intervalos"],
    exercises: [
      ["Goblet squat 4x12", "Press mancuernas 3x12", "Remo polea 3x12", "Caminata inclinada 15min"],
      ["Bici 8x40s", "Dead bug 3x12", "Plancha lateral 3x30s", "Movilidad torácica 6min"],
      ["Peso muerto rumano 4x10", "Jalón 3x12", "Press hombro 3x10", "Step ups 3x12"],
      ["Circuito 4 rondas", "Kettlebell swing 15 reps", "Flexiones 12 reps", "Remo TRX 12 reps"],
      ["Prensa 4x12", "Curl femoral 3x12", "Zancadas 3x14", "Elíptica 18min"],
      ["Press inclinado 3x12", "Remo sentado 3x12", "Battle ropes 8x30s", "Core 8min"]
    ]
  },
  health: {
    title: "Rutina de salud y constancia",
    note: "Equilibrio entre fuerza, movilidad y energía diaria. Ideal para crear hábito y mejorar postura.",
    split: ["Full body suave", "Movilidad + cardio", "Fuerza base", "Recuperación activa", "Full body técnico", "Core + estabilidad"],
    exercises: [
      ["Sentadilla goblet 3x10", "Press máquina 3x10", "Remo sentado 3x10", "Caminata 12min"],
      ["Movilidad cadera 8min", "Bici zona 2 20min", "Respiración 4min", "Estiramientos 6min"],
      ["Peso muerto rumano 3x10", "Jalón al pecho 3x10", "Press hombro 3x10", "Pallof press 3x12"],
      ["Caminata rápida 25min", "Foam roller 6min", "Movilidad hombro 6min", "Core suave 6min"],
      ["Prensa 3x12", "Flexiones inclinadas 3x10", "Remo mancuerna 3x10", "Gemelo 3x12"],
      ["Plancha 3x35s", "Bird dog 3x10", "Farmer walk 3x30m", "Estabilidad tobillo 5min"]
    ]
  }
};

const equipmentAdjustments = {
  full: "Usa máquinas y pesos libres para progresar con precisión.",
  dumbbells: "Sustituye máquinas por mancuernas, banco y variantes unilaterales.",
  bodyweight: "Usa tempo lento, pausas y más repeticiones para mantener intensidad."
};

const levelAdjustments = {
  beginner: "Mantén 2-3 repeticiones en reserva y aprende la técnica antes de subir peso.",
  intermediate: "Trabaja con progresión semanal y registra cargas en los básicos.",
  advanced: "Alterna semanas de volumen y semanas más pesadas para controlar fatiga."
};

daysInput.addEventListener("input", () => {
  daysOutput.textContent = `${daysInput.value} días`;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const goal = document.querySelector("#goal").value;
  const level = document.querySelector("#level").value;
  const days = Number(daysInput.value);
  const equipment = document.querySelector("#equipment").value;
  const extras = [...document.querySelectorAll("fieldset input:checked")].map((item) => item.value);
  const selectedPlan = plans[goal];

  const dayCards = Array.from({ length: days }, (_, index) => {
    const splitName = selectedPlan.split[index % selectedPlan.split.length];
    const exercises = selectedPlan.exercises[index % selectedPlan.exercises.length];
    const extrasLine = buildExtrasLine(extras, index);
    return `
      <article class="day-card">
        <strong>Día ${index + 1}: ${splitName}</strong>
        <ul>
          ${exercises.map((exercise) => `<li>${exercise}</li>`).join("")}
          <li>${extrasLine}</li>
        </ul>
      </article>
    `;
  }).join("");

  result.className = "routine-plan";
  result.innerHTML = `
    <h3>${selectedPlan.title}</h3>
    <p class="routine-note">${selectedPlan.note}</p>
    <p class="routine-note">${levelAdjustments[level]} ${equipmentAdjustments[equipment]}</p>
    <div class="day-list">${dayCards}</div>
  `;
});

function buildExtrasLine(extras, index) {
  const suggestions = [];

  if (extras.includes("core")) {
    suggestions.push(index % 2 === 0 ? "Core: plancha + dead bug 8 min" : "Core: pallof press + hollow hold 8 min");
  }

  if (extras.includes("mobility")) {
    suggestions.push("Movilidad: cadera, tobillo y hombro 7 min");
  }

  if (extras.includes("cardio")) {
    suggestions.push(index % 2 === 0 ? "Cardio: zona 2 durante 12-18 min" : "Cardio: intervalos suaves 8x30s");
  }

  return suggestions.length ? suggestions.join(" | ") : "Final: 5 min de respiración y estiramiento suave";
}
