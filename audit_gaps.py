#!/usr/bin/env python3
"""audit_gaps.py — Escanea los bundles icons.json y reporta:
   - Hotspots tipo A sin echos (o con echos vacíos)
   - Hotspots tipo B con caption placeholder (lorem ipsum / TODO) o caption vacío
"""
import json, os, sys, glob

MAP_DIR = os.path.join(os.path.dirname(__file__),
    "public/data/stories/costa-rica/expedientes/0001/maps")

ICON_PATTERN = os.path.join(MAP_DIR, "mapa_f*_icons", "icons.json")

# Waypoints activos por fase (los que existen en el mapa JSON)
ACTIVE_WPS = {
    "mapa_f1_icons": set(f"wp{i}" for i in range(6)),    # 0-5
    "mapa_f2_icons": set(f"wp{i}" for i in range(6)),    # 0-5
    "mapa_f3_icons": set(f"wp{i}" for i in range(12)),   # 0-11
}

def audit(phase_label, data):
    echos_missing = 0
    caption_placeholder = 0
    caption_empty = 0
    active = ACTIVE_WPS.get(phase_label, set(data.keys()))
    for wp_key, items in data.items():
        if wp_key not in active:
            continue
        for idx, item in enumerate(items):
            tp = item.get("type", "")
            no_popup = item.get("noPopup", False)
            echos = item.get("echos")
            caption = item.get("caption", "")
            hs_label = f"{wp_key}[{idx}]"
            if not no_popup:  # tipo A
                if not echos or echos == {}:
                    print(f"  ❌ echos FALTANTES — {phase_label} {hs_label} ({item.get('title','sin título')})")
                    echos_missing += 1
            else:  # tipo B
                if not caption:
                    print(f"  ⚠️  caption VACÍO — {phase_label} {hs_label}")
                    caption_empty += 1
                elif caption.lower().startswith("lorem") or caption.lower().startswith("todo") or "placeholder" in caption.lower():
                    print(f"  ⚠️  caption PLACEHOLDER — {phase_label} {hs_label}: \"{caption[:60]}...\"")
                    caption_placeholder += 1
    return echos_missing, caption_placeholder, caption_empty

def main():
    files = sorted(glob.glob(ICON_PATTERN))
    if not files:
        print("No se encontraron archivos icons.json en", MAP_DIR)
        sys.exit(1)
    total_echos_missing = 0
    total_placeholder = 0
    total_empty = 0
    for fp in files:
        phase = os.path.basename(os.path.dirname(fp))
        print(f"\n=== {phase} ===")
        with open(fp) as f:
            data = json.load(f)
        em, cp, ce = audit(phase, data)
        total_echos_missing += em
        total_placeholder += cp
        total_empty += ce
    print("\n=== RESUMEN ===")
    print(f"  echos FALTANTES:    {total_echos_missing}")
    print(f"  captions PLACEHOLDER: {total_placeholder}")
    print(f"  captions VACÍO:      {total_empty}")
    if total_echos_missing == 0:
        print("  ✅ Todos los echos están escritos. Prioridad 1 cerrada en texto.")
    else:
        print(f"  ❌ Quedan {total_echos_missing} echos sin escribir.")
    return 0 if total_echos_missing == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
