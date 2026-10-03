---
name: bloques
description: Redacta los mega-prompts de Claqueta (Fase 4), uno por bloque temporal, con el look de cámara al inicio y el máximo detalle de actuación, dentro del límite de 10.000 caracteres de Seedance. Úsalo cuando el guion esté listo.
---

# /bloques [número de bloque opcional]

Lee primero `.claude/skills/claqueta/SKILL.md`.

1. Elige el proyecto. Comprueba que hay `guion` que cubre los bloques; si faltan planos, avisa y sugiere `/guion`.
2. Calcula los bloques: n = ceil(`duracion` / `bloque`). El bloque `i` va de `i*bloque` a `min((i+1)*bloque, duracion)`. Los planos de cada bloque son los que empiezan dentro de ese rango, con tiempos relativos al inicio del bloque.
3. Mira las imágenes de entornos, personajes y props (chat o `img.id`) para describir con fidelidad su aspecto.
4. Estructura de cada prompt (en el idioma del usuario):
   - Cabecera: `BLOQUE i de n: X segundos continuos. Los personajes no cambian de lugar entre cortes.`
   - `LOOK GLOBAL`: cámara, lente, película, paleta hex y notas del `estilo`, siempre al principio.
   - `REFERENCIAS`: cada locación, personaje (vestuario, voz) y prop (con su nombre genérico), y por cada personaje la línea `Usa el <audio> como referencia de audio para el Personaje <id>.`
   - `GUION SEGUNDO A SEGUNDO`: cada plano con rango de tiempo, cámara, espacio, acción, microexpresiones, física y sonido y diálogo, ampliados con mirada, manos, respiración, ritmo y sonido ambiente.
5. Longitud: apunta a 8.500-9.500 caracteres y nunca superes 10.000 (cuéntalos antes de escribir). Sustituye `props[].real` por `generico` y no uses marcas.
6. Escribe cada texto en `bloques.<i>.final` (conserva `notas` y `estado`; si el bloque no tenía estado, ponlo en `pend`). Si el usuario indicó un número de bloque, solo ese.
7. Resume: longitud de cada bloque y, si hace falta, qué recortaste. Pide recargar la página para copiarlos.
