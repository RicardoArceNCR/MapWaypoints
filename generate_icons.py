#!/usr/bin/env python3
"""
generate_icons.py — Generador de wp*.json para cualquier fase
Uso: python3 generate_icons.py --fase 2 --wps 12
     python3 generate_icons.py --fase 3 --wps 8
"""
import json, argparse, os

# ──────────────────────────────────────────────
# LAYOUT BASE — posiciones probadas en fase 1
# Modifica aquí si la geometría cambia entre fases
# ──────────────────────────────────────────────
HOTSPOT_LAYOUT = {
    "desktop": [
        {"name": "H0", "role": "rect_izq",    "offsetX": -200, "offsetY": -130, "width": 420, "height": 239, "rotation": -10, "radius": 0},
        {"name": "H1", "role": "rect_der",    "offsetX":  180, "offsetY": -130, "width": 417, "height": 238, "rotation":  25, "radius": 0},
        {"name": "H2", "role": "circ_arriba", "offsetX":   -9, "offsetY": -180, "width": 170, "height": 170, "rotation":   0, "radius": 84},
        {"name": "H3", "role": "circ_abajo",  "offsetX":   -9, "offsetY":   61, "width": 166, "height": 166, "rotation":   0, "radius": 85},
    ],
    "mobile": [
        {"name": "H0", "role": "rect_izq",    "offsetX": -11,  "offsetY": -417, "width": 392, "height": 200, "rotation":   9, "radius": 0},
        {"name": "H1", "role": "rect_der",    "offsetX":   1,  "offsetY":  -86, "width": 404, "height": 284, "rotation":  -8, "radius": 0},
        {"name": "H2", "role": "circ_arriba", "offsetX":  84,  "offsetY":  145, "width":  77, "height":  77, "rotation":  -8, "radius": 20},
        {"name": "H3", "role": "circ_abajo",  "offsetX": 224,  "offsetY":  107, "width":  77, "height":  77, "rotation":  24, "radius": 15},
    ]
}

def make_hotspot(fase, wp_idx, h_idx, layout_desktop, layout_mobile):
    hn = f"H{h_idx}"
    id_prefix = f"pf{fase}w{wp_idx}h{h_idx}"
    d = layout_desktop
    m = layout_mobile

    return {
        "_note": f"WP{wp_idx}-{hn} ({d['role']}) — ajustar con editor",
        "type": "hotspot",
        "mobile": {
            "offsetX":  m["offsetX"],
            "offsetY":  m["offsetY"],
            "width":    m["width"],
            "height":   m["height"],
            "rotation": m["rotation"],
            "radius":   m["radius"]
        },
        "desktop": {
            "offsetX":  d["offsetX"],
            "offsetY":  d["offsetY"],
            "width":    d["width"],
            "height":   d["height"],
            "rotation": d["rotation"],
            "radius":   d["radius"]
        },
        "title":    f"TODO — Título {hn} wp{wp_idx}",
        "image":    f"/assets/TODO-f{fase}-wp{wp_idx}-h{h_idx}.webp",
        "datetime": {"date": "TODO — DD/MM/AAAA", "time": "TODO — HH:MM", "timeColor": "#FF4444"},
        "location": "TODO — Lugar, Ciudad, País.",
        "description": f"TODO — Descripción {hn}.",
        "involved": [
            {"id": f"{id_prefix}a", "name": "TODO — Persona A", "avatar": "./assets/persona_1-1.png", "role": "TODO — Rol"},
            {"id": f"{id_prefix}b", "name": "TODO — Persona B", "avatar": "./assets/persona_1-2.png", "role": "TODO — Rol", "highlighted": True},
            {"id": f"{id_prefix}c", "name": "TODO — Persona C", "avatar": "./assets/persona_1-3.png", "role": "TODO — Rol"},
        ],
        "echos": {
            f"{id_prefix}a": [{"datetime": {"date": "TODO — DD/MM/AAAA", "time": "TODO — HH:MM"}, "description": "TODO — Participación A."}],
            f"{id_prefix}b": [
                {"datetime": {"date": "TODO — DD/MM/AAAA", "time": "TODO — HH:MM"}, "description": "TODO — Participación B."},
                {"datetime": {"date": "TODO — DD/MM/AAAA", "time": "TODO — HH:MM"}, "description": "TODO — Segunda interacción B."}
            ],
            f"{id_prefix}c": [{"datetime": {"date": "TODO — DD/MM/AAAA", "time": "TODO — HH:MM"}, "description": "TODO — Participación C."}]
        }
    }

def generate_fase(fase, n_wps, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    for wp in range(n_wps):
        hotspots = []
        for h_idx in range(4):
            hs = make_hotspot(
                fase, wp, h_idx,
                HOTSPOT_LAYOUT["desktop"][h_idx],
                HOTSPOT_LAYOUT["mobile"][h_idx]
            )
            hotspots.append(hs)
        path = os.path.join(out_dir, f"wp{wp}.json")
        with open(path, 'w') as f:
            json.dump(hotspots, f, indent=2)
    print(f"✅ Fase {fase}: {n_wps} archivos en {out_dir}/")

def verify(out_dir, half=600):
    errors = 0
    for fname in sorted(os.listdir(out_dir)):
        if not fname.endswith('.json'): continue
        with open(os.path.join(out_dir, fname)) as f:
            data = json.load(f)
        for i, hs in enumerate(data):
            d = hs['desktop']
            xl = d['offsetX']; xr = d['offsetX'] + d['width']
            yt = d['offsetY']; yb = d['offsetY'] + d['height']
            if not (abs(xl)<=half and abs(xr)<=half and abs(yt)<=half and abs(yb)<=half):
                print(f"  ⚠️  {fname} H{i}: x[{xl},{xr}] y[{yt},{yb}]")
                errors += 1
    if errors == 0:
        print(f"  ✓ Todos los hotspots dentro de ±{half}px del centro")
    return errors == 0

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument('--fase', type=int, required=True, help='Número de fase (1, 2, 3...)')
    p.add_argument('--wps',  type=int, default=12,   help='Número de waypoints (default: 12)')
    p.add_argument('--out',  type=str, default=None, help='Directorio de salida')
    args = p.parse_args()

    out = args.out or f"mapa_f{args.fase}_icons"
    generate_fase(args.fase, args.wps, out)
    verify(out)
