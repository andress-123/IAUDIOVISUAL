---
name: guion
description: Escribe el guion técnico de Claqueta, plano a plano y segundo a segundo, a partir de los assets, imágenes y look del proyecto, o de una idea del usuario. Úsalo cuando el guion esté vacío o haya que continuarlo.
---

# /guion [idea opcional]

Lee primero `.claude/skills/claqueta/SKILL.md`.

1. Elige el proyecto y reúne el material: `estilo` (look y emoción), `locaciones`, `personajes` (nombre, vestuario, voz), `props` (usa solo `generico`), `duracion`, `bloque`, las imágenes de los assets y la `idea` (del proyecto o la que el usuario escriba junto al comando). Si el usuario escribe una idea, guárdala en `idea`.
2. Sin idea, inventa tú una historia breve, original y con un giro emocional coherente con los assets. Usa todos los entornos, personajes y props, y dale un papel claro al objeto clave.
3. Si ya hay planos, continúa desde el último `fin` hasta `duracion` y no cambies los existentes. Si el usuario pide rehacer, pregunta antes de reemplazarlos.
4. Cada plano:
   - `ini`/`fin`: 2 a 6 segundos, sin huecos ni solapes, y ninguno cruza un múltiplo de `bloque`.
   - `camara`: tipo de plano y movimiento ("Plano aéreo picado", "Travelling lento").
   - `espacio`: posición exacta de cada personaje respecto al entorno.
   - `accion`: qué ocurre.
   - `micro`: 2-4 microexpresiones precisas ("se muerde el labio", "levanta la ceja izquierda", "los hombros caen por decepción").
   - `fisica`: física y sonido con la superficie ("el teléfono cae sobre el césped, golpe sordo, no concreto").
   - `pj` y `texto`: diálogo breve solo si aporta; `pj` es el `id` del personaje.
5. Voces: si un personaje no tiene `voz`, proponla (origen y acento) y escríbela en `personajes[].voz`.
6. Escribe `guion` (ordenado por `ini`), `idea` y los `personajes` si cambiaste voces, siguiendo las reglas de escritura. Resume la historia en 3 líneas y lista los planos con sus tiempos.
