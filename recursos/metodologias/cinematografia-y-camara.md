# Metodología: Cinematografía y movimiento de cámara (vídeo)

Base de partida — vocabulario útil para prompts de vídeo.

## Tipos de plano
- Gran plano general / establishing shot
- Plano general / wide shot
- Plano medio / medium shot
- Primer plano / close-up
- Plano detalle / extreme close-up

## Movimientos de cámara
- Tracking shot (seguimiento lateral)
- Dolly in / dolly out (acercamiento/alejamiento)
- Pan (barrido horizontal) / Tilt (barrido vertical)
- Crane / aerial shot (grúa o dron)
- Handheld (cámara en mano, look documental)
- Static shot (cámara fija)

## Framework de decodificación de fotogramas ("Frame Thief")

Para clonar la estética de un fotograma de referencia (foto o cine) en un prompt propio, descomponerlo en 5 bloques y luego reconstruir manteniéndolos fijos, cambiando solo el sujeto:

1. **LIGHT:** dirección de la luz clave, dura o suave, ratio de contraste, luces prácticas, hora del día.
2. **LENS:** focal, distancia de cámara, altura de cámara, inclinación.
3. **GRADE:** paleta en 3 valores hex exactos, curva de contraste, stock de película al que se parece.
4. **COMPOSITION:** regla de encuadre, espacio negativo, dónde se sitúa el sujeto y por qué.
5. **TEXTURE:** grano, halación, difusión, imperfecciones.

Prompt plantilla: *"Reverse-engineer this frame completely, as a cinematographer would: [los 5 bloques]. Then write ONE image prompt that rebuilds this exact aesthetic around a new subject: [SUJETO]. Keep every light, lens, grade and texture decision. Change nothing but the subject."*

Es agnóstico de herramienta y funciona tanto para prompts de imagen como para definir el "look" de un plano de vídeo antes de escribir el movimiento de cámara.
*(Fuente: [Fifty Frames, Decoded](https://www.waviboy.com/free/fifty-frames) — ver `recursos/imagenes/general.md` para ejemplos de líneas "Steal" por tipo de luz)*

## Recursos

_Pega aquí enlaces sobre cinematografía y camera control en vídeo IA y los integro._
