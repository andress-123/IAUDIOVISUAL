#!/usr/bin/env python3
"""vpipe — sistematiza el workflow de piezas de vídeo con IA (6 fases).

Uso:  python herramienta/vpipe.py --help
Sin dependencias externas (solo Python 3.9+).
"""
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROYECTOS = ROOT / "proyectos"
LIMITE_CHARS = 10_000  # límite del prompt de Seedance

FASES = {
    "1-preproduccion": ("Preproducción y dirección de arte", [
        "Fotograma de Shotdeck elegido (emoción > estética)",
        "Metadatos técnicos anotados (cámara, lente, película, hex)",
        "Captura de fotograma + metadatos guardada en 1-preproduccion/",
    ]),
    "2-assets": ("Assets: entornos, personajes, utilería", [
        "Prompt de Midjourney redactado con Claude (lente y cámara)",
        "Entorno generado (Style Ref + Image Prompt) y limpiado con Edit",
        "Character sheets generadas (ChatGPT / DALL-E 3)",
        "Props generados; texto/marcas borrados y nombre genérico asignado",
    ]),
    "3-guion": ("Guionización técnica", [
        "Guion segundo a segundo (cámara + tiempo) en project.json / Google Docs",
        "Posición espacial de personajes definida",
        "Microexpresiones detalladas en cada plano",
        "Física y sonido especificados (superficie, materiales)",
        "Voz/acento asignado a cada personaje",
    ]),
    "4-megaprompt": ("Mega-prompt", [
        "Imágenes y guion subidos a Claude",
        "Prompts generados con `vpipe prompt` (<=10.000 caracteres)",
        "Metadatos de cámara al inicio de cada bloque",
        "Vídeo dividido en bloques continuos (p. ej. 30 s)",
    ]),
    "5-generacion": ("Generación y voice lock", [
        "Frase con todos los fonemas grabada",
        "Audio exportado como MP4 con pantalla negra (Video 1)",
        "Character/prop/location sheets subidos a Artcraft",
        "Bloque 1 generado y revisado",
        "Feedback registrado con `vpipe feedback` e iterado hasta toma convincente",
    ]),
    "6-postproduccion": ("Minería y postproducción", [
        "Scene Edit Detection aplicada en Premiere",
        "Mejores 2-3 s de cada generación minados",
        "Espacios muertos y silencios eliminados",
        "Diseño sonoro en Artlist (3-4 pistas en los primeros 15 s + SFX)",
        "Banda sonora generada (Udio/Suno) con `vpipe musica`",
        "Lumetri aplicado y copiado a todos los clips",
        "Subtítulos añadidos",
    ]),
}

FRASE_FONEMAS = "The quick beige fox jumped in the air over each thin dog."


def slug(texto):
    t = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-") or "proyecto"


def ruta_proyecto(nombre):
    p = PROYECTOS / slug(nombre)
    if not (p / "project.json").exists():
        sys.exit(f"No existe el proyecto '{nombre}'. Créalo con: vpipe nueva \"{nombre}\"")
    return p


def cargar(p):
    return json.loads((p / "project.json").read_text(encoding="utf-8"))


def guardar(p, data):
    (p / "project.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def fmt_t(s):
    return f"{int(s // 60):02d}:{int(s % 60):02d}"


# ---------------------------------------------------------------- comandos

def cmd_nueva(a):
    p = PROYECTOS / slug(a.nombre)
    if p.exists():
        sys.exit(f"Ya existe {p}")
    for fase in FASES:
        (p / fase).mkdir(parents=True)
    (p / "4-megaprompt" / "salida").mkdir()
    data = {
        "nombre": a.nombre,
        "duracion_s": a.duracion,
        "bloque_s": a.bloque,
        "estilo": {
            "referencia_shotdeck": "1-preproduccion/fotograma.png",
            "camara": "Arri Alexa 35",
            "lente": "Signature Prime",
            "pelicula": "",
            "hex": [],
            "notas": "profundidad de campo, iluminación y look a mantener en todas las escenas",
        },
        "personajes": [{
            "id": "A", "nombre": "Personaje A", "ficha": "2-assets/personaje_a.png",
            "voz": "origen y acento mental, p. ej. 'amigo australiano del sureste asiático'",
        }],
        "props": [{
            "nombre_real": "Tamagotchi", "nombre_generico": "Pixel Pal",
            "ficha": "2-assets/prop_pixel_pal.png",
        }],
        "locaciones": [{"id": "L1", "ficha": "2-assets/entorno.png", "descripcion": ""}],
        "audio_referencia": {"etiqueta": "Video 1", "personaje": "A",
                             "archivo": "5-generacion/voz_negro.mp4",
                             "frase": FRASE_FONEMAS},
        "guion": [{
            "inicio": 0, "fin": 2,
            "camara": "Plano aéreo picado",
            "espacio": "Personaje A sentado a la izquierda del encuadre, sobre el césped",
            "accion": "",
            "microexpresiones": ["se muerde el labio", "levanta la ceja izquierda"],
            "fisica_sonido": "el teléfono cae sobre el césped (golpe sordo, no concreto)",
            "dialogo": [{"personaje": "A", "texto": ""}],
        }],
        "musica": {"tempo_bpm": 62, "tonalidad": "Do menor", "instrumentos": "piano lento",
                   "estilo": "", "impactos": [{"t": 12, "descripcion": "impacto/riser"}]},
        "checklist": {f: [False] * len(items) for f, (_, items) in FASES.items()},
        "feedback": [],
    }
    guardar(p, data)
    print(f"Proyecto creado en {p.relative_to(ROOT)}\n"
          f"Edita project.json (estilo, personajes, props, guion) y sigue con `vpipe estado`.")


def cmd_estado(a):
    p = ruta_proyecto(a.nombre)
    d = cargar(p)
    print(f"# {d['nombre']}  ({fmt_t(d['duracion_s'])} en bloques de {d['bloque_s']} s)\n")
    for f, (titulo, items) in FASES.items():
        marcas = d["checklist"][f]
        print(f"Fase {titulo}  [{sum(marcas)}/{len(items)}]  ({f})")
        for i, (it, m) in enumerate(zip(items, marcas), 1):
            print(f"  {i}. [{'x' if m else ' '}] {it}")
        print()


def cmd_check(a, valor=True):
    p = ruta_proyecto(a.nombre)
    d = cargar(p)
    fase = next((f for f in FASES if f.startswith(a.fase)), None)
    if not fase:
        sys.exit(f"Fase desconocida. Opciones: {', '.join(FASES)}")
    marcas = d["checklist"][fase]
    if not 1 <= a.item <= len(marcas):
        sys.exit(f"Item fuera de rango (1-{len(marcas)})")
    marcas[a.item - 1] = valor
    guardar(p, d)
    print(f"{'Marcado' if valor else 'Desmarcado'}: {FASES[fase][1][a.item - 1]}")


def sanear_props(texto, d):
    """Hack anti-copyright: sustituye el nombre real por el genérico."""
    for pr in d["props"]:
        texto = re.sub(re.escape(pr["nombre_real"]), pr["nombre_generico"], texto,
                       flags=re.IGNORECASE)
    return texto


def render_plano(s, d, offset):
    ini, fin = s["inicio"] - offset, s["fin"] - offset
    lineas = [f"[{ini:g}-{fin:g}s] Cámara: {s['camara']}. Espacio: {s['espacio']}."]
    if s.get("accion"):
        lineas.append(f"  Acción: {s['accion']}")
    if s.get("microexpresiones"):
        lineas.append("  Microexpresiones: " + "; ".join(s["microexpresiones"]) + ".")
    if s.get("fisica_sonido"):
        lineas.append(f"  Física/sonido: {s['fisica_sonido']}")
    ids = {c["id"]: c for c in d["personajes"]}
    for dl in s.get("dialogo", []):
        if dl.get("texto"):
            c = ids.get(dl["personaje"], {"nombre": dl["personaje"]})
            lineas.append(f"  {c['nombre']} dice: \"{dl['texto']}\"")
    return sanear_props("\n".join(lineas), d)


def cabecera(d):
    e = d["estilo"]
    hexes = ", ".join(e["hex"]) or "—"
    ar = d["audio_referencia"]
    refs = [f"Locación (referencia visual): {l['id']} — {l['descripcion']}" for l in d["locaciones"]]
    refs += [f"Personaje {c['id']} ({c['nombre']}): ver character sheet. Voz: {c['voz']}"
             for c in d["personajes"]]
    refs += [f"Utilería: {p['nombre_generico']} (ver prop sheet)" for p in d["props"]]
    refs.append(f"Usa el {ar['etiqueta']} como referencia de audio para el Personaje {ar['personaje']}.")
    return (f"LOOK GLOBAL (mantener idéntico en todo el bloque): cámara {e['camara']}, "
            f"lente {e['lente']}, película {e['pelicula'] or '—'}, paleta {hexes}. {e['notas']}\n\n"
            "REFERENCIAS:\n" + "\n".join(refs))


def cmd_prompt(a):
    p = ruta_proyecto(a.nombre)
    d = cargar(p)
    bloque, total = d["bloque_s"], d["duracion_s"]
    n = -(-total // bloque)
    salida = p / "4-megaprompt" / "salida"
    salida.mkdir(exist_ok=True)
    excedido = False
    for i in range(n):
        ini, fin = i * bloque, min((i + 1) * bloque, total)
        planos = [s for s in d["guion"] if ini <= s["inicio"] < fin]
        for s in planos:
            if s["fin"] > fin:
                print(f"AVISO: el plano {s['inicio']}-{s['fin']}s cruza el límite del bloque {i+1}.")
        cuerpo = "\n".join(render_plano(s, d, ini) for s in planos) or "(sin planos en este bloque)"
        texto = (f"BLOQUE {i+1}/{n} — {fin - ini} segundos continuos, sin cortes de lugar ni "
                 f"teletransportes de personajes.\n\n{cabecera(d)}\n\nGUION SEGUNDO A SEGUNDO:\n{cuerpo}\n")
        f = salida / f"prompt_{i+1:02d}.md"
        f.write_text(texto, encoding="utf-8")
        estado = "OK" if len(texto) <= a.limite else "EXCEDE"
        excedido |= len(texto) > a.limite
        print(f"{f.relative_to(ROOT)}: {len(texto)}/{a.limite} caracteres [{estado}]")
    if excedido:
        sys.exit("Algún prompt supera el límite: acorta el guion o pide a Claude que condense.")


def cmd_feedback(a):
    p = ruta_proyecto(a.nombre)
    d = cargar(p)
    d["feedback"].append({"bloque": a.bloque, "nota": a.nota})
    guardar(p, d)
    print(f"Feedback guardado ({len(d['feedback'])} en total). Pégalo en Claude junto al prompt "
          f"del bloque {a.bloque} para generar la versión siguiente:\n")
    for f in d["feedback"]:
        if f["bloque"] == a.bloque:
            print(f"- {f['nota']}")


def cmd_musica(a):
    p = ruta_proyecto(a.nombre)
    d = cargar(p)
    m = d["musica"]
    imp = "; ".join(f"impacto en el segundo {i['t']} ({i['descripcion']})" for i in m["impactos"])
    cortes = ", ".join(fmt_t(s["inicio"]) for s in d["guion"])
    print(f"{m['instrumentos'].capitalize()}, {m['tempo_bpm']} BPM, {m['tonalidad']}. "
          f"{m['estilo']} Duración {d['duracion_s']} s. {imp}. "
          f"Cambios de plano en: {cortes}. Sin voz, instrumental.".replace("  ", " "))


def cmd_voz(a):
    d = cargar(ruta_proyecto(a.nombre))
    ar = d["audio_referencia"]
    print(f"1. Graba con tu micro: \"{ar['frase']}\"\n"
          f"2. Exporta como MP4 con pantalla negra -> {ar['archivo']}\n"
          f"3. Súbelo a Artcraft como \"{ar['etiqueta']}\"\n"
          f"4. En el prompt: \"Usa el {ar['etiqueta']} como referencia de audio para el "
          f"Personaje {ar['personaje']}\" (ya incluido por `vpipe prompt`).")


def main():
    ap = argparse.ArgumentParser(prog="vpipe", description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("nueva", help="crea un proyecto de vídeo")
    s.add_argument("nombre")
    s.add_argument("--duracion", type=int, default=60, help="segundos totales (60)")
    s.add_argument("--bloque", type=int, default=30, help="segundos por prompt (30)")
    s.set_defaults(fn=cmd_nueva)

    for nombre, fn, ayuda in [("estado", cmd_estado, "checklist por fase"),
                              ("musica", cmd_musica, "prompt de música (Udio/Suno)"),
                              ("voz", cmd_voz, "pasos del voice lock")]:
        s = sub.add_parser(nombre, help=ayuda)
        s.add_argument("nombre")
        s.set_defaults(fn=fn)

    for nombre, val in [("check", True), ("uncheck", False)]:
        s = sub.add_parser(nombre, help=f"{nombre} de un item del checklist")
        s.add_argument("nombre")
        s.add_argument("fase", help="p. ej. 1, 2-assets...")
        s.add_argument("item", type=int)
        s.set_defaults(fn=lambda a, v=val: cmd_check(a, v))

    s = sub.add_parser("prompt", help="genera los mega-prompts por bloque temporal")
    s.add_argument("nombre")
    s.add_argument("--limite", type=int, default=LIMITE_CHARS)
    s.set_defaults(fn=cmd_prompt)

    s = sub.add_parser("feedback", help="registra qué falló en un bloque")
    s.add_argument("nombre")
    s.add_argument("bloque", type=int)
    s.add_argument("nota")
    s.set_defaults(fn=cmd_feedback)

    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
