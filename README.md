# Nota14

MVP de una plataforma de preparación PAU española inspirada en RevisionDojo, Duolingo y productos educativos premium.

## Incluye

- Landing premium, rápida y responsive.
- Banco de preguntas por asignatura con filtros por tema, dificultad, comunidad y año.
- Base local JSON con 500 ejercicios PAU y normalización a las asignaturas objetivo.
- Tutor IA local para pistas, pasos, errores típicos y ejercicio similar.
- Generador de exámenes independiente con hoja de respuesta, temporizador y corrección sobre 10.
- Exam Mode con simulacros desde la base de datos.
- Dashboard alumno con dominio, racha, horas y plan de estudio.
- Flashcards de repetición espaciada para teoría y métodos.
- Bloque SEO programático para rutas como `/examen-pau-matematicas-madrid`.
- Backend Node mínimo con APIs listas para sustituir por IA real y base de datos persistente.

## Ejecutar

```bash
npm start
```

Abre:

```text
http://127.0.0.1:5173/
```

## Endpoints MVP

- `GET /api/exercises`: ejercicios con filtros por asignatura, tema, dificultad, comunidad, año, búsqueda y límite.
- `GET /api/subjects`: listado de asignaturas.
- `GET /api/dashboard`: métricas demo de alumno.
- `GET /api/flashcards`: tarjetas generadas desde el temario.
- `GET /api/seo-pages`: páginas SEO programáticas.
- `POST /api/mock-exam`: genera un examen PAU completo con bloques, instrucciones y hoja de corrección.
- `POST /api/grade-exam`: corrige respuestas escritas y devuelve nota, porcentaje y feedback.
- `POST /api/tutor`: tutor educativo para pedir pistas, pasos y errores típicos.
- `POST /api/lesson`: genera una lección por asignatura, tema y nivel.

## Siguiente fase

- Login y perfiles de alumno.
- Persistencia de intentos, errores y progreso.
- Plan freemium/premium a 9.99 euros/mes.
- Tutor IA conectado a un modelo real.
- Panel admin para cargar exámenes oficiales y revisar calidad de ejercicios.
