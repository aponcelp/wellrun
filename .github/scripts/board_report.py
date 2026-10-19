"""Summarize how the Well Run board changed in this push."""
import json, os, subprocess, sys

PATHS = ["data/companies.json", "data.json"]

def load(ref):
    for p in PATHS:
        try:
            raw = subprocess.check_output(["git", "show", f"{ref}:{p}"], stderr=subprocess.DEVNULL)
            d = json.loads(raw)
            return d if isinstance(d, list) else d.get("companies", [])
        except Exception:
            continue
    return None

ORDER = {"Sprint": 0, "Race": 1, "Tempo": 2, "Steady": 3, "Warm-up": 4, "Cool-down": 5}

def ranked(companies):
    cs = sorted(companies, key=lambda c: (ORDER.get(c.get("zone"), 9), -float(c.get("score") or 0), c.get("name", "").lower()))
    return {c["slug"]: (i + 1, c) for i, c in enumerate(cs)}

before_ref = sys.argv[1] if len(sys.argv) > 1 else "HEAD~1"
new, old = load("HEAD"), load(before_ref)
out = []
if new is None:
    out.append("No board data found in this commit.")
else:
    zones = {}
    for c in new:
        zones[c.get("zone")] = zones.get(c.get("zone"), 0) + 1
    out.append("## 🏁 Well Run board update\n")
    out.append(f"**{len(new)} companies on the board.**\n")
    out.append("| Zone | Companies |\n|---|---|")
    for z in sorted(zones, key=lambda z: ORDER.get(z, 9)):
        out.append(f"| {z} | {zones[z]} |")
    if old is not None:
        o = {c["slug"]: c for c in old}
        n = {c["slug"]: c for c in new}
        added = [n[s]["name"] for s in n if s not in o]
        removed = [o[s]["name"] for s in o if s not in n]
        moves = []
        for s in n:
            if s in o and (o[s].get("zone") != n[s].get("zone") or o[s].get("score") != n[s].get("score")):
                moves.append(f"| {n[s]['name']} | {o[s].get('zone')} {o[s].get('score')} | {n[s].get('zone')} {n[s].get('score')} |")
        out.append(f"\n**Added ({len(added)}):** " + (", ".join(added) if added else "none"))
        out.append(f"\n**Removed ({len(removed)}):** " + (", ".join(removed) if removed else "none"))
        out.append(f"\n**Score or zone changes ({len(moves)}):**\n")
        if moves:
            out.append("| Company | Before | After |\n|---|---|---|")
            out += moves
        else:
            out.append("none")
text = "\n".join(out)
print(text)
summary = os.environ.get("GITHUB_STEP_SUMMARY")
if summary:
    with open(summary, "a") as f:
        f.write(text + "\n")
