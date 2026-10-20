"""Download free (CC0) 3D models and textures from Poly Haven into public/assets.

Usage (from the cabin folder):
  python3 scripts/fetch-polyhaven.py --models Camera_01 gamepad
  python3 scripts/fetch-polyhaven.py --textures forest_floor
  python3 scripts/fetch-polyhaven.py --bake-sources     # the big trees used to re-bake the forest

Find names at https://polyhaven.com/models and https://polyhaven.com/textures —
the name is the last part of the asset's URL (e.g. polyhaven.com/a/chess_set -> chess_set).
Models land in public/assets/models/<name>/<name>_1k.gltf; textures in
public/assets/textures/<name>/{diff,nor,rough,ao}.jpg.
"""
import argparse
import concurrent.futures as cf
import json
import os
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "assets")
UA = {"User-Agent": "bahir-cabin-portfolio"}
TEX_MAPS = {"Diffuse": "diff", "nor_gl": "nor", "Rough": "rough", "AO": "ao"}
BAKE_SOURCES = ["island_tree_01", "island_tree_02"]
RETRIES = 5


def get_json(url):
    for attempt in range(RETRIES):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                return json.load(r)
        except Exception as e:  # network here is flaky; retry, then give up loudly
            print(f"retry {attempt + 1}/{RETRIES} {url}: {e}", flush=True)
    raise RuntimeError(f"could not fetch {url}")


def download(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return dest
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    for attempt in range(RETRIES):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=600) as r, open(dest + ".part", "wb") as f:
                f.write(r.read())
            os.replace(dest + ".part", dest)
            return dest
        except Exception as e:
            print(f"retry {attempt + 1}/{RETRIES} {url}: {e}", flush=True)
    raise RuntimeError(f"could not download {url}")


def model_jobs(name):
    files = get_json(f"https://api.polyhaven.com/files/{name}")
    if "gltf" not in files:
        raise SystemExit(f"{name}: no glTF version on Poly Haven (check the name)")
    gltf = files["gltf"]["1k"]["gltf"]
    base = os.path.join(OUT, "models", name)
    jobs = [(gltf["url"], os.path.join(base, os.path.basename(gltf["url"])))]
    jobs += [(inc["url"], os.path.join(base, rel)) for rel, inc in gltf.get("include", {}).items()]
    return jobs


def texture_jobs(name):
    files = get_json(f"https://api.polyhaven.com/files/{name}")
    return [
        (files[key]["1k"]["jpg"]["url"], os.path.join(OUT, "textures", name, f"{short}.jpg"))
        for key, short in TEX_MAPS.items()
        if key in files and "1k" in files[key]
    ]


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--models", nargs="*", default=[])
    parser.add_argument("--textures", nargs="*", default=[])
    parser.add_argument("--bake-sources", action="store_true", help="download the big trees used by bake.html")
    args = parser.parse_args()
    models = args.models + (BAKE_SOURCES if args.bake_sources else [])
    if not models and not args.textures:
        parser.error("nothing to download — pass --models, --textures or --bake-sources")

    jobs = [j for m in models for j in model_jobs(m)] + [j for t in args.textures for j in texture_jobs(t)]
    print(f"downloading {len(jobs)} files…", flush=True)
    with cf.ThreadPoolExecutor(8) as pool:
        for done in pool.map(lambda j: download(*j), jobs):
            print("ok", os.path.relpath(done, ROOT), flush=True)
    print("done")


if __name__ == "__main__":
    main()
