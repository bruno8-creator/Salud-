const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 5173;
const ROOT = __dirname;
const DATABASE_PATH = path.join(ROOT, "data", "pau_exercises_500.json");
const exerciseDatabase = loadExerciseDatabase();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const staticExtensions = [".css", ".js", ".svg", ".png", ".jpg", ".jpeg", ".webp"];

  if (url.pathname === "/api/exercises") {
    return sendJson(res, exerciseDatabase);
  }

  if (url.pathname === "/api/subjects") {
    const subjects = [...new Set(exerciseDatabase.exercises.map((exercise) => exercise.subject))];
    return sendJson(res, { subjects });
  }

  if (staticExtensions.includes(path.extname(url.pathname))) {
    return serveStatic(url.pathname, res);
  }

  return serveStatic("/index.html", res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`PAU Mastery running at http://127.0.0.1:${PORT}`);
});

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

function sendJson(res, data) {
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
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
