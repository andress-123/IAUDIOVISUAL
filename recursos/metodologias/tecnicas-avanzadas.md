# Metodología: Técnicas avanzadas de prompting

## Guardrails / líneas "do-not"

Fijar explícitamente qué NO debe pasar (cortes, teletransportación, materiales imposibles, caras sustituidas...) protege la coherencia de una generación larga o compleja mucho más que solo describir lo que sí se quiere. La regla práctica: si hay que acortar el prompt, se recorta la descripción antes de tocar las líneas de prohibición.
*(Fuente: [The Seedance Pack](https://www.waviboy.com/free/seedance-pack) — ver `recursos/video/seedance.md`)*

## Un trabajo por prompt

Cada prompt/framework debe resolver una única función (un tipo de plano, una identidad, una pasada de física, etc.). Si una toma necesita combinar dos funciones, se apilan las reglas de ambos frameworks en vez de fusionar las descripciones en una sola frase: el modelo lo interpreta como un único contrato con varias reglas, no como una idea difusa.
*(Fuente: [The Seedance Pack](https://www.waviboy.com/free/seedance-pack))*

## Prompting en dos mensajes: dirección de arte primero, texto exacto después

Cuando la imagen debe incluir texto legible (carteles, pósters, packaging), separar en dos mensajes evita que el modelo intente resolver composición y ortografía a la vez:
1. Mensaje 1: solo dirección de arte (composición, tratamiento, tipografía, color, acabado) — sin mencionar el texto real.
2. Mensaje 2: solo el texto exacto entre llaves para rellenar los huecos ya definidos, pidiendo explícitamente que cada letra esté bien escrita.
*(Fuente: [The Poster Laws](https://www.waviboy.com/free/poster-laws) — ver `recursos/imagenes/general.md`)*

## Recursos

_Pega aquí enlaces sobre técnicas avanzadas (weighted prompts, multi-prompt, blending, seeds, remix, etc.) y los integro._
