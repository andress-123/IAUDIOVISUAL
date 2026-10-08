# Playground · landing

Web estática (HTML + JS, sin dependencias ni servidor) para convertir una foto en
una nube de cuadros o en un retrato de píxeles de tamaños mezclados con la paleta exacta.

- `index.html` — página y estilos
- `generador.js` — algoritmo (separa figura, tono → relleno/degradado, genera el SVG)
- `app.js` — interfaz, subida, descargas SVG/PNG

Todo se procesa en el navegador; ninguna imagen se sube.

## Probar en local

    cd landing && python3 -m http.server 8000   # y abrir http://localhost:8000

## Publicar

Cualquier hosting estático sirve (GitHub Pages: Settings → Pages → rama
`claude/image-generation-app-hfjant`, carpeta `/landing` si se mueve a `/docs`,
o copiar la carpeta a la raíz del sitio).
