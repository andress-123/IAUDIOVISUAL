---
name: musica
description: Redacta el prompt de música para Udio o Suno (Fase 6) a partir de los tiempos exactos del guion de Claqueta, con tempo, tonalidad, instrumentos e impactos. Úsalo cuando el montaje o el guion estén cerrados.
---

# /musica [indicaciones]

Lee primero `.claude/skills/claqueta/SKILL.md`.

1. Elige el proyecto y lee `guion` (cortes y momentos clave), `estilo.emocion` y `duracion`. Si el usuario pega los tiempos de su montaje final, úsalos en lugar de los del guion.
2. Define:
   - `bpm`, `tono` e `instr` según la emoción (p. ej. piano lento, 62 BPM, Do menor).
   - `estilo`: arco emocional en una frase.
   - `hits`: los impactos con su segundo (`t`) y qué los provoca (`d`): golpes de física, cambios de emoción, giros.
3. Escribe `musica` en el proyecto siguiendo las reglas de escritura.
4. Entrega en el chat el prompt final listo para pegar en Udio o Suno, en un bloque de texto: instrumentos, BPM, tonalidad, estilo, duración total, momentos clave con su segundo, cambios de plano e "instrumental, sin voz".
5. Menciona los efectos de sonido que salen de `guion[].fisica` para buscarlos en Artlist, con su segundo.
