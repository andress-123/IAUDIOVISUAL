---
name: fotograma
description: Lee una captura de Shotdeck (fotograma + panel de datos) y rellena la Fase 1 de Claqueta, con cámara, lente, película, emoción, notas de look y colores hex. Úsalo cuando el usuario pegue un fotograma de referencia.
---

# /fotograma

Lee primero `.claude/skills/claqueta/SKILL.md` (referencia de datos y reglas de escritura).

1. Consigue la imagen: la que el usuario haya pegado en el chat; si no hay, la de `estilo.img` del proyecto (ver "Ver las imágenes" en la referencia). Si no hay ninguna, pídela.
2. Elige el proyecto (el más reciente, salvo que el usuario diga otro).
3. Lee el panel de datos de la captura, tal cual aparece:
   - `camara`: el campo CAMERA.
   - `lente`: el modelo si aparece; si solo pone un tamaño (Wide, Medium…), escribe eso y di que el modelo no se ve.
   - `pelicula`: la película si es analógico; si es digital, escribe "Digital" más el aspect ratio y el colorista si aparecen.
4. Colores hex: si la captura incluye la franja de paleta de Shotdeck, léelos de los píxeles de cada celda, no de memoria (`pip install -q pillow`, abre la imagen, muestrea el centro de cada celda). Si no hay franja, calcula los 6-8 colores dominantes del fotograma. Quédate con los 8 más distintos entre sí.
5. `emocion`: una frase sobre qué transmite el fotograma (tags, composición, gestos).
6. `notas`: lugar y hora, tipo de plano, composición, luz, color, fondo y grano, en 2-4 frases. Usa los campos del panel (LIGHTING, COLOR, SHOT TYPE, TIME OF DAY, SET).
7. `ia`: una línea que diga qué se leyó del panel y qué se estimó, y que los hex vienen de la paleta o de los píxeles.
8. Escribe `estilo` completo (conservando `img` y `panel`) siguiendo las reglas de escritura.
9. Resume en una tabla los valores guardados y avisa de lo que el usuario debe revisar (lente exacta, título si no aparece).
