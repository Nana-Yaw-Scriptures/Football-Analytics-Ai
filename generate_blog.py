#!/usr/bin/env python3
"""
Scorina AI — match-preview blog generator.

Pulls upcoming fixtures and their predictions from your live API and writes a
static HTML preview page for each match, then rebuilds the blog index and
sitemap. Uses only the Python standard library (no pip installs needed).

Run from your FRONTEND repo root (the folder with `public/`):

    python generate_blog.py

Then commit and push:

    git add public/blog public/sitemap.xml
    git commit -m "Generate match previews"
    git push
"""

import json
import os
import re
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone

# ---------------------------------------------------------------- config
API_BASE  = "https://football-analytics-ai-production.up.railway.app"
SITE      = "https://www.scorinai.com"
OUT_DIR   = "public/blog"
SITEMAP   = "public/sitemap.xml"
MAX_POSTS = 12          # how many upcoming matches to generate per run
PAUSE_SEC = 0.5         # small delay between prediction calls


# ---------------------------------------------------------------- helpers
def api_get(path):
    try:
        req = urllib.request.Request(f"{API_BASE}{path}", headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        print(f"  ! GET {path} failed: {e}")
        return None


def api_post(path, body):
    try:
        data = json.dumps(body).encode()
        req = urllib.request.Request(
            f"{API_BASE}{path}", data=data,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=45) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        print(f"  ! POST {path} failed: {e}")
        return None


def slugify(text):
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return re.sub(r"-{2,}", "-", text)


def human_date(iso):
    if not iso:
        return ""
    try:
        d = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return d.strftime("%A, %-d %B %Y")
    except Exception:
        return iso[:10]


def form_badges(seq):
    seq = (seq or [])[-5:]
    if not seq:
        return '<span class="muted">No recent data</span>'
    return "".join(f'<span class="fb {r}">{r}</span>' for r in seq)


def pct(x):
    try:
        return round(float(x) * 100)
    except Exception:
        return 0


# ---------------------------------------------------------------- templates
POST = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>__TITLE__</title>
  <meta name="description" content="__DESC__"/>
  <link rel="canonical" href="__SITE__/blog/__SLUG__.html"/>
  <meta name="robots" content="index, follow"/>
  <meta property="og:type" content="article"/>
  <meta property="og:title" content="__H1__"/>
  <meta property="og:description" content="__DESC__"/>
  <meta property="og:url" content="__SITE__/blog/__SLUG__.html"/>
  <meta property="og:image" content="__SITE__/og-image.png"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Article","headline":"__H1__","description":"__DESC__","image":"__SITE__/og-image.png","datePublished":"__PUB__","dateModified":"__PUB__","author":{"@type":"Organization","name":"Scorina AI"},"publisher":{"@type":"Organization","name":"Scorina AI","logo":{"@type":"ImageObject","url":"__SITE__/scorina_ai_logo.svg"}},"mainEntityOfPage":"__SITE__/blog/__SLUG__.html"}
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"/>
  <style>
    :root{--bg:#050810;--card:#0a0e1a;--line:rgba(255,255,255,.08);--text:#e8edf7;--muted:#94a3b8;--cyan:#22d3ee;--purple:#a855f7;}
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:var(--bg);color:var(--text);font-family:'Outfit',system-ui,sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased;}
    a{color:var(--cyan);text-decoration:none;}
    .wrap{max-width:720px;margin:0 auto;padding:0 20px;}
    header{border-bottom:1px solid var(--line);position:sticky;top:0;background:rgba(5,8,16,.85);backdrop-filter:blur(12px);z-index:10;}
    .nav{display:flex;align-items:center;justify-content:space-between;height:56px;}
    .brand{display:flex;align-items:center;gap:8px;font-weight:900;font-size:16px;color:var(--text);}
    .brand .dot{width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,var(--cyan),var(--purple));}
    .back{font-size:13px;font-weight:600;color:var(--muted);}
    article{padding:44px 0 56px;}
    .crumb{font-size:12px;color:var(--muted);margin-bottom:14px;}
    .tag{display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--cyan);background:rgba(34,211,238,.1);border:1px solid rgba(34,211,238,.22);padding:3px 9px;border-radius:6px;}
    h1{font-size:34px;font-weight:900;letter-spacing:-.02em;line-height:1.1;margin:14px 0 10px;}
    .byline{color:#64748b;font-size:13px;margin-bottom:28px;}
    h2{font-size:22px;font-weight:800;margin:34px 0 10px;letter-spacing:-.01em;}
    p{color:#cdd6e6;margin:0 0 16px;}
    .pred{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:8px 0 20px;}
    .pred .b{border:1px solid var(--line);background:var(--card);border-radius:14px;padding:16px 10px;text-align:center;}
    .pred .v{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:22px;}
    .pred .k{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-top:4px;}
    .stats{border:1px solid var(--line);background:var(--card);border-radius:14px;padding:6px 18px;margin:0 0 20px;}
    .stats .row{display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--line);font-size:15px;}
    .stats .row:last-child{border-bottom:none;}
    .stats .row b{font-family:'JetBrains Mono',monospace;}
    .forms{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:0 0 20px;}
    .fl{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:7px;}
    .fbs{display:flex;gap:6px;}
    .fb{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;font-family:'JetBrains Mono';font-weight:700;font-size:12px;}
    .fb.W{background:rgba(39,224,163,.16);color:#27e0a3;} .fb.D{background:rgba(250,204,21,.16);color:#facc15;} .fb.L{background:rgba(255,107,130,.16);color:#ff6b82;}
    .muted{color:var(--muted);font-size:13px;}
    ul{margin:0 0 16px;padding-left:20px;color:#cdd6e6;} li{margin-bottom:6px;}
    .cta{display:block;text-align:center;border:1px solid rgba(34,211,238,.3);background:linear-gradient(120deg,rgba(34,211,238,.12),rgba(168,85,247,.12));border-radius:14px;padding:18px;margin:28px 0;font-weight:700;color:var(--text);}
    .disclaimer{font-size:13px;color:#64748b;border-top:1px solid var(--line);padding-top:18px;margin-top:32px;}
    footer{border-top:1px solid var(--line);padding:24px 0 56px;color:var(--muted);font-size:14px;}
    footer .links{display:flex;flex-wrap:wrap;gap:18px;}
    @media(max-width:560px){h1{font-size:27px;}}
  </style>
</head>
<body>
  <header><div class="wrap nav">
    <a class="brand" href="__SITE__"><span class="dot"></span> Scorina AI</a>
    <a class="back" href="/blog/">← All posts</a>
  </div></header>
  <main class="wrap"><article>
    <div class="crumb"><a href="/blog/">Blog</a> · __LEAGUE__</div>
    <span class="tag">Match Preview</span>
    <h1>__H1__</h1>
    <p class="byline">By Scorina AI · __PUBHUMAN__</p>
    <p>__HOME__ face __AWAY__ in __LEAGUE__ on __KICK__. Below is Scorina AI's data-driven prediction — win probabilities, expected goals and the most likely scoreline from our match model.</p>
    <h2>Prediction at a glance</h2>
    <div class="pred">
      <div class="b"><div class="v" style="color:var(--cyan)">__HW__%</div><div class="k">__HOME__ win</div></div>
      <div class="b"><div class="v" style="color:#94a3b8">__DR__%</div><div class="k">Draw</div></div>
      <div class="b"><div class="v" style="color:var(--purple)">__AW__%</div><div class="k">__AWAY__ win</div></div>
    </div>
    <h2>The numbers</h2>
    <div class="stats">
      <div class="row"><span>Expected goals (xG)</span><b>__XGH__ – __XGA__</b></div>
      <div class="row"><span>Most likely scoreline</span><b>__SCORE__</b></div>
      <div class="row"><span>Model confidence</span><b>__CONF__</b></div>
    </div>
    <h2>Recent form</h2>
    <div class="forms">
      <div><div class="fl">__HOME__ · last 5</div><div class="fbs">__FORMH__</div></div>
      <div><div class="fl">__AWAY__ · last 5</div><div class="fbs">__FORMA__</div></div>
    </div>
    __FACTORS__
    <a class="cta" href="__SITE__/#/analysis">See the full live prediction on Scorina AI →</a>
    <p class="disclaimer">Predictions are model estimates for analysis and entertainment, not betting advice. Figures update as new data arrives.</p>
  </article></main>
  <footer><div class="wrap links">
    <a href="/blog/">Blog home</a>
    <a href="__SITE__/#/live">Live Scores</a>
    <a href="__SITE__/#/analysis">Predictions</a>
    <a href="__SITE__/#/bestpicks">AI Picks</a>
  </div></footer>
</body>
</html>
"""

INDEX = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Scorina AI Blog — Football Match Previews & AI Predictions</title>
  <meta name="description" content="AI-powered match previews and predictions for the Premier League, La Liga, Serie A and more, from Scorina AI."/>
  <link rel="canonical" href="__SITE__/blog/"/>
  <meta property="og:type" content="website"/>
  <meta property="og:title" content="Scorina AI Blog — Match Previews & AI Predictions"/>
  <meta property="og:url" content="__SITE__/blog/"/>
  <meta property="og:image" content="__SITE__/og-image.png"/>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
  <style>
    :root{--bg:#050810;--card:#0a0e1a;--line:rgba(255,255,255,.08);--text:#e8edf7;--muted:#94a3b8;--cyan:#22d3ee;--purple:#a855f7;}
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:var(--bg);color:var(--text);font-family:'Outfit',system-ui,sans-serif;line-height:1.6;}
    a{color:inherit;text-decoration:none;}
    .wrap{max-width:820px;margin:0 auto;padding:0 20px;}
    header{border-bottom:1px solid var(--line);}
    .nav{display:flex;align-items:center;justify-content:space-between;height:56px;}
    .brand{display:flex;align-items:center;gap:8px;font-weight:900;font-size:16px;}
    .brand .dot{width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,var(--cyan),var(--purple));}
    .back{font-size:13px;font-weight:600;color:var(--muted);}
    .hero{padding:56px 0 32px;}
    .eyebrow{color:var(--cyan);font-weight:700;font-size:12px;letter-spacing:.18em;text-transform:uppercase;}
    h1{font-size:40px;font-weight:900;letter-spacing:-.02em;line-height:1.05;margin:10px 0 12px;}
    .lede{color:var(--muted);font-size:17px;max-width:60ch;}
    .posts{display:grid;gap:16px;padding:8px 0 64px;}
    .post{display:block;border:1px solid var(--line);background:var(--card);border-radius:16px;padding:22px 24px;transition:border-color .15s,transform .15s;}
    .post:hover{border-color:rgba(34,211,238,.35);transform:translateY(-2px);}
    .post .tag{display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--cyan);background:rgba(34,211,238,.1);border:1px solid rgba(34,211,238,.22);padding:3px 9px;border-radius:6px;}
    .post h2{font-size:22px;font-weight:800;margin:12px 0 6px;}
    .post p{color:var(--muted);font-size:15px;}
    .post .meta{color:#64748b;font-size:12px;margin-top:12px;}
    footer{border-top:1px solid var(--line);padding:28px 0 60px;color:var(--muted);font-size:14px;}
    @media(max-width:560px){h1{font-size:30px;}}
  </style>
</head>
<body>
  <header><div class="wrap nav">
    <a class="brand" href="__SITE__"><span class="dot"></span> Scorina AI</a>
    <a class="back" href="__SITE__">← Back to app</a>
  </div></header>
  <main class="wrap">
    <section class="hero">
      <p class="eyebrow">The Scorina AI Blog</p>
      <h1>Match Previews &amp; AI Predictions</h1>
      <p class="lede">Data-driven previews for Europe's top leagues — win probabilities, expected goals, form and predicted scorelines, powered by the Scorina AI model.</p>
    </section>
    <section class="posts">
__CARDS__
    </section>
  </main>
  <footer><div class="wrap">© 2026 Scorina AI · Football analytics &amp; predictions</div></footer>
</body>
</html>
"""

CARD = """      <a class="post" href="/blog/__SLUG__.html">
        <span class="tag">Match Preview</span>
        <h2>__HOME__ vs __AWAY__: AI Prediction &amp; Match Preview</h2>
        <p>Win probabilities, expected goals and the most likely scoreline for this __LEAGUE__ clash.</p>
        <div class="meta">__LEAGUE__ · __KICK__</div>
      </a>"""


def render_post(fx, pred, slug):
    home = fx.get("homeTeam") or pred.get("home_team_name") or ""
    away = fx.get("awayTeam") or pred.get("away_team_name") or ""
    league = fx.get("league") or "Football"
    kick = human_date(fx.get("date"))
    venue = fx.get("venue")
    kick_full = f"{kick}" + (f", {venue}" if venue else "")
    pub = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    h1 = f"{home} vs {away}: AI Prediction & Match Preview"
    desc = f"{home} vs {away} prediction and preview. Scorina AI's win probabilities, expected goals and most likely scoreline for this {league} match."

    factors = pred.get("key_factors") or []
    factors_html = ""
    if factors:
        items = "".join(f"<li>{f}</li>" for f in factors[:4])
        factors_html = f"<h2>Key factors</h2>\n    <ul>{items}</ul>"

    repl = {
        "__TITLE__": f"{home} vs {away} Prediction: AI Preview & Score | Scorina AI",
        "__DESC__": desc, "__H1__": h1, "__SLUG__": slug, "__SITE__": SITE,
        "__PUB__": pub, "__PUBHUMAN__": datetime.now(timezone.utc).strftime("%-d %B %Y"),
        "__HOME__": home, "__AWAY__": away, "__LEAGUE__": league,
        "__KICK__": kick_full or "an upcoming fixture",
        "__HW__": str(pct(pred.get("home_win"))), "__DR__": str(pct(pred.get("draw"))),
        "__AW__": str(pct(pred.get("away_win"))),
        "__XGH__": str(pred.get("home_expected_goals", "")), "__XGA__": str(pred.get("away_expected_goals", "")),
        "__SCORE__": pred.get("most_likely_score") or pred.get("predicted_score") or "—",
        "__CONF__": pred.get("confidence_level") or "Medium",
        "__FORMH__": form_badges(pred.get("home_form_sequence")),
        "__FORMA__": form_badges(pred.get("away_form_sequence")),
        "__FACTORS__": factors_html,
    }
    out = POST
    for k, v in repl.items():
        out = out.replace(k, v)
    return out


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def main():
    print(f"Fetching upcoming fixtures from {API_BASE} ...")
    fixtures = api_get("/live/upcoming") or []
    if not isinstance(fixtures, list) or not fixtures:
        print("No upcoming fixtures returned. Nothing to generate.")
        return

    seen, posts = set(), []
    for fx in fixtures:
        if len(posts) >= MAX_POSTS:
            break
        home, away = fx.get("homeTeam"), fx.get("awayTeam")
        league = fx.get("league") or "Premier League"
        if not home or not away:
            continue
        slug = slugify(f"{home}-vs-{away}-prediction")
        if slug in seen:
            continue
        seen.add(slug)

        print(f"  → {home} vs {away}")
        pred = api_post("/predict/match", {"home_team": home, "away_team": away, "league": league})
        time.sleep(PAUSE_SEC)
        if not pred or "home_win" not in pred:
            print("     skipped (no prediction)")
            continue

        write(f"{OUT_DIR}/{slug}.html", render_post(fx, pred, slug))
        posts.append({"slug": slug, "home": home, "away": away, "league": league,
                      "kick": human_date(fx.get("date"))})

    if not posts:
        print("No posts generated.")
        return

    # Rebuild index
    cards = "\n".join(
        CARD.replace("__SLUG__", p["slug"]).replace("__HOME__", p["home"])
            .replace("__AWAY__", p["away"]).replace("__LEAGUE__", p["league"])
            .replace("__KICK__", p["kick"] or "Upcoming")
        for p in posts
    )
    write(f"{OUT_DIR}/index.html", INDEX.replace("__SITE__", SITE).replace("__CARDS__", cards))

    # Rebuild sitemap
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    urls = [
        (f"{SITE}/", "daily", "1.0", None),
        (f"{SITE}/blog/", "weekly", "0.8", None),
    ] + [(f"{SITE}/blog/{p['slug']}.html", "monthly", "0.7", today) for p in posts]
    body = "\n".join(
        "  <url>\n    <loc>{}</loc>\n{}    <changefreq>{}</changefreq>\n    <priority>{}</priority>\n  </url>".format(
            loc, (f"    <lastmod>{lm}</lastmod>\n" if lm else ""), cf, pr)
        for loc, cf, pr, lm in urls
    )
    write(SITEMAP, f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{body}\n</urlset>\n')

    print(f"\nDone. Generated {len(posts)} post(s), rebuilt index.html and sitemap.xml.")
    print("Next:  git add public/blog public/sitemap.xml && git commit -m \"Generate match previews\" && git push")


if __name__ == "__main__":
    main()