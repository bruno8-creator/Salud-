const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 5173;
const ROOT = __dirname;

const exercises = [
  {
    id: "bench-press",
    category: "Pecho",
    name: "Press banca",
    summary: "Básico de empuje para ganar fuerza y masa en pecho, tríceps y hombro anterior.",
    cues: ["Escápulas atrás y abajo", "Pies firmes", "Barra baja con control"]
  },
  {
    id: "squat",
    category: "Pierna",
    name: "Sentadilla",
    summary: "Movimiento principal para cuádriceps, glúteo, core y coordinación global.",
    cues: ["Rodillas alineadas", "Tronco estable", "Profundidad sin perder postura"]
  },
  {
    id: "deadlift",
    category: "Posterior",
    name: "Peso muerto",
    summary: "Bisagra de cadera para cadena posterior, agarre y fuerza total.",
    cues: ["Barra pegada", "Cadera atrás", "Bloqueo sin hiperextender"]
  },
  {
    id: "pull-up",
    category: "Espalda",
    name: "Dominadas",
    summary: "Tirón vertical exigente para dorsales, bíceps y control escapular.",
    cues: ["Pecho alto", "Codos hacia abajo", "Rango completo"]
  },
  {
    id: "hip-thrust",
    category: "Glúteo",
    name: "Hip thrust",
    summary: "Ejercicio clave para glúteo con alta tensión y progresión sencilla.",
    cues: ["Mentón recogido", "Pausa arriba", "Costillas abajo"]
  },
  {
    id: "shoulder-press",
    category: "Hombro",
    name: "Press militar",
    summary: "Empuje vertical para hombro, tríceps y estabilidad del core.",
    cues: ["Glúteos activos", "Barra cerca", "Cabeza entra al final"]
  },
  {
    id: "romanian-deadlift",
    category: "Femoral",
    name: "Peso muerto rumano",
    summary: "Trabajo controlado de isquios y glúteo con énfasis en estiramiento.",
    cues: ["Rodilla suave", "Cadera atrás", "Espalda neutra"]
  },
  {
    id: "lat-pulldown",
    category: "Espalda",
    name: "Jalón al pecho",
    summary: "Alternativa accesible para desarrollar dorsales y mejorar el tirón.",
    cues: ["No balancear", "Pecho alto", "Codos a los bolsillos"]
  }
];

const articles = [
  {
    tag: "Técnica",
    title: "Progresar sin romper la técnica",
    excerpt: "Antes de subir peso, completa todas las series con rango estable, control y una repetición en reserva."
  },
  {
    tag: "Hipertrofia",
    title: "Volumen efectivo para ganar músculo",
    excerpt: "La mayoría progresa con 10-18 series semanales por grupo muscular, ajustando según recuperación."
  },
  {
    tag: "Fuerza",
    title: "Por qué importan los básicos",
    excerpt: "Sentadilla, banca, peso muerto, press y dominadas permiten medir progreso y construir una base sólida."
  },
  {
    tag: "Nutrición",
    title: "Proteína, energía y constancia",
    excerpt: "No hace falta complicarse: proteína suficiente, calorías acordes al objetivo y comidas repetibles."
  },
  {
    tag: "Recuperación",
    title: "El descanso también entrena",
    excerpt: "Dormir bien y controlar la fatiga mejora rendimiento, adherencia y resultados a medio plazo."
  },
  {
    tag: "Movilidad",
    title: "Movilidad útil para el gym",
    excerpt: "Cadera, tobillo, columna torácica y hombro son las zonas que más desbloquean buenos patrones."
  }
];

const routineLibrary = {
  muscle: {
    title: "Rutina Fitzerd de hipertrofia",
    note: "Volumen progresivo, series cerca del fallo y descansos de 60-120 segundos según el ejercicio.",
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
    title: "Rutina Fitzerd de fuerza",
    note: "Básicos pesados, margen técnico y descansos largos. La prioridad es mover mejor, no solo mover más.",
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
    title: "Rutina Fitzerd de definición",
    note: "Fuerza, superseries y cardio dosificado para gastar más sin perder músculo.",
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
    title: "Rutina Fitzerd de salud",
    note: "Equilibrio entre fuerza, movilidad y energía diaria para construir hábito.",
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

const levelGuidance = {
  beginner: "Nivel principiante: deja 2-3 repeticiones en reserva y aprende la técnica antes de subir carga.",
  intermediate: "Nivel intermedio: registra pesos y busca pequeñas progresiones semanales.",
  advanced: "Nivel avanzado: controla fatiga alternando semanas de volumen y semanas más pesadas."
};

const equipmentGuidance = {
  full: "Material: usa máquinas y pesos libres para progresar con precisión.",
  dumbbells: "Material: adapta máquinas a mancuernas, banco y trabajo unilateral.",
  bodyweight: "Material: usa tempo lento, pausas e isometrías para mantener intensidad."
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, { ok: true, app: "Fitzerd" });
  }

  if (req.method === "GET" && url.pathname === "/api/exercises") {
    return sendJson(res, exercises);
  }

  if (req.method === "GET" && url.pathname === "/api/articles") {
    return sendJson(res, articles);
  }

  if (req.method === "GET" && url.pathname === "/api/content") {
    return sendJson(res, { exercises, articles });
  }

  if (req.method === "POST" && url.pathname === "/api/routines") {
    const body = await readJson(req);
    return sendJson(res, buildRoutine(body));
  }

  serveStatic(url.pathname, res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Fitzerd running at http://127.0.0.1:${PORT}`);
});

function buildRoutine(input = {}) {
  const goal = routineLibrary[input.goal] ? input.goal : "muscle";
  const days = clamp(Number(input.days) || 4, 2, 6);
  const plan = routineLibrary[goal];
  const extras = Array.isArray(input.extras) ? input.extras : [];

  return {
    title: plan.title,
    note: plan.note,
    guidance: `${levelGuidance[input.level] || levelGuidance.beginner} ${equipmentGuidance[input.equipment] || equipmentGuidance.full}`,
    days: Array.from({ length: days }, (_, index) => ({
      title: `Día ${index + 1}: ${plan.split[index % plan.split.length]}`,
      items: [...plan.exercises[index % plan.exercises.length], buildExtrasLine(extras, index)]
    }))
  };
}

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

  return suggestions.length ? suggestions.join(" | ") : "Final: respiración y estiramiento suave 5 min";
}

function serveStatic(requestPath, res) {
  const safePath = path.normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, safePath === "/" ? "index.html" : safePath);

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

function sendJson(res, data) {
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
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

function getContentType(filePath) {
  const ext = path.extname(filePath);
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg"
  };

  return types[ext] || "application/octet-stream";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
