#!/usr/bin/env python3
"""
Scorina AI blog generator (v5) — curated football previews.

Selects the week's marquee fixtures (big clubs, max 3 per league, 12 total),
then builds:
  - the hub (/blog/)                     API-Football-style: banner cards + sidebar + pagination
  - a page per league (/blog/league/..)  SEO landing per competition
  - a page per team   (/blog/team/..)    SEO landing per club
  - a match page per fixture             prediction module + poll (Sonnet write-up added next step)
  - sitemap.xml

Run:  python generate_blog.py
Standard library only.
"""

import json, math, os, re, time, urllib.request
from datetime import datetime, timezone, timedelta

# ---------------------------------------------------------------- config
API_BASE = "https://football-analytics-ai-production.up.railway.app"
SITE     = "https://www.scorinai.com"
OUT      = "public/blog"
SITEMAP  = "public/sitemap.xml"
PER_PAGE = 6
MAX_PER_LEAGUE = 3
MAX_TOTAL = 12
PAUSE = 0.4

POLL_SUPABASE_URL  = "https://mfoigbwxpyjbcicnixbj.supabase.co"
POLL_SUPABASE_ANON = "sb_publishable_IfgQdGbt7XaHszoGctcY8Q_fZTR4LuC"

# Which clubs make a fixture "featured". Names must match API-Football labels.
BIG_TEAMS = {
    "Premier League": ["Arsenal", "Liverpool", "Manchester City", "Manchester United",
                       "Chelsea", "Tottenham", "Newcastle"],
    "La Liga":        ["Real Madrid", "Barcelona", "Atletico Madrid", "Sevilla",
                       "Athletic Club", "Real Sociedad"],
    "Bundesliga":     ["Bayern Munich", "Borussia Dortmund", "RB Leipzig",
                       "Bayer Leverkusen", "Eintracht Frankfurt"],
    "Serie A":        ["Juventus", "Inter", "AC Milan", "Napoli", "Roma", "Atalanta"],
    "Ligue 1":        ["Paris Saint Germain", "Marseille", "Monaco", "Lyon", "Lille"],
    "Primeira Liga":  ["Benfica", "Porto", "Sporting CP", "Braga"],
    "Champions League": ["Real Madrid", "Barcelona", "Bayern Munich", "Manchester City",
                       "Liverpool", "Arsenal", "Inter", "Paris Saint Germain"],
}

LEAGUE_META = {  # name: (slug, css-class)
    "Premier League": ("premier-league", "pl"),
    "La Liga": ("la-liga", "laliga"),
    "Bundesliga": ("bundesliga", "bund"),
    "Serie A": ("serie-a", "seriea"),
    "Ligue 1": ("ligue-1", "ligue1"),
    "Primeira Liga": ("primeira-liga", "primeira"),
    "Champions League": ("champions-league", "ucl"),
}

# ---------------------------------------------------------------- helpers
def api_get(p):
    try:
        r = urllib.request.Request(f"{API_BASE}{p}", headers={"Accept": "application/json"})
        with urllib.request.urlopen(r, timeout=30) as x:
            return json.loads(x.read().decode())
    except Exception as e:
        print(f"  ! GET {p}: {e}"); return None

def api_post(p, body, timeout=120, retries=2):
    d = json.dumps(body).encode()
    for attempt in range(retries + 1):
        try:
            r = urllib.request.Request(f"{API_BASE}{p}", data=d,
                                       headers={"Content-Type": "application/json", "Accept": "application/json"})
            with urllib.request.urlopen(r, timeout=timeout) as x:
                return json.loads(x.read().decode())
        except urllib.error.HTTPError as e:
            # A real HTTP error (e.g. 404) won't fix itself on retry — stop.
            print(f"  ! POST {p}: {e}"); return None
        except Exception as e:
            if attempt < retries:
                print(f"  . POST {p} slow ({e}); retry {attempt + 1}/{retries} ...")
                time.sleep(3)
                continue
            print(f"  ! POST {p}: {e}"); return None

WRITE_UPS = True  # call the Sonnet write-up endpoint for each match page

def slugify(t):
    t = re.sub(r"[^a-zA-Z0-9]+", "-", t.lower()).strip("-")
    return re.sub(r"-{2,}", "-", t)

def get_preview(p, pred):
    """Fetch the Sonnet-written preview for one match; returns article HTML or ''."""
    if not WRITE_UPS:
        return ""
    payload = {
        "home": p["home"], "away": p["away"], "league": p["league"],
        "home_win": pred.get("home_win", 0), "draw": pred.get("draw", 0), "away_win": pred.get("away_win", 0),
        "home_expected_goals": pred.get("home_expected_goals"), "away_expected_goals": pred.get("away_expected_goals"),
        "most_likely_score": pred.get("most_likely_score") or pred.get("predicted_score"),
        "confidence_level": pred.get("confidence_level"),
        "home_form_sequence": pred.get("home_form_sequence") or [],
        "away_form_sequence": pred.get("away_form_sequence") or [],
        "key_factors": pred.get("key_factors") or [],
    }
    data = api_post("/blog/preview", payload, timeout=60, retries=1)
    text = (data or {}).get("preview", "").strip()
    if not text:
        return ""
    paras = [x.strip() for x in re.split(r"\n\s*\n", text) if x.strip()]
    return '<h2>The preview</h2>' + "".join(f"<p>{x}</p>" for x in paras)

def lmeta(league):
    return LEAGUE_META.get(league, (slugify(league or "football"), "pl"))

def dt(iso):
    try: return datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except Exception: return None

def human(iso):
    d = dt(iso); return (d.strftime("%A, ") + str(d.day) + d.strftime(" %B %Y")) if d else ""

def short(iso):
    d = dt(iso); return (d.strftime("%a ") + str(d.day) + d.strftime(" %b")) if d else "TBD"

def gameweek(iso):
    d = dt(iso)
    if not d: return ("Upcoming", "0000")
    mon = d - timedelta(days=d.weekday()); sun = mon + timedelta(days=6)
    return (f"{mon.day}\u2013{sun.day} {sun.strftime('%b')}", mon.strftime("%Y%m%d"))

def pct(x):
    try: return round(float(x) * 100)
    except Exception: return 0

def fill(t, m):
    for k, v in m.items(): t = t.replace(k, str(v))
    return t

def form_badges(seq):
    seq = (seq or [])[-5:]
    if not seq: return '<span style="color:var(--muted)">No recent data</span>'
    return "".join(f'<span class="fb {r}">{r}</span>' for r in seq)

# ---------------------------------------------------------------- CSS
CSS = """
:root{--bg:#0a0b0e;--surface:#111318;--raise:#15181f;--line:rgba(255,255,255,.08);--line2:rgba(255,255,255,.14);
--text:#f3f5f9;--soft:#c4ccd8;--muted:#828c9c;--faint:#525b6b;
--cyan:#2dd4ee;--purple:#a98bff;--green:#38e0a6;--amber:#f6c344;--red:#ff7089;--pink:#ff6fae;
--pl:#b79bff;--laliga:#ff9d5c;--bund:#ff5c74;--seriea:#3ad9ad;--ligue1:#5b8cff;--primeira:#40dd88;--ucl:#6f9bff;
--disp:'Space Grotesk',system-ui,sans-serif;--acc:'Fraunces',serif;--read:'Newsreader',Georgia,serif;--sans:'Outfit',system-ui,sans-serif;--mono:'JetBrains Mono',monospace;}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--bg);color:var(--text);font-family:var(--sans);line-height:1.6;-webkit-font-smoothing:antialiased;}
a{color:inherit;text-decoration:none;}img{max-width:100%;}
.accent{font-family:var(--acc);font-style:italic;font-weight:500;background:linear-gradient(100deg,var(--cyan),var(--purple) 55%,var(--pink));-webkit-background-clip:text;background-clip:text;color:transparent;}
.wrap{max-width:1200px;margin:0 auto;padding:0 40px;}
.nav{position:sticky;top:0;z-index:40;background:rgba(10,11,14,.82);backdrop-filter:saturate(150%) blur(14px);border-bottom:1px solid var(--line);}
.nav .in{max-width:1200px;margin:0 auto;padding:0 40px;height:66px;display:flex;align-items:center;justify-content:space-between;}
.brand{display:flex;align-items:center;gap:11px;font-family:var(--disp);font-weight:700;font-size:17px;}
.brand .dot{width:26px;height:26px;border-radius:8px;background:linear-gradient(140deg,var(--cyan),var(--purple));box-shadow:0 4px 16px rgba(45,212,238,.3);}
.brand em{color:var(--muted);font-style:normal;font-weight:500;}
.nlinks{display:flex;gap:28px;font-size:13.5px;color:var(--muted);font-weight:500;}.nlinks a:hover{color:var(--text);}
.nbtn{font-family:var(--mono);font-size:12.5px;border:1px solid var(--line2);border-radius:9px;padding:9px 15px;}.nbtn:hover{border-color:var(--cyan);background:rgba(45,212,238,.08);}
@media(max-width:820px){.nav .in{flex-wrap:wrap;height:auto;padding-top:12px;padding-bottom:12px;gap:10px 16px;}.nlinks{order:3;flex-basis:100%;gap:18px;font-size:13px;overflow-x:auto;white-space:nowrap;-webkit-overflow-scrolling:touch;padding-top:4px;}.nbtn{margin-left:auto;}}
.hero{position:relative;overflow:hidden;border-bottom:1px solid var(--line);}
.hero::before{content:"";position:absolute;top:-160px;left:-100px;width:480px;height:480px;border-radius:50%;background:radial-gradient(circle,rgba(45,212,238,.15),transparent 68%);}
.hero::after{content:"";position:absolute;top:-80px;right:-60px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(169,139,255,.15),transparent 68%);}
.hero .in{position:relative;z-index:1;padding:58px 0 40px;}
.eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--cyan);margin-bottom:18px;}
.hero h1{font-family:var(--disp);font-weight:700;font-size:56px;line-height:1;letter-spacing:-.03em;max-width:18ch;}
.hero p{font-size:18px;color:var(--soft);max-width:60ch;margin-top:18px;}
@media(max-width:820px){.hero h1{font-size:38px;}}
.picks-strip{padding:34px 0;border-bottom:1px solid var(--line);}
.strip-h{display:flex;align-items:baseline;gap:16px;margin-bottom:20px;}
.strip-h h2{font-family:var(--disp);font-weight:600;font-size:22px;}.strip-h .sub{font-family:var(--mono);font-size:12px;color:var(--muted);}.strip-h .more{margin-left:auto;font-family:var(--mono);font-size:12.5px;color:var(--cyan);}
.picks{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.pick{display:flex;align-items:center;gap:16px;border:1px solid var(--line);background:linear-gradient(160deg,var(--raise),var(--surface));border-radius:16px;padding:18px;transition:.15s;}
.pick:hover{border-color:rgba(45,212,238,.45);transform:translateY(-3px);}
.ring{width:64px;height:64px;flex-shrink:0;}
.ring-bg{fill:none;stroke:rgba(255,255,255,.08);stroke-width:7;}
.ring-fg{fill:none;stroke-width:7;stroke-linecap:round;transform:rotate(-90deg);transform-origin:50% 50%;}
.ring-t{fill:var(--text);font-family:var(--mono);font-weight:700;font-size:17px;}
.pk-teams{font-weight:600;font-size:14px;display:flex;flex-direction:column;gap:3px;}.pk-teams .w{color:var(--cyan);}
.pk-call{font-size:12px;color:var(--muted);margin-top:7px;}.pk-call b{color:var(--text);}
@media(max-width:900px){.picks{grid-template-columns:1fr;}}
.layout{display:grid;grid-template-columns:1fr 320px;gap:44px;padding:44px 0 60px;}
.feed-h{display:flex;align-items:baseline;gap:14px;margin-bottom:22px;}.feed-h h2{font-family:var(--disp);font-weight:600;font-size:24px;}.feed-h .sub{font-family:var(--mono);font-size:12px;color:var(--muted);}
.feed{display:flex;flex-direction:column;gap:22px;}
.pcard{border:1px solid var(--line);background:var(--surface);border-radius:18px;overflow:hidden;transition:.15s;display:block;}
.pcard:hover{border-color:rgba(45,212,238,.4);transform:translateY(-3px);}
.banner{position:relative;height:150px;display:flex;align-items:center;justify-content:center;}
.banner.pl{background:linear-gradient(135deg,rgba(183,155,255,.22),rgba(17,19,24,.6));}
.banner.laliga{background:linear-gradient(135deg,rgba(255,157,92,.22),rgba(17,19,24,.6));}
.banner.bund{background:linear-gradient(135deg,rgba(255,92,116,.22),rgba(17,19,24,.6));}
.banner.seriea{background:linear-gradient(135deg,rgba(58,217,173,.22),rgba(17,19,24,.6));}
.banner.ligue1{background:linear-gradient(135deg,rgba(91,140,255,.22),rgba(17,19,24,.6));}
.banner.primeira{background:linear-gradient(135deg,rgba(64,221,136,.22),rgba(17,19,24,.6));}
.banner.ucl{background:linear-gradient(135deg,rgba(111,155,255,.22),rgba(17,19,24,.6));}
.banner-teams{display:flex;align-items:center;gap:22px;}
.banner-teams img{width:52px;height:52px;object-fit:contain;filter:drop-shadow(0 4px 10px rgba(0,0,0,.4));}
.banner-teams .vs{font-family:var(--disp);font-weight:700;font-size:15px;color:var(--soft);letter-spacing:.05em;}
.banner-bar{position:absolute;bottom:0;left:0;right:0;height:6px;display:flex;gap:2px;}.banner-bar span{display:block;height:100%;}
.pbody{padding:20px 22px 22px;}
.pmeta{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.lgc{padding:3px 9px;border-radius:6px;font-family:var(--mono);font-size:10px;letter-spacing:.05em;text-transform:uppercase;}
.lgc.pl{color:var(--pl);background:rgba(183,155,255,.13);}.lgc.laliga{color:var(--laliga);background:rgba(255,157,92,.13);}
.lgc.bund{color:var(--bund);background:rgba(255,92,116,.13);}.lgc.seriea{color:var(--seriea);background:rgba(58,217,173,.13);}
.lgc.ligue1{color:var(--ligue1);background:rgba(91,140,255,.13);}.lgc.primeira{color:var(--primeira);background:rgba(64,221,136,.13);}.lgc.ucl{color:var(--ucl);background:rgba(111,155,255,.13);}
.pmeta .dt{font-family:var(--mono);font-size:11px;color:var(--muted);}
.pcard h3{font-family:var(--disp);font-weight:600;font-size:23px;letter-spacing:-.01em;margin-bottom:8px;}
.pcard .exc{font-size:14.5px;color:var(--muted);line-height:1.55;max-width:60ch;}
.pcard .rm{display:inline-block;margin-top:14px;font-family:var(--mono);font-size:12.5px;color:var(--cyan);font-weight:500;}
.pager{display:flex;gap:8px;margin-top:34px;align-items:center;}
.pager a,.pager span.cur{width:38px;height:38px;display:grid;place-items:center;border:1px solid var(--line);border-radius:10px;font-family:var(--mono);font-size:13px;color:var(--muted);transition:.15s;}
.pager .cur{background:linear-gradient(135deg,var(--cyan),var(--purple));color:#06101a;border-color:transparent;font-weight:700;}
.pager a:hover{border-color:var(--cyan);color:var(--text);}.pager .nx{width:auto;padding:0 14px;}
.side{display:flex;flex-direction:column;gap:22px;}
.widget{border:1px solid var(--line);background:var(--surface);border-radius:16px;padding:20px;}
.widget h4{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);margin-bottom:16px;}
.lg-list{display:flex;flex-direction:column;gap:3px;}
.lg-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:9px;transition:.15s;}.lg-row:hover{background:rgba(255,255,255,.03);}
.lg-row .d{width:8px;height:8px;border-radius:50%;flex-shrink:0;}.lg-row .nm{font-size:13.5px;font-weight:500;flex:1;}.lg-row .ct{font-family:var(--mono);font-size:12px;color:var(--muted);}
.recent{display:flex;flex-direction:column;gap:14px;}.recent a{font-size:13.5px;color:var(--soft);line-height:1.4;font-weight:500;display:block;}.recent a:hover{color:var(--cyan);}
.recent a .rd{display:block;font-family:var(--mono);font-size:10.5px;color:var(--faint);margin-top:3px;font-weight:400;}
.gw{display:flex;flex-direction:column;gap:9px;}.gw div{display:flex;justify-content:space-between;font-size:13px;color:var(--soft);padding:6px 0;border-bottom:1px solid var(--line);}.gw div:last-child{border-bottom:none;}.gw div span{font-family:var(--mono);font-size:11px;color:var(--muted);}
.tags{display:flex;flex-wrap:wrap;gap:8px;}.tag{font-size:12px;color:var(--soft);border:1px solid var(--line);border-radius:999px;padding:5px 12px;transition:.15s;}.tag:hover{border-color:var(--cyan);color:var(--cyan);}
@media(max-width:900px){.layout{grid-template-columns:1fr;gap:34px;}}
footer{border-top:1px solid var(--line);}
footer .in{max-width:1200px;margin:0 auto;padding:32px 40px 64px;color:var(--muted);font-size:13px;display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;}
footer a{font-weight:600;}footer a:hover{color:var(--text);}footer .sep{flex:1;}
/* match page */
.mpage{max-width:1180px;margin:0 auto;padding:0 40px;}
.mhead h1{font-family:var(--disp);font-weight:700;font-size:44px;line-height:1.05;letter-spacing:-.025em;margin:14px 0 12px;max-width:20ch;}
.abyline{font-family:var(--mono);font-size:12.5px;color:var(--faint);padding-bottom:24px;border-bottom:1px solid var(--line);}
.matchbar{display:flex;align-items:center;justify-content:center;gap:44px;border:1px solid var(--line);background:linear-gradient(160deg,var(--raise),var(--surface));border-radius:18px;padding:32px;margin:26px 0;}
.matchbar .t{display:flex;flex-direction:column;align-items:center;gap:11px;}
.matchbar .t img{width:64px;height:64px;object-fit:contain;}
.matchbar .t span{font-family:var(--disp);font-weight:600;font-size:18px;}
.matchbar .vs{font-family:var(--mono);color:var(--muted);font-size:14px;}
.lead{font-family:var(--read);font-size:21px;line-height:1.6;color:var(--soft);margin:26px 0;max-width:70ch;}
.mh{font-family:var(--disp);font-weight:600;font-size:26px;margin:44px 0 20px;letter-spacing:-.01em;}
.igrid{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
@media(max-width:820px){.igrid{grid-template-columns:1fr;}}
.fig{border:1px solid var(--line);background:var(--surface);border-radius:18px;padding:24px;}
.fig .cap{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:20px;}
.fig .note{font-size:12px;color:var(--faint);margin-top:16px;line-height:1.5;}
.pbar{display:flex;height:16px;border-radius:999px;overflow:hidden;gap:3px;margin-bottom:14px;}.pbar span{display:block;height:100%;}
.plabs{display:flex;justify-content:space-between;}.plabs>div{display:flex;flex-direction:column;gap:2px;}.plabs .m{align-items:center;}.plabs .r{align-items:flex-end;}
.plabs b{font-family:var(--mono);font-weight:700;font-size:21px;}.plabs span{font-size:12px;color:var(--muted);}
.xgc{display:grid;gap:14px;}.xgc .row{display:grid;grid-template-columns:100px 1fr 40px;align-items:center;gap:12px;}.xgc .nm{font-size:13.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.xgc .track{height:16px;border-radius:999px;background:rgba(255,255,255,.05);overflow:hidden;}.xgc .track>i{display:block;height:100%;border-radius:999px;}.xgc .v{font-family:var(--mono);font-size:14px;text-align:right;}
.fg-row{margin-bottom:18px;}.fg-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px;}.fg-top .nm{font-size:14px;font-weight:600;}.fg-top .pts{font-family:var(--mono);font-size:12px;color:var(--muted);}
.fg-cells{display:flex;gap:6px;}.fgc{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;font-family:var(--mono);font-weight:700;font-size:12px;}
.fgc.W{background:rgba(56,224,166,.16);color:var(--green);}.fgc.D{background:rgba(246,195,68,.16);color:var(--amber);}.fgc.L{background:rgba(255,112,137,.16);color:var(--red);}
.fg-bar{display:flex;height:8px;border-radius:999px;overflow:hidden;margin-top:16px;background:rgba(255,255,255,.05);}.fg-bar i{display:block;height:100%;}
.heat{display:grid;grid-template-columns:auto repeat(4,1fr);gap:5px;font-family:var(--mono);}
.heat .h{font-size:10.5px;color:var(--muted);display:grid;place-items:center;padding:3px;}
.heat .cell{aspect-ratio:1.7;border-radius:7px;display:grid;place-items:center;font-size:11.5px;font-weight:700;}
.mstats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:24px;}
.mstats>div{border:1px solid var(--line);background:var(--surface);border-radius:14px;padding:18px;text-align:center;}
.mstats span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:6px;}.mstats b{font-family:var(--mono);font-weight:700;font-size:18px;}
.article-body{max-width:72ch;}
.article-body h2{font-family:var(--disp);font-weight:600;font-size:26px;margin:0 0 16px;letter-spacing:-.01em;}
.article-body p{font-family:var(--read);font-size:19px;line-height:1.72;color:var(--soft);margin:0 0 20px;}
.factors{list-style:none;padding:0;margin:4px 0 20px;max-width:72ch;}
.factors li{position:relative;padding-left:22px;margin-bottom:12px;font-family:var(--read);font-size:18px;color:var(--soft);}
.factors li::before{content:"";position:absolute;left:0;top:11px;width:7px;height:7px;border-radius:50%;background:var(--cyan);}
.poll{border:1px solid var(--line);background:linear-gradient(180deg,var(--raise),var(--surface));border-radius:18px;padding:24px;margin:36px 0;max-width:640px;}
.poll-q{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px;}.poll-q .t{font-weight:700;font-size:16px;}.poll-total{font-family:var(--mono);font-size:12px;color:var(--muted);}
.poll-opt{position:relative;display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:transparent;border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:10px;cursor:pointer;color:var(--text);font-family:var(--sans);overflow:hidden;}
.poll.open .poll-opt:hover{border-color:rgba(45,212,238,.45);background:rgba(45,212,238,.05);}
.poll-opt .lbl{font-weight:600;font-size:15px;flex:1;z-index:2;}.poll-opt .bar{position:absolute;inset:0;z-index:1;}.poll-opt .bar>i{display:block;height:100%;width:0;background:rgba(45,212,238,.14);transition:width .7s;}
.poll-opt .pc{font-family:var(--mono);font-weight:700;font-size:14px;color:var(--muted);z-index:2;opacity:0;transition:.3s;}
.poll.done .poll-opt .pc{opacity:1;}.poll.done .poll-opt.mine{border-color:rgba(45,212,238,.55);}.poll.done .poll-opt.mine .pc{color:var(--cyan);}
.poll-foot{font-size:12px;color:var(--faint);margin-top:12px;}
.cta{display:flex;align-items:center;justify-content:space-between;gap:16px;border:1px solid rgba(45,212,238,.3);border-radius:16px;padding:24px 26px;margin:36px 0 8px;background:linear-gradient(120deg,rgba(45,212,238,.08),rgba(169,139,255,.06));max-width:820px;}
.cta .t{font-weight:700;font-size:16px;}.cta .s{font-size:13.5px;color:var(--muted);margin-top:3px;}.cta .go{font-family:var(--mono);font-weight:700;color:var(--cyan);}
.disc{font-size:13px;color:var(--faint);border-top:1px solid var(--line);padding-top:20px;margin:36px 0 60px;max-width:72ch;}
@media(max-width:600px){.mpage{padding:0 20px;}.mhead h1{font-size:31px;}.lead{font-size:19px;}.matchbar{gap:24px;padding:24px;}.cta{flex-direction:column;align-items:flex-start;}}

"""

POLL_JS = """(function(){var URL="__U__",KEY="__K__";var box=document.querySelector('.poll');if(!box)return;var slug=box.getAttribute('data-slug');var opts=box.querySelectorAll('.poll-opt');var tot=box.querySelector('.poll-total');var voted=null;try{voted=localStorage.getItem('poll_'+slug);}catch(e){}function H(x){return Object.assign({apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'},x||{});}function ap(res){var m={home:(res&&res.home)||0,draw:(res&&res.draw)||0,away:(res&&res.away)||0};var t=m.home+m.draw+m.away;if(tot)tot.textContent=t+(t===1?' vote':' votes');if(!voted){box.classList.add('open');return;}box.classList.add('done');opts.forEach(function(o){var p=o.getAttribute('data-pick'),pc=t?Math.round(m[p]*100/t):0;var i=o.querySelector('.bar>i');if(i)i.style.width=pc+'%';var pe=o.querySelector('.pc');if(pe)pe.textContent=pc+'%';if(voted===p)o.classList.add('mine');});}function load(){fetch(URL+'/rest/v1/rpc/get_poll_results',{method:'POST',headers:H(),body:JSON.stringify({p_slug:slug})}).then(function(r){return r.json();}).then(function(rows){ap(rows&&rows[0]);}).catch(function(){box.classList.add('open');});}function vote(p){if(voted)return;voted=p;try{localStorage.setItem('poll_'+slug,p);}catch(e){}fetch(URL+'/rest/v1/poll_votes',{method:'POST',headers:H({Prefer:'return=minimal'}),body:JSON.stringify({match_slug:slug,pick:p})}).then(load).catch(load);}opts.forEach(function(o){o.addEventListener('click',function(){vote(o.getAttribute('data-pick'));});});load();})();"""

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>'
         '<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@1,9..144,500;1,9..144,600&family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>')

NAV = ('<nav class="nav"><div class="in"><a class="brand" href="' + SITE + '"><span class="dot"></span> Scorina AI <em>Journal</em></a>'
       '<div class="nlinks"><a href="/blog/">Previews</a><a href="/blog/how-scorina-ai-predicts.html">How it works</a>'
       '<a href="' + SITE + '/#/live">Live</a></div><a class="nbtn" href="' + SITE + '">Open app ↗</a></div></nav>')

FOOTER = ('<footer><div class="in"><a href="/blog/">Journal</a><a href="' + SITE + '/#/live">Live Scores</a>'
          '<a href="' + SITE + '/#/analysis">Predictions</a><a href="' + SITE + '/#/bestpicks">AI Picks</a>'
          '<span class="sep"></span><span>© 2026 Scorina AI · Football analytics &amp; predictions</span></div></footer>')

def page(title, desc, canon, body, extra_head="", script=""):
    return fill("""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/><title>__T__</title>
<meta name="description" content="__D__"/><link rel="canonical" href="__C__"/><meta name="robots" content="index, follow"/>
<meta property="og:title" content="__T__"/><meta property="og:description" content="__D__"/><meta property="og:url" content="__C__"/>
<meta property="og:image" content="__S__/og-image.png"/>__EH____FONTS__<style>__CSS__</style></head>
<body>__NAV____BODY____FOOTER____SCRIPT__</body></html>""",
    {"__T__": title, "__D__": desc, "__C__": canon, "__S__": SITE, "__EH__": extra_head,
     "__FONTS__": FONTS, "__CSS__": CSS, "__NAV__": NAV, "__BODY__": body, "__FOOTER__": FOOTER, "__SCRIPT__": script})

# ---------------------------------------------------------------- selection
def involves(fx):
    b = BIG_TEAMS.get(fx.get("league"), [])
    return (fx.get("homeTeam") in b) + (fx.get("awayTeam") in b)

def select_featured(fixtures):
    by = {}
    for fx in fixtures:
        if not fx.get("homeTeam") or not fx.get("awayTeam"): continue
        if fx.get("league") not in BIG_TEAMS: continue
        if involves(fx) == 0: continue
        by.setdefault(fx["league"], []).append(fx)
    picked = []
    for league, items in by.items():
        items.sort(key=lambda f: -involves(f))
        picked += items[:MAX_PER_LEAGUE]
    picked.sort(key=lambda f: -involves(f))
    return picked[:MAX_TOTAL]

# ---------------------------------------------------------------- component renderers
def pick_ring(p):
    top = max(p["hw"], p["aw"]); circ = 207.35; off = round(circ * (1 - top / 100), 1)
    grad = "rgHi" if top >= 62 else ("rgMd" if top >= 45 else "rgLo")
    win = p["home"] if p["hw"] >= p["aw"] else p["away"]
    return fill('<a class="pick" href="/blog/__SLUG__.html"><svg class="ring" viewBox="0 0 80 80"><circle class="ring-bg" cx="40" cy="40" r="33"/>'
        '<circle class="ring-fg" style="stroke:url(#__G__)" cx="40" cy="40" r="33" stroke-dasharray="207.35" stroke-dashoffset="__OFF__"/>'
        '<text class="ring-t" x="40" y="40" text-anchor="middle" dominant-baseline="central">__TOP__%</text></svg>'
        '<div><div class="pk-teams"><span class="w">__WIN__ ✓</span><span>__OTHER__</span></div>'
        '<div class="pk-call"><b>__WIN__ win</b> · __SCORE__</div></div></a>',
        {"__SLUG__": p["slug"], "__G__": grad, "__OFF__": off, "__TOP__": top, "__WIN__": win,
         "__OTHER__": p["away"] if win == p["home"] else p["home"], "__SCORE__": p["score"]})

def card(p):
    return fill('<a class="pcard" href="/blog/__SLUG__.html"><div class="banner __CL__"><div class="banner-teams">'
        '<img src="__HL__" alt="" loading="lazy"/><span class="vs">VS</span><img src="__AL__" alt="" loading="lazy"/></div>'
        '<div class="banner-bar"><span style="width:__HW__%;background:var(--cyan)"></span><span style="width:__DR__%;background:#3b4459"></span><span style="width:__AW__%;background:var(--purple)"></span></div></div>'
        '<div class="pbody"><div class="pmeta"><span class="lgc __CL__">__LEAGUE__</span><span class="dt">__KICK__ · GW __GW__</span></div>'
        '<h3>__HOME__ vs __AWAY__</h3><p class="exc">__EXC__</p><span class="rm">Read full preview →</span></div></a>',
        {"__SLUG__": p["slug"], "__CL__": p["cls"], "__HL__": p["hl"], "__AL__": p["al"],
         "__HW__": p["hw"], "__DR__": p["dr"], "__AW__": p["aw"], "__LEAGUE__": p["league"],
         "__KICK__": p["kick"], "__GW__": p["gw"], "__HOME__": p["home"], "__AWAY__": p["away"], "__EXC__": p["exc"]})

def sidebar(posts, all_posts):
    lg = {}
    for p in all_posts: lg.setdefault(p["league"], 0); lg[p["league"]] += 1
    lg_rows = "".join(fill('<a class="lg-row" href="/blog/league/__SL__.html"><span class="d" style="background:var(--__CL__)"></span><span class="nm">__L__</span><span class="ct">__N__</span></a>',
        {"__SL__": lmeta(L)[0], "__CL__": lmeta(L)[1], "__L__": L, "__N__": n}) for L, n in sorted(lg.items(), key=lambda x: -x[1]))
    recent = "".join(fill('<a href="/blog/__SLUG__.html">__HOME__ vs __AWAY__<span class="rd">__LEAGUE__ · __KICK__</span></a>',
        {"__SLUG__": p["slug"], "__HOME__": p["home"], "__AWAY__": p["away"], "__LEAGUE__": p["league"], "__KICK__": p["kick"]})
        for p in sorted(all_posts, key=lambda p: p["date"] or "", reverse=True)[:5])
    gw = {}
    for p in all_posts: gw.setdefault((p["gwsort"], p["gw"]), 0); gw[(p["gwsort"], p["gw"])] += 1
    gw_rows = "".join(f'<div>{label} <span>{n}</span></div>' for (s, label), n in sorted(gw.items()))
    teams = {}
    for p in all_posts:
        for t in (p["home"], p["away"]): teams[t] = slugify(t)
    tags = "".join(f'<a class="tag" href="/blog/team/{s}.html">{t}</a>' for t, s in sorted(teams.items()))
    return fill('<aside class="side"><div class="widget"><h4>Leagues</h4><div class="lg-list">__LG__</div></div>'
        '<div class="widget"><h4>Recent previews</h4><div class="recent">__RC__</div></div>'
        '<div class="widget"><h4>By gameweek</h4><div class="gw">__GW__</div></div>'
        '<div class="widget"><h4>Teams</h4><div class="tags">__TG__</div></div></aside>',
        {"__LG__": lg_rows, "__RC__": recent, "__GW__": gw_rows, "__TG__": tags})

def pager(cur, total):
    if total <= 1: return ""
    out = []
    for i in range(1, total + 1):
        href = "/blog/" if i == 1 else f"/blog/index-{i}.html"
        out.append(f'<span class="cur">{i}</span>' if i == cur else f'<a href="{href}">{i}</a>')
    if cur < total:
        nxt = "/blog/" if cur + 1 == 1 else f"/blog/index-{cur+1}.html"
        out.append(f'<a class="nx" href="{nxt}">Next →</a>')
    return '<div class="pager">' + "".join(out) + '</div>'

DEFS = ('<svg width="0" height="0" style="position:absolute"><defs>'
        '<linearGradient id="rgHi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#38e0a6"/><stop offset="1" stop-color="#2dd4ee"/></linearGradient>'
        '<linearGradient id="rgMd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6c344"/><stop offset="1" stop-color="#ff9d5c"/></linearGradient>'
        '<linearGradient id="rgLo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2dd4ee"/><stop offset="1" stop-color="#a98bff"/></linearGradient></defs></svg>')

# ---------------------------------------------------------------- page builders
def build_hub(posts):
    pages = [posts[i:i + PER_PAGE] for i in range(0, len(posts), PER_PAGE)] or [[]]
    total = len(pages)
    picks = sorted(posts, key=lambda p: -max(p["hw"], p["aw"]))[:3]
    strip = ('<section class="picks-strip"><div class="wrap"><div class="strip-h"><h2>Top picks</h2>'
             '<span class="sub">/ highest-confidence this week</span></div><div class="picks">'
             + "".join(pick_ring(p) for p in picks) + '</div></div></section>') if picks else ""
    for idx, chunk in enumerate(pages, 1):
        feed = "".join(card(p) for p in chunk) or '<p style="color:var(--muted)">No featured matches this week yet.</p>'
        hero = ('<header class="hero"><div class="wrap in"><div class="eyebrow">The Scorina AI Journal / Match intelligence</div>'
                '<h1>Football, <span class="accent">decided by data</span>.</h1>'
                '<p>AI-generated previews for the biggest fixtures across Europe — win probabilities, expected goals and the most likely scoreline. Tap any match for the full breakdown and vote on who wins.</p></div></header>')
        body = DEFS + (hero + strip if idx == 1 else "") + (
            '<div class="wrap"><div class="layout"><main><div class="feed-h"><h2>Latest previews</h2>'
            f'<span class="sub">/ page {idx} of {total}</span></div><div class="feed">{feed}</div>{pager(idx, total)}</main>'
            + sidebar(chunk, posts) + '</div></div>')
        html = page("The Scorina AI Journal — Football Match Previews & Predictions",
                    "AI-powered previews and predictions for the biggest fixtures in the Premier League, La Liga, Serie A and Europe's top leagues.",
                    f"{SITE}/blog/", body)
        write(f"{OUT}/index.html" if idx == 1 else f"{OUT}/index-{idx}.html", html)

def build_league(league, posts):
    sl, cl = lmeta(league)
    feed = "".join(card(p) for p in posts)
    hero = fill('<header class="hero"><div class="wrap in"><div class="eyebrow">Previews / __L__</div>'
        '<h1>__L__ <span class="accent">predictions</span>.</h1>'
        '<p>AI match previews and predictions for this week\'s biggest __L__ fixtures — win probabilities, expected goals and the most likely scoreline.</p></div></header>',
        {"__L__": league})
    body = hero + f'<div class="wrap"><div class="layout"><main><div class="feed-h"><h2>{league} previews</h2><span class="sub">/ {len(posts)} this week</span></div><div class="feed">{feed}</div></main>' + sidebar(posts, posts) + '</div></div>'
    write(f"{OUT}/league/{sl}.html", page(f"{league} Predictions & Match Previews | Scorina AI",
        f"AI predictions and match previews for the biggest {league} fixtures — probabilities, expected goals and scorelines.",
        f"{SITE}/blog/league/{sl}.html", body))

def build_team(team, slug, posts, all_posts):
    feed = "".join(card(p) for p in posts)
    hero = fill('<header class="hero"><div class="wrap in"><div class="eyebrow">Previews / __T__</div>'
        '<h1>__T__ <span class="accent">predictions</span>.</h1>'
        '<p>Every Scorina AI preview and prediction featuring __T__ — probabilities, expected goals and the most likely scoreline for each match.</p></div></header>',
        {"__T__": team})
    body = hero + f'<div class="wrap"><div class="layout"><main><div class="feed-h"><h2>{team} previews</h2><span class="sub">/ {len(posts)} this week</span></div><div class="feed">{feed}</div></main>' + sidebar(posts, all_posts) + '</div></div>'
    write(f"{OUT}/team/{slug}.html", page(f"{team} Predictions & Match Previews | Scorina AI",
        f"AI predictions and match previews featuring {team} — win probabilities, expected goals and scorelines.",
        f"{SITE}/blog/team/{slug}.html", body))

def form_points(seq):
    return sum(3 if r == "W" else 1 if r == "D" else 0 for r in (seq or [])[-5:])

def form_cells(seq):
    seq = (seq or [])[-5:]
    if not seq:
        return '<span style="color:var(--muted)">No recent data</span>'
    return "".join(f'<span class="fgc {r}">{r}</span>' for r in seq)

def _poisson(k, lam):
    return math.exp(-lam) * (lam ** k) / math.factorial(k)

def xg_html(hxg, axg, home, away):
    try:
        h, a = float(hxg), float(axg)
    except Exception:
        return '<div style="color:var(--muted)">Expected goals unavailable.</div>'
    m = max(h, a, 0.1)
    return (f'<div class="xgc"><div class="row"><span class="nm">{home}</span><span class="track"><i style="width:{round(h/m*100)}%;background:var(--cyan)"></i></span><span class="v">{h}</span></div>'
            f'<div class="row"><span class="nm">{away}</span><span class="track"><i style="width:{round(a/m*100)}%;background:var(--purple)"></i></span><span class="v">{a}</span></div></div>')

def form_guide_html(p, pred):
    hs = pred.get("home_form_sequence") or []
    aw = pred.get("away_form_sequence") or []
    hp, ap = form_points(hs), form_points(aw)
    tot = (hp + ap) or 1
    return (f'<div class="fg-row"><div class="fg-top"><span class="nm">{p["home"]}</span><span class="pts">{hp}/15 pts</span></div><div class="fg-cells">{form_cells(hs)}</div></div>'
            f'<div class="fg-row"><div class="fg-top"><span class="nm">{p["away"]}</span><span class="pts">{ap}/15 pts</span></div><div class="fg-cells">{form_cells(aw)}</div></div>'
            f'<div class="fg-bar"><i style="width:{round(hp/tot*100)}%;background:var(--cyan)"></i><i style="width:{round(ap/tot*100)}%;background:var(--purple)"></i></div>')

def scoreline_html(hxg, axg, home, away, maxg=3):
    try:
        h, a = float(hxg), float(axg)
    except Exception:
        return '<div style="color:var(--muted)">Scoreline model unavailable.</div>'
    grid = [[_poisson(i, h) * _poisson(j, a) for j in range(maxg + 1)] for i in range(maxg + 1)]
    mx = max(max(row) for row in grid) or 1
    ha, aa = home[:3].upper(), away[:3].upper()
    cells = '<div class="h"></div>' + "".join(f'<div class="h">{aa} {j}</div>' for j in range(maxg + 1))
    for i in range(maxg + 1):
        cells += f'<div class="h">{ha} {i}</div>'
        for j in range(maxg + 1):
            pv = grid[i][j]
            op = round(pv / mx, 2)
            col = "#04121a" if pv == mx else "var(--soft)"
            cells += f'<div class="cell" style="background:rgba(45,212,238,{op});color:{col}">{i}-{j}</div>'
    return f'<div class="heat">{cells}</div>'

def build_match(fx, pred, p):
    article = get_preview(p, pred)
    factors = pred.get("key_factors") or []
    fx_html = ""
    if factors:
        fx_html = '<h2>Key factors</h2><ul class="factors">' + "".join(f"<li>{f}</li>" for f in factors[:4]) + '</ul>'

    fav = p["home"] if p["hw"] >= p["aw"] else p["away"]
    favp = max(p["hw"], p["aw"])
    verdict = f"The model leans to {fav} at {favp}%" if favp - p["dr"] > 3 else "The model sees a close, even contest"

    win_fig = ('<div class="fig"><div class="cap">Win probability</div>'
        f'<div class="pbar"><span style="width:{p["hw"]}%;background:var(--cyan)"></span><span style="width:{p["dr"]}%;background:#3b4459"></span><span style="width:{p["aw"]}%;background:var(--purple)"></span></div>'
        f'<div class="plabs"><div><b style="color:var(--cyan)">{p["hw"]}%</b><span>{p["home"]}</span></div><div class="m"><b>{p["dr"]}%</b><span>Draw</span></div><div class="r"><b style="color:var(--purple)">{p["aw"]}%</b><span>{p["away"]}</span></div></div></div>')
    xg_fig = f'<div class="fig"><div class="cap">Expected goals</div>{xg_html(p["xgh"], p["xga"], p["home"], p["away"])}<div class="note">Goals each side is projected to create, from the model.</div></div>'
    form_fig = f'<div class="fig"><div class="cap">Recent form · last 5</div>{form_guide_html(p, pred)}<div class="note">Points from the last five matches (W=3, D=1, L=0).</div></div>'
    score_fig = f'<div class="fig"><div class="cap">Most likely scorelines</div>{scoreline_html(p["xgh"], p["xga"], p["home"], p["away"])}<div class="note">From a Poisson model of each side\'s expected goals. Brighter = more likely.</div></div>'
    article_block = article if article else ""

    body = fill('<main class="mpage">'
        '<div class="mhead"><div class="pmeta" style="padding-top:44px"><span class="lgc __CL__">__LEAGUE__</span><span class="dt">__KICKF__</span></div>'
        '<h1>__HOME__ vs __AWAY__: AI Prediction &amp; Preview</h1><div class="abyline">Scorina AI · __PUB__</div></div>'
        '<div class="matchbar"><div class="t"><img src="__HL__" alt=""/><span>__HOME__</span></div><div class="vs">VS</div><div class="t"><img src="__AL__" alt=""/><span>__AWAY__</span></div></div>'
        '<p class="lead">__VERDICT__. Below is the full model breakdown \u2014 win probabilities, expected goals, recent form and the most likely scorelines.</p>'
        '<h2 class="mh">Match insights</h2><div class="igrid">__WINFIG____XGFIG____FORMFIG____SCOREFIG__</div>'
        '<div class="mstats"><div><span>Likely score</span><b>__LSCORE__</b></div><div><span>Confidence</span><b>__CONF__</b></div><div><span>Expected goals</span><b>__XGH__ &ndash; __XGA__</b></div></div>'
        '<div class="article-body">__ARTICLE__</div>'
        '<div class="article-body">__FX__</div>'
        '<div class="poll" data-slug="__SLUG__"><div class="poll-q"><span class="t">Who wins? Cast your vote</span><span class="poll-total"></span></div>'
        '<button class="poll-opt" data-pick="home"><span class="bar"><i></i></span><span class="lbl">__HOME__</span><span class="pc"></span></button>'
        '<button class="poll-opt" data-pick="draw"><span class="bar"><i></i></span><span class="lbl">Draw</span><span class="pc"></span></button>'
        '<button class="poll-opt" data-pick="away"><span class="bar"><i></i></span><span class="lbl">__AWAY__</span><span class="pc"></span></button>'
        '<div class="poll-foot">Tap your pick to see how everyone voted.</div></div>'
        '<a class="cta" href="__SITE__/#/analysis"><span><span class="t">Want the live version?</span><br><span class="s">See the up-to-the-minute prediction on Scorina AI.</span></span><span class="go">Open \u2192</span></a>'
        '<p class="disc">Predictions are model estimates for analysis and entertainment, not betting advice.</p></main>',
        {"__CL__": p["cls"], "__LEAGUE__": p["league"], "__KICKF__": p["kickf"], "__HOME__": p["home"], "__AWAY__": p["away"],
         "__PUB__": (str(datetime.now(timezone.utc).day) + datetime.now(timezone.utc).strftime(" %B %Y")),
         "__HL__": p["hl"], "__AL__": p["al"], "__VERDICT__": verdict,
         "__WINFIG__": win_fig, "__XGFIG__": xg_fig, "__FORMFIG__": form_fig, "__SCOREFIG__": score_fig,
         "__LSCORE__": p["score"], "__CONF__": p["conf"], "__XGH__": p["xgh"], "__XGA__": p["xga"],
         "__ARTICLE__": article_block, "__FX__": fx_html, "__SLUG__": p["slug"], "__SITE__": SITE})
    poll_js = POLL_JS.replace("__U__", POLL_SUPABASE_URL).replace("__K__", POLL_SUPABASE_ANON)
    write(f"{OUT}/{p['slug']}.html", page(f"{p['home']} vs {p['away']} Prediction: AI Preview & Score | Scorina AI",
        f"{p['home']} vs {p['away']} prediction and preview — win probabilities, expected goals, recent form and the most likely scoreline. Vote on who wins.",
        f"{SITE}/blog/{p['slug']}.html", body, script=f"<script>{poll_js}</script>"))


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f: f.write(content)

# ---------------------------------------------------------------- main
def main():
    print(f"Fetching fixtures from {API_BASE} ...")
    fixtures = api_get("/live/upcoming") or []
    if not isinstance(fixtures, list) or not fixtures:
        print("No upcoming fixtures. Nothing to generate."); return

    featured = select_featured(fixtures)
    if not featured:
        print("No featured (big-club) fixtures this week."); return
    print(f"Selected {len(featured)} featured fixtures.")

    posts = []
    for fx in featured:
        home, away, league = fx["homeTeam"], fx["awayTeam"], fx["league"]
        slug = slugify(f"{home}-vs-{away}-prediction")
        print(f"  -> {home} vs {away} ({league})")
        pred = api_post("/predict/match", {"home_team": home, "away_team": away, "league": league})
        time.sleep(PAUSE)
        if not pred or "home_win" not in pred:
            print("     skipped (no prediction)"); continue
        gw_label, gw_sort = gameweek(fx.get("date"))
        p = {"slug": slug, "home": home, "away": away, "league": league, "cls": lmeta(league)[1],
             "date": fx.get("date"), "kick": short(fx.get("date")),
             "kickf": human(fx.get("date")) + (f", {fx.get('venue')}" if fx.get("venue") else ""),
             "gw": gw_label, "gwsort": gw_sort,
             "hl": fx.get("homeLogo") or pred.get("home_crest") or "",
             "al": fx.get("awayLogo") or pred.get("away_crest") or "",
             "hw": pct(pred.get("home_win")), "dr": pct(pred.get("draw")), "aw": pct(pred.get("away_win")),
             "xgh": pred.get("home_expected_goals", ""), "xga": pred.get("away_expected_goals", ""),
             "score": pred.get("most_likely_score") or pred.get("predicted_score") or "—",
             "conf": pred.get("confidence_level") or "Medium",
             "exc": f"Our model reads {home} vs {away} — win probabilities, expected goals and the most likely scoreline, plus the case for each result."}
        build_match(fx, pred, p)
        posts.append(p)

    if not posts:
        print("No posts generated."); return

    build_hub(posts)

    leagues = {}
    for p in posts: leagues.setdefault(p["league"], []).append(p)
    for L, ps in leagues.items(): build_league(L, ps)

    teams = {}
    for p in posts:
        for t in (p["home"], p["away"]): teams.setdefault(t, []).append(p)
    for t, ps in teams.items(): build_team(t, slugify(t), ps, posts)

    # sitemap
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    urls = [(f"{SITE}/blog/", "daily", "0.9")]
    urls += [(f"{SITE}/blog/{p['slug']}.html", "weekly", "0.7") for p in posts]
    urls += [(f"{SITE}/blog/league/{lmeta(L)[0]}.html", "weekly", "0.6") for L in leagues]
    urls += [(f"{SITE}/blog/team/{slugify(t)}.html", "weekly", "0.5") for t in teams]
    body = "\n".join(f'  <url><loc>{u}</loc><lastmod>{today}</lastmod><changefreq>{c}</changefreq><priority>{pr}</priority></url>' for u, c, pr in urls)
    write(SITEMAP, f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{body}\n</urlset>\n')

    # Which matches have a preview page — so the app can show a link only for these.
    # Keyed by "home vs away" (lowercased) AND by slug, both point to the blog URL.
    index = {}
    for p in posts:
        url = f"/blog/{p['slug']}.html"
        index[p["slug"]] = url
        index[f"{p['home']} vs {p['away']}".lower()] = url
        index[f"{p['away']} vs {p['home']}".lower()] = url  # tolerate reversed order
    write(f"{OUT}/blog_slugs.json", json.dumps({"generated": today, "matches": index}, ensure_ascii=False))

    print(f"\nDone. {len(posts)} matches, {len(leagues)} league pages, {len(teams)} team pages, hub + sitemap + slug index.")

if __name__ == "__main__":
    main()