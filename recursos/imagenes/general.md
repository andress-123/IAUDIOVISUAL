# Imagen estática — Recursos generales

Recursos sobre prompting para imagen que no son específicos de una herramienta concreta (aplican a varias o a los fundamentos).

## Recursos

### [Fifty Frames, Decoded](https://www.waviboy.com/free/fifty-frames)
- **Herramienta(s):** Genérico (funciona con cualquier modelo de imagen: Midjourney, DALL·E, Flux, etc.)
- **Tipo:** Imagen (aplicable también a fotogramas de vídeo)
- **Categoría:** Iluminación y cinematografía / estructura de prompt
- **Resumen:** Vault gratuito de @bywaviboy con 50 fotogramas de películas muy bien iluminadas, agrupados en 8 "situaciones de luz" (sol, luz gris del norte, ventana, una bombilla, fluorescente, sodio nocturno, neón, vacío/void). Cada fotograma se "decodifica" en: dirección/calidad de la luz, paleta de 3 hex exactos, stock/grade de película, y una línea "Steal" lista para pegar en un prompt cambiando solo el sujeto.
- **Técnica clave — el framework de decodificación ("Frame Thief"):** para analizar y clonar la estética de cualquier fotograma de referencia, pedirle al modelo que lo descomponga en 5 bloques y luego reconstruya el prompt manteniéndolos fijos y cambiando solo el sujeto:
  1. **LIGHT:** dirección de la key light, dura o suave, ratio de contraste, practicals, hora del día.
  2. **LENS:** focal, distancia de cámara, altura de cámara, inclinación.
  3. **GRADE:** paleta en 3 valores hex, curva de contraste, stock de película al que se parece.
  4. **COMPOSITION:** regla de encuadre, espacio negativo, dónde se sitúa el sujeto y por qué.
  5. **TEXTURE:** grano, halación, difusión, imperfecciones.
  Luego: *"Escribe UN prompt de imagen que reconstruya exactamente esta estética alrededor de un nuevo sujeto: [SUJETO]. Mantén cada decisión de luz, lente, grade y textura. No cambies nada más que el sujeto."*
- **Ejemplos de línea "Steal" (una por categoría de luz):**
  - *Sol de frente:* "Pon el sol directamente detrás de la cabeza del sujeto, deja que el flare inunde el objetivo, y expón para la mejilla para que todo lo demás quede dorado." (American Honey)
  - *Luz gris/nublada:* "Coloca al sujeto de frente a cámara contra una pared corrugada bajo luz nublada plana, manos en la cadera, inexpresivo, sin glamour." (Fish Tank)
  - *Ventana:** "Ilumina con una única ventana alta justo a la izquierda de cámara, luz de relleno fría del propio cuarto, y posa al sujeto como si llevara una hora posando para un pintor." (Portrait of a Lady on Fire)
  - *Una bombilla:* "Cuelga una única luz dura sobre una pared deteriorada, coloca al sujeto justo al borde del haz, y deja que el noventa por ciento del encuadre muera en negro." (In the Mood for Love)
  - *Sodio nocturno:* "Ilumina la noche con las propias luces del edificio, sujeto de espaldas caminando hacia el charco de luz, sodio cálido contra pintura verde azulada." (Moonlight)
  - *Neón:* "Sumerge la escena en luz negra azul y viste al sujeto con un color fluorescente; el vestuario se convierte en la luz clave." (Uncut Gems)
  - *Vacío/void:* "Construye un espacio todo blanco iluminado de forma uniforme y viste al sujeto medio tono por debajo de las paredes; presencia por casi-desaparición." (The Neon Demon)
- **Extra:** incluye "The Library", una lista de 12 webs de referencia para robar fotogramas y aplicarles este mismo framework: film-grab.com, directorslibrary.com, jontirudd.com/mograph, eyecannndy.com, shotdeck.com, artofthetitle.com, flim.ai, frameset.app, thecolorsofmotion.com, fontsinuse.com, the-brandidentity.com, adsoftheworld.com.
- **Añadido:** 2026-09-26

### [The Poster Laws](https://www.waviboy.com/free/poster-laws)
- **Herramienta(s):** ChatGPT / DALL·E (modelos con generación de texto dentro de la imagen); aplicable a otros modelos que rendericen tipografía
- **Tipo:** Imagen
- **Categoría:** Diseño de pósters / estructura de prompt / texto en imagen
- **Resumen:** Pack gratuito de @bywaviboy con "6 leyes" de diseño de pósters y 6 prompts de ejemplo (club night, small business, statement, etc.). Parte de un problema conocido: pedir a la vez "diseño" y "texto exacto" hace que el modelo destroce el texto. La solución es un **prompt en dos mensajes**.
- **Técnica clave 1 — Prompting en dos mensajes (dirección de arte primero, texto exacto después):**
  1. **Mensaje 1:** solo dirección de arte (composición, tratamiento fotográfico, tipografía, color, acabado de impresión) — nunca se menciona el texto real todavía.
  2. **Mensaje 2:** solo el texto exacto entre llaves `{...}` a insertar en los huecos ya definidos (titular, línea de info, sello, código de barras...), insistiendo en "cada letra correctamente escrita".
  Esto evita que el modelo intente resolver diseño y ortografía a la vez y reduce muchísimo el texto mal escrito.
- **Técnica clave 2 — Las "6 leyes" (chuleta de diseño de póster para prompts):**
  1. *La fotografía es el material:* foto real o imagen de archivo tratada (recorte, dúotono, tramado, fotocopiado) — nunca un render 3D. Solo tipografía es válido si las letras solas transmiten la imagen.
  2. *Solo dos tamaños de tipografía:* un gesto enorme + texto mono diminuto (specs). Nada de tamaños intermedios.
  3. *El layout actúa la idea:* repeticiones, "fantasmas", rutas, una figura que la foto rompe — describe el mecanismo, no el ambiente.
  4. *La "ephemera" lo hace real:* código de barras, bloque de specs, sello, chips numerados, palabras fragmentadas — dos o tres, siempre diminutos.
  5. *Un único color plano y llamativo lo sostiene todo:* nombrar el hex exacto. Negro estricto sobre papel también es válido si la textura hace el trabajo del color.
  6. *Debe sobrevivir a la impresión:* pedir grano, ruido de escaneado, desalineación, pliegues — pedir "el escaneo de la pieza impresa", no el archivo digital.
- **Añadido:** 2026-09-26
