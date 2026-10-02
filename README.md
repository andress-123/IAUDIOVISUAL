# IAUDIOVISUAL — Repositorio de prompts para IA (imagen y vídeo)

Repositorio de referencia para recopilar, ordenar y reutilizar todo lo que vayamos encontrando sobre **cómo escribir prompts** para generar contenido audiovisual con IA: imágenes estáticas y vídeo.

El objetivo no es solo guardar enlaces, sino convertir cada recurso en algo accionable: técnicas, estructuras de prompt y plantillas que se puedan aplicar en cualquier herramienta (Midjourney, DALL·E, Stable Diffusion, Flux, Runway, Sora, Kling, Pika, Veo, etc.).

## Cómo funciona

1. **Tú pegas enlaces** (a mí, en la conversación) sobre prompting de imagen o vídeo con IA.
2. **Yo los reviso, extraigo lo útil y los clasifico** en el archivo que corresponda dentro de `recursos/`, con un resumen corto y las técnicas clave.
3. Si un recurso aporta una técnica reutilizable, la añado también a `metodologias/` y, si tiene sentido, la convierto en plantilla dentro de `plantillas/`.
4. Si aún no lo he clasificado, el enlace queda temporalmente en [`INBOX.md`](./INBOX.md).

## Estructura

```
recursos/
├── imagenes/          # Recursos específicos de generación de imagen estática
│   ├── general.md
│   ├── midjourney.md
│   ├── dalle.md
│   ├── stable-diffusion.md
│   ├── flux.md
│   └── otras-herramientas.md
├── video/              # Recursos específicos de generación de vídeo
│   ├── general.md
│   ├── runway.md
│   ├── sora.md
│   ├── kling.md
│   ├── pika.md
│   ├── seedance.md
│   └── otras-herramientas.md
└── metodologias/       # Técnicas y estructuras de prompt agnósticas de herramienta
    ├── estructura-de-prompts.md
    ├── tecnicas-avanzadas.md
    ├── prompts-negativos.md
    ├── cinematografia-y-camara.md
    ├── consistencia-de-personajes-y-estilo.md
    └── parametros-y-sintaxis.md

plantillas/             # Plantillas de prompt listas para reutilizar
├── plantilla-prompt-imagen.md
└── plantilla-prompt-video.md

glosario.md             # Términos clave de prompting explicados
INBOX.md                # Enlaces pendientes de clasificar
```

## Formato de cada entrada de recurso

Cada enlace guardado sigue este formato para que sea fácil de escanear:

```markdown
### [Título del recurso](URL)
- **Herramienta(s):** Midjourney / DALL·E / Runway / genérico...
- **Tipo:** Imagen | Vídeo | Ambos
- **Categoría:** estructura de prompt / cinematografía / estilo / técnica avanzada...
- **Resumen:** 1-3 líneas con la idea clave, sin relleno.
- **Técnica clave:** la técnica concreta que se puede reutilizar (si aplica).
- **Añadido:** YYYY-MM-DD
```

## Cómo usar esto para generar prompts

Cuando quieras generar un prompt para una herramienta concreta, dime:
- la herramienta de destino,
- si es imagen o vídeo,
- y qué quieres conseguir (estilo, escena, movimiento de cámara, etc.)

y usaré lo recopilado en `recursos/` y `metodologias/` para construir el prompt, además de las plantillas de `plantillas/`.

## Herramienta: `vpipe` (workflow de piezas de vídeo)

CLI en Python (sin dependencias) que sistematiza el workflow de 6 fases: preproducción (Shotdeck) → assets → guion técnico → mega-prompt → generación/voice lock → postproducción.

```bash
python herramienta/vpipe.py nueva "Mi vídeo" --duracion 60 --bloque 30   # crea proyectos/mi-video/
python herramienta/vpipe.py estado "Mi vídeo"        # checklist por fase
python herramienta/vpipe.py check "Mi vídeo" 1 2     # marca fase 1, item 2
python herramienta/vpipe.py prompt "Mi vídeo"        # mega-prompts por bloque (límite 10.000 car.)
python herramienta/vpipe.py voz "Mi vídeo"           # pasos del voice lock (MP4 negro)
python herramienta/vpipe.py feedback "Mi vídeo" 1 "seg 5 silencio incómodo, reír en el 4"
python herramienta/vpipe.py musica "Mi vídeo"        # prompt para Udio/Suno
```

Todo el estado vive en `proyectos/<nombre>/project.json` (estilo Shotdeck, personajes, props, guion plano a plano, música). `prompt` antepone los metadatos de cámara a cada bloque, cita el audio de referencia y sustituye automáticamente nombres con copyright por el genérico (p. ej. Tamagotchi → Pixel Pal).

### Versión visual: `Claqueta`

`herramienta/claqueta.html` es la misma idea como aplicación web (artifact de Claude): una tira con las 6 fases y su progreso, formularios para estilo/assets/guion, línea de tiempo con avisos, prompts por bloque con contador de 10.000 caracteres, botones para pedir a Claude que amplíe o corrija un prompt, y generador de prompt de música. Los proyectos se guardan en la base de datos del artifact.
