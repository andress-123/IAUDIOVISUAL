# X9 · Dirección creativa

## Insight
Hacemos 1.000 fotos y no vivimos ninguna. La pantalla se ha convertido en el obstáculo entre la persona y el momento.

## Idea central
**«Mira el momento. No la pantalla.»**
La X9 no tiene pantalla de revisión: eso no es una carencia, es la propuesta. Vendemos *presencia*, no megapíxeles.

## Posicionamiento
Cámara digital de bolsillo con alma de película de carrete: aprietas, confías y descubres las fotos después. Para quien echa de menos la espera y la imperfección; también para niños, viajes, fiestas y regalo.

## Tono de voz
- **Cálido y humano**, nunca técnico por defecto (las specs viven abajo, a una pulsación).
- **Seguro, con un punto de ironía**: «Sin pantalla. Sin filtros. Sin segundas oportunidades.»
- **Frases cortas**, verbos de acción (apunta, dispara, olvida, descubre).
- **Honestidad como marca**: 8 MP y foco fijo se presentan como carácter, no se maquillan. Esa sinceridad es lo que convierte.
- Se habla de *tú*. Español neutro.

## Estilo visual
| Elemento | Decisión |
|---|---|
| Atmósfera | Editorial analógico: papel crema, tinta casi negra, un único acento «cuero naranja» sacado del propio producto |
| Color | `#F2EADD` papel · `#16120E` tinta · `#D8602A` naranja · `#8A7B68` apagado |
| Tipografía | **Fraunces** (serif de contraste, titulares con cursiva expresiva) + **Inter Tight** (UI/cuerpo) + mono para datos/contador |
| Textura | Grano sutil sobre todo el sitio, bordes tipo fotograma, contador «00168» como motivo recurrente (viene del OLED real) |
| Producto | Siempre protagonista, grande, sobre fondo papel (`mix-blend-mode: multiply`) |
| Movimiento | Aparición suave al scroll, hover con micro-elevación; respeta `prefers-reduced-motion` |

## Arquitectura de conversión (de arriba abajo)
1. **Barra de anuncio** – envío / garantía.
2. **Hero** – promesa + producto + precio + CTA + 3 pruebas rápidas.
3. **Franja de confianza** – envío, devolución, garantía, pago seguro.
4. **Manifiesto** – por qué sin pantalla (el «porqué emocional»).
5. **Cómo funciona** – 3 pasos (reduce la fricción: «¿es difícil?»).
6. **Estilos de película** – Retro · Classic · Mono (diferenciador).
7. **Bento de características** – beneficio primero, dato después.
8. **Para quién** – casos de uso (regalo, niños, viajes, fiestas).
9. **Comprador (configurador)** – color, cantidad, packs y CTA; la barra pegajosa móvil lo repite siempre.
10. **Especificaciones** – tabla completa, sin letra pequeña.
11. **FAQ** – elimina objeciones (tarjeta, calidad, cómo ver las fotos).
12. **CTA final + footer.**

## Principios de UX
- Un único CTA primario repetido (hero → compra → barra móvil → final).
- Precio y stock visibles pronto; garantía junto al botón.
- Objeciones resueltas en el punto de duda (FAQ + micro-copy).
- Móvil primero: barra de compra fija, objetivos táctiles ≥ 44 px, sin scroll horizontal.
- Accesibilidad: contraste AA, foco visible, `alt` descriptivos, acordeones nativos `<details>`.

## Qué tienes que completar antes de lanzar
Todo está en `CONFIG` al inicio de `app.js`: nombre de marca, precio, enlace de checkout (Shopify / Stripe / WhatsApp), email de contacto. Los datos de envío, garantía y devoluciones del copy son **plantilla**: ajústalos a tu política real. Las fotos son los renders del proveedor (llevan «BRAND»): sustitúyelas por fotos propias o renders con tu marca antes de publicar. No incluyo reseñas inventadas: añade las reales cuando las tengas.
