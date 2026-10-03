---
name: iterar
description: Corrige un bloque ya generado en Seedance/Artcraft a partir de lo que el usuario dicte que falló (p. ej. "en el segundo 5 hay un silencio incómodo"), y reescribe su prompt. Úsalo en la Fase 5.
---

# /iterar <bloque> <qué falló>

Lee primero `.claude/skills/claqueta/SKILL.md`.

1. Identifica el bloque (número que dice el usuario, 1-based en la página, `bloques.<i>` 0-based en los datos) y el proyecto.
2. Las notas del usuario pueden venir de dictado por voz: limpia el texto, conserva los segundos exactos y guárdalas en `bloques.<i>.notas` (añade, no borres las anteriores). Pasa `estado` a `iter`.
3. Parte del prompt actual (`bloques.<i>.final`, o si no existe, reconstrúyelo con la estructura de `/bloques`).
4. Reescribe el prompt para corregir exactamente lo indicado en el segundo indicado y deja intacto lo que funcionó: mismos tiempos, misma posición de personajes, mismo look y misma línea de audio. Si el fallo es físico (algo que cae, un silencio, una risa a destiempo), concreta tiempos, superficie y sonido.
5. Máximo 10.000 caracteres (cuéntalos). Guarda en `bloques.<i>.final`.
6. Resume el cambio en 2-3 líneas ("segundo 4: empieza a reír…") y pide recargar la página.
