---
name: assets
description: Rellena la Fase 2 de Claqueta. Describe las imágenes de entornos, personajes y props y redacta sus prompts de Midjourney, ChatGPT y prop sheets con el look del fotograma. Úsalo cuando el usuario suba o pegue imágenes de assets.
---

# /assets

Lee primero `.claude/skills/claqueta/SKILL.md`.

1. Elige el proyecto y lee su `estilo` (el look). Si `estilo` está vacío, avisa de que conviene hacer antes `/fotograma`.
2. Reúne las imágenes: las pegadas en el chat (pregunta a qué asset corresponde cada una si no es evidente) y las de `locaciones[].img`, `personajes[].img` y `props[].img`.
3. Para cada asset que lo necesite, escribe:
   - **Entorno** (`locaciones[i]`): `desc` si está vacía (lugar, elementos, luz, hora; sin personas) y `prompt`: un prompt en inglés para Midjourney v7 de 60-110 palabras que genere el entorno vacío replicando cámara, lente, película, paleta y luz del `estilo`. Sin parámetros: la página añade `--sref`, `--ar`, `--w`, `--chaos`, `--v`.
   - **Personaje** (`personajes[i]`): `ropa` si está vacía (solo vestuario y estilo, nada de rasgos faciales) y `prompt` en español para ChatGPT: hoja de personaje fotorrealista con frente, perfil, tres cuartos, espalda y expresiones, vestuario concreto, fondo gris neutro, look del `estilo`, y la instrucción de mantener exactamente el rostro de la foto adjunta.
   - **Prop** (`props[i]`): si el objeto tiene marca o copyright, rellena `real` y propón `generico` (p. ej. Tamagotchi → Pixel Pal); `desc` de forma, materiales y colores; si la imagen tiene texto o logos, anótalo como "Borrar en Photoshop: …"; `prompt` en español de hoja de utilería (frente, lateral, detalle, fondo neutro) llamando al objeto solo por su nombre genérico y exigiendo cero texto o logotipos.
4. No pises lo que el usuario ya escribió; completa los vacíos y reescribe un `prompt` solo si está vacío o el usuario lo pide.
5. Escribe `locaciones`, `personajes` y `props` completos siguiendo las reglas de escritura, y resume qué quedó listo para copiar a cada herramienta.
