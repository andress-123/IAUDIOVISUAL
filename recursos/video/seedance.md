# Vídeo — Seedance

## Recursos

### [The Seedance Pack](https://www.waviboy.com/free/seedance-pack)
- **Herramienta(s):** Seedance 2.5
- **Tipo:** Vídeo
- **Categoría:** Estructura de prompt / consistencia / técnicas avanzadas
- **Resumen:** Pack gratuito de @bywaviboy con 7 "marcos" (frameworks) de prompt copy-paste para Seedance 2.5, cada uno pensado para un trabajo concreto: plano único de 30s sin cortes, identidad de personaje bloqueada, combinación de hasta 7 referencias en un mundo coherente, física realista, restyle de vídeo manteniendo la interpretación, movimiento de cámara dirigido, y sonido sincronizado. La idea central: todo lo que está fuera de los corchetes `[...]` es un "guardrail" que no se debe tocar; solo se rellenan los corchetes.
- **Técnica clave 1 — Guardrails con líneas "do-not":** las frases que prohíben explícitamente errores típicos (cortes, teletransportación, tela de goma, pelo congelado, caras sustituidas) son las que realmente sostienen el prompt. Acortar la descripción antes que tocar esas líneas.
- **Técnica clave 2 — Un trabajo por prompt:** cada framework cumple una única función (un plano, una identidad, una pasada de física...). Si un plano necesita dos cosas a la vez, se pega el segundo framework de reglas debajo del primero en vez de fusionar las descripciones; el modelo las lee como un único contrato.
- **Técnica clave 3 — Rol y jerarquía en múltiples referencias:** al usar varias imágenes de referencia (hasta 7), asignar a cada una un rol explícito (identidad del personaje, vestuario, localización, iluminación, composición de cámara, movimiento, sonido/atmósfera) y establecer un orden de prioridad cuando compiten: **identidad > entorno > acción > estilo**. Sin rol ni jerarquía, el modelo "promedia" las referencias y el resultado se vuelve borroso.
- **Técnica clave 4 — "Filmado dentro, no un filtro":** al re-estilizar un vídeo existente, especificar que el resultado debe parecer "genuinely filmed inside [MUNDO DESEADO]" y no un vídeo original con un filtro de color encima. Se pide mantener interpretación, labios, timing y cámara exactos, y solo cambiar dirección de arte, iluminación, paleta, materiales y acabado.

#### Los 7 marcos (resumen para reutilizar)

1. **Plano único (one-take):** "Crea un plano ininterrumpido de 30 segundos de [SUJETO] en [LUGAR]. Empieza con [ACCIÓN INICIAL] y desarrolla gradualmente hacia [ACCIÓN/ENTORNO FINAL] mientras la cámara [MOVIMIENTO DE CÁMARA]. No uses cortes, transiciones, montajes, resets ni teletransportación. Cada cambio debe ocurrir de forma natural dentro del mismo plano. Preserva identidad, ropa, props, dirección de luz y estructura del entorno del sujeto del primer al último fotograma."
2. **Bloqueo de personaje (character lock):** con una imagen de referencia adjunta — "Usa la imagen adjunta como referencia exacta del personaje. Preserva cara, estructura facial, tono de piel, peinado, proporciones corporales, ropa, accesorios y detalles distintivos en cada fotograma y ángulo de cámara. El sujeto realiza [ACCIÓN] mientras la cámara [MOVIMIENTO]. No dupliques, re-estilices ni reemplaces al personaje."
3. **Siete referencias con rol asignado:** ver técnica clave 3 arriba.
4. **Contrato de física:** pedir explícitamente tela, pelo y agua con peso/momento realistas y prohibir materiales flotantes, tela de goma, pelo congelado o agua que desaparece.
5. **Restyle de vídeo:** ver técnica clave 4 arriba.
6. **Movimiento de cámara dirigido:** definir tamaño/ángulo de plano inicial, un movimiento concreto (fly-through, órbita, macro push-in, handheld tracking, crane rise) con principio-medio-fin claro y composición final.
7. **Sonido sincronizado:** describir escena, diálogo entre comillas, pasos según superficie/movimiento y sonido de ropa, para audio nativo sincronizado con la acción.

- **Añadido:** 2026-09-26
