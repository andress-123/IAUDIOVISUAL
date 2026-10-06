# Identidad visual — reglas fijas

Fuente de verdad: **`svg_referencia.svg`** (Illustrator, 1920×1080). Si algo generado no respeta esto, está mal.

## 1. Colores EXACTOS (8 pasos por familia, de la referencia)
Cada familia es una escalera fija de 8 pasos; las piezas de un grupo usan los 8 pasos en orden.

| Familia | Paso 1 → Paso 8 |
|---|---|
| Azul | `#00a0e3 #0098e7 #0091eb #0089ef #0081f3 #0079f7 #0072fb #006aff` |
| Cian | `#5dcfff #50d5ff #42daff #35e0ff #28e5ff #1bebff #0df0ff #00f6ff` |
| Verde | `#2bb500 #25bc12 #1fc424 #19cb36 #12d247 #0cd959 #06e16b #00e87d` |
| Amarillo-naranja | `#fdbc00 #fdaf00 #fea200 #fe9500 #fe8700 #fe7a00 #ff6d00 #ff6000` |
| Rojo-magenta | `#e20613 #e6052b #ea0443 #ee035b #f30374 #f7028c #fb01a4 #ff00bc` |
| Gris neutro | `#cbcbcb #c4c4c4 #bcbcbc #b5b5b5 #aeaeae #a7a7a7 #9f9f9f #989898` |

- **No existe el verde lima**: no usarlo.
- Fondo **blanco**; la referencia no tiene fondo propio (el blanco solo aparece como un cuadrado suelto = hueco).

## 2. Modos de fusión (de la referencia)
- **`hard-light` en casi todos los grupos**; **`overlay` en algunos** (p. ej. grupos de tiras finas y la peana).
- Todo dentro de un grupo **aislado** (`isolation: isolate`): las capas se mezclan entre sí, nunca con el blanco de la página → se dibuja sobre capa **transparente** y se pasa a blanco al final.
- Las piezas de un grupo **se solapan** a propósito (ancho > paso) para que se mezclen.

## 3. Cómo es la referencia (renderizada, no solo leída)
- **Filas 1-2: composiciones rectangulares abstractas** (*Cabio, Adelantarse, Encontrar, Vanguardia*): bloques de franjas que se solapan en hard-light dentro de un rectángulo, sin contorno.
- **Fila 3: pictogramas pequeños y aireados**, hechos con las mismas piezas: estrella radial de tiras que se encogen · arco con sol naranja (*Horizonte*) · **anillo de 8 cuadrados** con aguja (reloj/brújula) · árbol de bloques verdes · paisaje de bloques con **peana gris** debajo.
- El **círculo** siempre es un anillo de cuadrados girados; no hay discos rellenos.

## 4. Primitivas (todas en grupos de 8)
1. **Columnas solapadas** — 8 rectángulos iguales, paso < ancho (meridianos/franjas).
2. **Filas que crecen** — rectángulos apilados cuyo ancho crece (triángulo escalonado), alineados a izquierda, derecha o centro.
3. **Cuñas** — columnas con altura decreciente, alineadas por la base y desplazadas.
4. **Abanico** — trapecios/lentes que convergen en un punto (perspectiva, meridianos).
5. **Tiras giradas −45°** que se encogen a lo largo de una diagonal (destello/flecha), a veces recortadas por una ventana.
6. **Anillo de cuadrados** sobre una elipse (órbita).
7. **Escalones diagonales** y **bloque plano grande** de contraste.

## 5. Los ejercicios van de lo abstracto a lo icónico
Franjas y rampas → composiciones (abanicos, cuñas) → formas con significado (anillo, planta, montaña, flecha). Etiquetas de la referencia: *Cambio, Adelantarse, Encontrar, Vanguardia, Horizonte*.
Ejemplo aplicado: el **globo** en 5 niveles (`app/globo/`): 1 malla de franjas · 2 meridianos y paralelos · 3 disco pixelado + anillo + peana · 4 globo con continentes · 5 **pictograma** en el lenguaje estricto de la referencia (anillo de cuadrados + bloques verdes + rayos + peana).

## 6. Nuestro estilo (sobre lo anterior)
- **Pixel**: bloques de varios tamaños (grandes donde el color es plano, pequeños en el detalle), con degradados en **tiras que recorren los pasos exactos de su familia**.
- **Huecos en blanco** y **partículas** del mismo píxel solo en zonas aleatorias pegadas a la forma (expansión).
- **Legibilidad de la forma**: la forma la da la claridad/tono dentro del degradado; el matiz cambia despacio. Nada de sombras sucias.
