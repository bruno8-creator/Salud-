# PAU Mastery

Frontend para una plataforma de repaso PAU/EBAU inspirada en productos tipo Revision Village o Revision Dojo.

## Incluye

- Landing premium enfocada en práctica de examen.
- Dashboard de asignaturas y dominio.
- Banco de preguntas filtrable por asignatura, tema y dificultad.
- Base local de 500 ejercicios originales tipo PAU desde `data/pau_exercises_500.json`.
- Soluciones paso a paso.
- Generador visual de simulacros PAU.
- Panel de progreso y plan de estudio diario.
- Servidor Node mínimo para servir la app mientras preparamos backend real.

## Ejecutar

```bash
npm start
```

Abre:

```text
http://127.0.0.1:5173/
```

## Siguiente backend

La estructura está lista para conectar APIs de:

- `GET /api/exercises`: ejercicios con filtros por asignatura, tema, dificultad, búsqueda y límite.
- `GET /api/subjects`: listado de asignaturas.
- `POST /api/mock-exam`: genera un examen PAU completo con bloques, instrucciones y hoja de corrección.
- `POST /api/tutor`: tutor educativo para pedir pistas, pasos y errores típicos sobre un ejercicio.

Pendiente para una versión con usuarios:

- Usuarios y sesiones
- Guardado de intentos
- Historial de simulacros
- Progreso real por tema
- Tutor IA conectado a modelo externo

## Datos incluidos

La carpeta `data/` contiene:

- `pau_exercises_500.json`: 500 ejercicios originales tipo PAU.
- `README_SCHEMA.md`: descripción del esquema de datos.

El frontend carga los ejercicios desde:

```text
GET /api/exercises
```
