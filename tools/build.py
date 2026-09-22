"""Generates every HTML page of The HBC website.

Run from anywhere:  python3 tools/build.py
Edit page content here, then re-run; the .html files in the repo are the output.
"""
import os
OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

I = {
 "ball": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 2c-1.5 4-1 7.5 1.5 10.5M12 12c-3.5 1.5-7 1-10-1M12 12c2.5 2.5 3 6.5 2 10"/></svg>',
 "clip": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 11h6M9 15h4"/></svg>',
 "sun": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
 "user": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
 "team": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5M15.5 14.5c2.5 0 4.8 1.5 6 4.5"/></svg>',
 "trophy": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/></svg>',
 "heart": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20s-7-4.5-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.5-9 9-9 9z"/></svg>',
 "pin": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
 "phone": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
 "mail": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
 "clock": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 "ig": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
 "fb": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 9V7c0-1 .5-1.5 1.5-1.5H17V2h-2.5C11.5 2 10.5 4 10.5 6.5V9H8v3.5h2.5V22H14v-9.5h2.6L17 9h-3z"/></svg>',
}

# "~/" is the site root; rewritten per page depth.
BOYS_IMG = '<img src="~/images/logo-boys.png" alt="The HBC boys volleyball logo"'
GIRLS_IMG = '<img src="~/images/logo-girls.png" alt="The HBC girls volleyball logo"'
WAVES = '''<svg class="waves" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
<path d="M0 60c120-40 220-40 330 0s210 40 330 0 220-40 330 0 210 40 450-10"/>
<path d="M0 76c160-26 300-26 450 0s290 26 450 0 300-26 540 4" opacity=".55"/>
<path d="M60 42c90-28 170-28 250 0M760 40c90-26 180-26 270 0" opacity=".4"/>
</svg>'''
FIN = '<svg class="fin" viewBox="0 0 60 30" aria-hidden="true"><path d="M4 28C18 20 30 8 50 2c-6 8-8 16-6 26z" fill="#d9d9d9"/><path d="M0 28h60" stroke="#fb82ab" stroke-width="2"/></svg>'

WINGS = {
  "club":  {"label": "Club", "home": "~/index.html", "sub": "VOLLEYBALL CLUB", "favicon": "logo-boys-64.png",
            "nav": [("~/index.html","Home"),("~/about.html","About"),("~/clinics.html","Clinics"),("~/private-training.html","Private Training"),
                    ("~/summer-camp.html","Summer Camp"),("~/coaches.html","Coaches"),("~/calendar.html","Calendar")],
            "contact": "~/contact.html"},
  "boys":  {"label": "Boys", "home": "~/boys/index.html", "sub": "BOYS VOLLEYBALL", "favicon": "logo-boys-64.png",
            "nav": [("~/boys/index.html","Boys Home"),("~/boys/teams.html","Teams &amp; Tryouts"),("~/boys/calendar.html","Calendar"),("~/boys/coaches.html","Coaches"),
                    ("~/clinics.html","Clinics"),("~/private-training.html","Private Training")],
            "contact": "~/contact.html?program=boys"},
  "girls": {"label": "Girls", "home": "~/girls/index.html", "sub": "GIRLS VOLLEYBALL", "favicon": "logo-girls-64.png",
            "nav": [("~/girls/index.html","Girls Home"),("~/girls/teams.html","Teams &amp; Tryouts"),("~/girls/calendar.html","Calendar"),("~/girls/coaches.html","Coaches"),
                    ("~/clinics.html","Clinics"),("~/private-training.html","Private Training")],
            "contact": "~/contact.html?program=girls"},
}

def brand_logos(wing, size):
    b = f'<img src="~/images/logo-boys-64.png" alt="" width="{size}" height="{size}">'
    g = f'<img src="~/images/logo-girls-64.png" alt="" width="{size}" height="{size}">'
    return {"club": b + g, "boys": b, "girls": g}[wing]

def page(fname, wing, title, desc, body, head="", scripts=()):
    W = WINGS[wing]
    depth = fname.count("/")
    root = "../" * depth
    me = "~/" + fname
    LABELS = {"club": "Club Home", "boys": "Boys Club", "girls": "Girls Club"}
    extra_js = "".join(f'\n  <script src="~/js/{js}"></script>' for js in scripts)
    CUR, ON = ' aria-current="page"', ' class="on"'
    nav = "\n".join(
        f'          <li><a href="{h}"{CUR if h == me else ""}>{t}</a></li>' for h, t in W["nav"])
    wingbar = "".join(
        f'<a href="{WINGS[k]["home"]}"{ON if k == wing else ""}>{LABELS[k]}</a>'
        for k in ("club", "boys", "girls"))
    footer_logos = {"club": BOYS_IMG + ' width="72" height="72" loading="lazy">' + GIRLS_IMG + ' width="72" height="72" loading="lazy">',
                    "boys": BOYS_IMG + ' width="72" height="72" loading="lazy">',
                    "girls": GIRLS_IMG + ' width="72" height="72" loading="lazy">'}[wing]
    blurb = {"club": "A premier boys and girls volleyball club in Huntington Beach, CA, building winning attitudes, strong athletes and cohesive teams.",
             "boys": "HBC Boys: competitive boys club volleyball in Huntington Beach, CA.",
             "girls": "HBC Girls: competitive girls club volleyball in Huntington Beach, CA."}[wing]
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <link rel="icon" href="~/images/{W["favicon"]}" type="image/png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700&family=Pacifico&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="~/css/styles.css">{head}
</head>
<body class="theme-{wing}">
  <div class="wingbar">
    <div class="container"><span>The HBC</span>{wingbar}</div>
  </div>
  <header class="site-header">
    <div class="container nav">
      <a class="brand" href="{W["home"]}" aria-label="The HBC {W["label"]} home">
        <span class="brand-logos">{brand_logos(wing, 50)}</span>
        <span class="brand-text">The HBC<small>{W["sub"]}</small></span>
      </a>
      <button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
      <nav aria-label="Main">
        <ul class="nav-links" id="nav-links">
{nav}
          <li><a class="btn btn-primary" href="{W["contact"]}">Contact</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main>
{body}
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-logos">{footer_logos}</div>
          <p style="margin-top:14px">{blurb}</p>
          <div class="socials">
            <a href="https://www.instagram.com/thehbcvolleyballclub/" aria-label="Instagram" target="_blank" rel="noopener">{I["ig"]}</a>
            <a href="https://www.facebook.com/p/The-HBC-Volleyball-Club-100046407555345/" aria-label="Facebook" target="_blank" rel="noopener">{I["fb"]}</a>
          </div>
        </div>
        <div>
          <h4>Club Teams</h4>
          <ul>
            <li><a href="~/boys/index.html">Boys Club</a></li>
            <li><a href="~/boys/teams.html">Boys Teams &amp; Tryouts</a></li>
            <li><a href="~/girls/index.html">Girls Club</a></li>
            <li><a href="~/girls/teams.html">Girls Teams &amp; Tryouts</a></li>
          </ul>
        </div>
        <div>
          <h4>Training</h4>
          <ul>
            <li><a href="~/clinics.html">Weekly Clinics</a></li>
            <li><a href="~/private-training.html">Private Training</a></li>
            <li><a href="~/summer-camp.html">Summer Camp</a></li>
            <li><a href="~/coaches.html">Coaches</a></li>
            <li><a href="~/calendar.html">Club Calendar</a></li>
            <li><a href="~/about.html">About The HBC</a></li>
          </ul>
        </div>
        <div>
          <h4>Visit</h4>
          <ul>
            <li>7661 Windfield Drive<br>Huntington Beach, CA 92647</li>
            <li><a href="tel:+17143059309">(714) 305-9309</a></li>
            <li><a href="mailto:kimlucerohb@gmail.com">kimlucerohb@gmail.com</a></li>
            <li><a href="~/contact.html">Contact Us</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; <span data-year>2026</span> The HBC Volleyball Club. All rights reserved.</span>
        <span>Huntington Beach, California</span>
      </div>
    </div>
  </footer>
  <script src="~/js/main.js"></script>{extra_js}
</body>
</html>
'''
    html = html.replace("~/", root)
    path = os.path.join(OUT, fname)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w").write(html)

def hero(title, sub, eyebrow, mark):
    img = (BOYS_IMG if mark == "boys" else GIRLS_IMG) + ' class="hero-mark" width="170" height="170">'
    return f'''    <section class="page-hero">
      <div class="container">
        <div>
          <span class="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{sub}</p>
        </div>
        {img}
      </div>
      {WAVES}
    </section>'''

def cta(wing):
    head = {"club": 'Ready to join <span class="script">The HBC?</span>',
            "boys": 'Ready to join <span class="script">HBC Boys?</span>',
            "girls": 'Ready to join <span class="script">HBC Girls?</span>'}[wing]
    return f'''    <section class="section">
      <div class="container">
        <div class="cta reveal">
          <div>
            <h2>{head}</h2>
            <p>Questions or want to reserve a spot? Reach out to Kim. We'd love to hear from you.</p>
          </div>
          <div class="btn-row">
            <a class="btn btn-primary" href="{WINGS[wing]["contact"]}">Get in Touch</a>
            <a class="btn btn-outline" href="tel:+17143059309">Call (714) 305-9309</a>
          </div>
          {WAVES}
        </div>
      </div>
    </section>'''

LOCATION_INFO = '''<dl class="info">
          <div><dt>Location</dt><dd>7661 Windfield Drive<br>Huntington Beach, CA 92647</dd></div>
          <div><dt>Contact</dt><dd>Kim · (714) 305-9309</dd></div>
          <div><dt>Email</dt><dd><a href="mailto:kimlucerohb@gmail.com">kimlucerohb@gmail.com</a></dd></div>
        </dl>'''

MAP = '''<iframe class="map" title="Map to The HBC Volleyball Club" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=7661+Windfield+Dr,+Huntington+Beach,+CA+92647&output=embed"></iframe>'''

COACH_CREDS = f'''        <div class="grid grid-4">
          <div class="card reveal"><div class="icon">{I["trophy"]}</div><h3>Division 1</h3><p>College volleyball at the top level.</p></div>
          <div class="card reveal"><div class="icon">{I["ball"]}</div><h3>USA National Team</h3><p>International playing experience.</p></div>
          <div class="card reveal"><div class="icon">{I["trophy"]}</div><h3>CIF Championships</h3><p>Proven success in Southern California.</p></div>
          <div class="card reveal"><div class="icon">{I["heart"]}</div><h3>Olympic &amp; American Cup</h3><p>Victories on the world stage.</p></div>
        </div>'''

DIRECTOR = '''          <article class="card coach reveal">
            <div class="avatar">KL</div>
            <h3>Coach Lucero</h3>
            <div class="role">Club Director</div>
            <p>Has held head coaching positions at high school and college programs across Southern California.</p>
            <div class="badges"><span>Loyola HS</span><span>Marina HS</span><span>Vanguard College</span><span>Mater Dei HS</span></div>
          </article>'''

def placeholder_coach(prog):
    logo = "logo-boys-64.png" if prog == "boys" else "logo-girls-64.png"
    label = "Boys Program" if prog == "boys" else "Girls Program"
    return f'''          <article class="card coach reveal">
            <div class="avatar"><img src="~/images/{logo}" alt="" width="96" height="96"></div>
            <h3>Coach Name</h3>
            <div class="role">{label}</div>
            <p>Coach bio coming soon. Add playing and coaching background here.</p>
          </article>'''

TRAINING_CARDS = f'''          <article class="card reveal">
            <div class="icon">{I["clip"]}</div>
            <h3>Weekly Clinics</h3>
            <p>Beginner, intermediate and advanced courts in 4-week sessions. Start any time.</p>
            <a class="more" href="~/clinics.html">Clinic details</a>
          </article>
          <article class="card reveal">
            <div class="icon">{I["user"]}</div>
            <h3>Private Training</h3>
            <p>One-on-one and small group lessons tailored to each player's goals.</p>
            <a class="more" href="~/private-training.html">Book a lesson</a>
          </article>
          <article class="card reveal">
            <div class="icon">{I["sun"]}</div>
            <h3>Summer Camp</h3>
            <p>Fundamentals-first summer training for all ages and skill levels.</p>
            <a class="more" href="~/summer-camp.html">Camp info</a>
          </article>'''

# =====================================================================
# CLUB WING (general info, shared training programs)
# =====================================================================
page("index.html", "club", "The HBC Volleyball Club | Huntington Beach, CA",
 "The HBC is a premier boys and girls volleyball club in Huntington Beach, CA offering club teams, weekly clinics, summer camps and private training.",
f'''    <section class="hero">
      <div class="container">
        <div>
        <span class="eyebrow">Huntington Beach, California</span>
        <h1>Premier Boys &amp; Girls <span class="script">Volleyball</span></h1>
        <p>At The HBC we develop more than great players. We build winning attitudes, confident athletes and teams that play as one.</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="#wings">Find Your Program</a>
          <a class="btn btn-outline" href="clinics.html">Join a Clinic</a>
        </div>
        </div>
        <div class="hero-logos">
          {BOYS_IMG} class="boys" width="320" height="320">
          {GIRLS_IMG} class="girls" width="320" height="320">
        </div>
      </div>
      {WAVES}
      {FIN}
    </section>

    <div class="container">
      <div class="stats">
        <div class="stat"><strong>Boys &amp; Girls</strong><span>Competitive club teams</span></div>
        <div class="stat"><strong>3 Levels</strong><span>Beginner · Intermediate · Advanced</span></div>
        <div class="stat"><strong>All Ages</strong><span>Every skill level welcome</span></div>
        <div class="stat"><strong>Year-Round</strong><span>Clinics, camps &amp; lessons</span></div>
      </div>
    </div>

    <section class="section" id="wings">
      <div class="container">
        <div class="center reveal">
          <span class="eyebrow">One Club, Two Programs</span>
          <h2>Choose your club</h2>
          <p class="lead">HBC Boys and HBC Girls each have their own teams, tryouts and coaches, and they share one club and one set of values.</p>
        </div>
        <div class="wings" style="margin-top:40px">
          <a class="wing boys reveal" href="boys/index.html">
            {BOYS_IMG} width="160" height="160" loading="lazy">
            <div>
              <h3>HBC Boys</h3>
              <p>Competitive boys club teams from 14s through 18s.</p>
              <span class="go">Enter the Boys Club</span>
            </div>
          </a>
          <a class="wing girls reveal" href="girls/index.html">
            {GIRLS_IMG} width="160" height="160" loading="lazy">
            <div>
              <h3>HBC Girls</h3>
              <p>Competitive girls club teams built on skill, chemistry and heart.</p>
              <span class="go">Enter the Girls Club</span>
            </div>
          </a>
        </div>
      </div>
    </section>

    <section class="section alt">
      <div class="container">
        <div class="center reveal">
          <span class="eyebrow">Training For Everyone</span>
          <h2>Open to all players</h2>
          <p class="lead">You don't need to be on a club team to train with The HBC. Our clinics, lessons and camps are open to boys and girls of every age and skill level.</p>
        </div>
        <div class="grid grid-3" style="margin-top:40px">
{TRAINING_CARDS}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container split">
        <div class="reveal">
          <span class="eyebrow">Why The HBC</span>
          <h2>Winning attitudes. Cohesive teams.</h2>
          <p class="lead">The overarching aim of The HBC is to cultivate not only winning attitudes and athletes, but also cohesive teams.</p>
          <ul class="checklist">
            <li>Experienced coaches who have played and coached at the high school, college, club and national team levels</li>
            <li>Training grouped by ability so every player is challenged at the right level</li>
            <li>A strong emphasis on fundamentals, confidence and sportsmanship</li>
            <li>Programs for boys and girls of all ages and experience</li>
          </ul>
          <a class="btn btn-dark" href="about.html">About the Club</a>
        </div>
        <div class="visual duo reveal">{BOYS_IMG} width="300" height="300" loading="lazy">{GIRLS_IMG} width="300" height="300" loading="lazy">{WAVES}</div>
      </div>
    </section>

    <section class="section dark">
      <div class="container">
        <div class="center reveal">
          <span class="eyebrow">Our Coaches</span>
          <h2>Learn from players who've been there</h2>
          <p class="lead">Many of our coaches were top-ranked players before becoming high school, college and club coaches.</p>
        </div>
        <div style="margin-top:40px">
{COACH_CREDS}
        </div>
        <div class="center" style="margin-top:36px"><a class="btn btn-primary" href="coaches.html">Meet the Coaches</a></div>
      </div>
    </section>

    <section class="section">
      <div class="container split">
        <div class="reveal">
          <span class="eyebrow">Find Us</span>
          <h2>Train with us in Huntington Beach</h2>
          <p class="lead">Clinics and training are held at our Huntington Beach facility. Stop by, or reach out to reserve a spot.</p>
          <ul class="contact-list">
            <li><span class="icon">{I["pin"]}</span><div><strong>Address</strong>7661 Windfield Drive, Huntington Beach, CA 92647</div></li>
            <li><span class="icon">{I["phone"]}</span><div><strong>Phone</strong><a href="tel:+17143059309">(714) 305-9309</a></div></li>
            <li><span class="icon">{I["mail"]}</span><div><strong>Email</strong><a href="mailto:kimlucerohb@gmail.com">kimlucerohb@gmail.com</a></div></li>
          </ul>
        </div>
        <div class="reveal">
          {MAP}
        </div>
      </div>
    </section>

{cta("club")}''')

page("about.html", "club", "About | The HBC Volleyball Club",
 "Learn about The HBC Volleyball Club, a premier boys and girls volleyball club in Huntington Beach, CA.",
hero("About The HBC", "A premier boys and girls volleyball club rooted in Huntington Beach.", "Our Club", "boys") + f'''
    <section class="section">
      <div class="container split">
        <div class="reveal">
          <span class="eyebrow">Our Mission</span>
          <h2>More than volleyball</h2>
          <p class="lead">The overarching aim of The HBC is to cultivate not only winning attitudes and athletes, but also cohesive teams.</p>
          <p>We believe great volleyball starts with great fundamentals, and great teams start with players who trust each other. Our coaches push athletes to compete hard, and they also teach them to support their teammates, handle pressure and carry that confidence off the court.</p>
          <p>From beginners discovering the sport to experienced players preparing for high school and college volleyball, The HBC gives every athlete a place to grow.</p>
        </div>
        <div class="visual duo reveal">{BOYS_IMG} width="300" height="300" loading="lazy">{GIRLS_IMG} width="300" height="300" loading="lazy">{WAVES}</div>
      </div>
    </section>

    <section class="section alt">
      <div class="container">
        <div class="center reveal">
          <span class="eyebrow">Our Values</span>
          <h2>What we stand for</h2>
        </div>
        <div class="grid grid-3" style="margin-top:40px">
          <div class="card reveal"><div class="icon">{I["trophy"]}</div><h3>Winning Attitude</h3><p>We compete with effort, focus and a belief that every point matters.</p></div>
          <div class="card reveal"><div class="icon">{I["team"]}</div><h3>Cohesive Teams</h3><p>Chemistry, communication and trust turn talented players into a real team.</p></div>
          <div class="card reveal"><div class="icon">{I["ball"]}</div><h3>Fundamentals First</h3><p>Passing, setting, serving and footwork are the foundation of every level.</p></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="center reveal">
          <span class="eyebrow">Our Programs</span>
          <h2>Two clubs, one family</h2>
        </div>
        <div class="wings" style="margin-top:40px">
          <a class="wing boys reveal" href="boys/index.html">{BOYS_IMG} width="160" height="160" loading="lazy"><div><h3>HBC Boys</h3><p>Teams from 14s through 18s.</p><span class="go">Boys Club</span></div></a>
          <a class="wing girls reveal" href="girls/index.html">{GIRLS_IMG} width="160" height="160" loading="lazy"><div><h3>HBC Girls</h3><p>Competitive girls club teams.</p><span class="go">Girls Club</span></div></a>
        </div>
      </div>
    </section>
{cta("club")}''')

page("clinics.html", "club", "Weekly Clinics | The HBC Volleyball Club",
 "Weekly volleyball clinics in Huntington Beach with beginner, intermediate and advanced courts. 4-week sessions, start any time.",
hero("Weekly Volleyball Clinics", "Beginner, intermediate and advanced courts so every player trains at the level that's right for them. Open to boys and girls.", "Clinics", "girls") + f'''
    <section class="section">
      <div class="container">
        {LOCATION_INFO}
        <div class="split" style="margin-top:48px">
          <div class="reveal">
            <span class="eyebrow">How Clinics Work</span>
            <h2>4-week sessions. Start any time.</h2>
            <p class="lead">Our weekly clinics run in 4-week sessions, and players can jump in whenever they're ready. There's no need to wait for a new season.</p>
            <ul class="checklist">
              <li>Tuesdays &amp; Thursdays, 4:00 – 5:30 PM</li>
              <li>Players are grouped by skill level</li>
              <li>Experienced coaches on every court</li>
              <li>Open to boys and girls, club players or not</li>
            </ul>
            <p class="notice">Clinic days and times can change by season, so please confirm the current schedule with Kim before your first session.</p>
          </div>
          <div class="visual duo reveal">{BOYS_IMG} width="300" height="300" loading="lazy">{GIRLS_IMG} width="300" height="300" loading="lazy">{WAVES}</div>
        </div>
      </div>
    </section>

    <section class="section alt">
      <div class="container">
        <div class="center reveal">
          <span class="eyebrow">Choose Your Court</span>
          <h2>Three levels of training</h2>
          <p class="lead">Our experienced coaches help players learn the basics, build confidence, strengthen fundamentals and fine-tune their skills.</p>
        </div>
        <div class="grid grid-3" style="margin-top:40px">
          <div class="card level reveal"><span class="tag">Level 1</span><h3>Beginner</h3><p>Learn the basics of passing, setting, serving and hitting in a fun, encouraging setting. Perfect for new players.</p></div>
          <div class="card level l2 reveal"><span class="tag soft">Level 2</span><h3>Intermediate</h3><p>Build confidence and strengthen fundamentals with more reps, game situations and team play.</p></div>
          <div class="card level l3 reveal"><span class="tag pink">Level 3</span><h3>Advanced</h3><p>Fine-tune skills, sharpen technique and train at a higher tempo to prepare for club and high school play.</p></div>
        </div>
      </div>
    </section>
{cta("club")}''')

page("summer-camp.html", "club", "Summer Camp | The HBC Volleyball Club",
 "The HBC summer volleyball camp in Huntington Beach. Fundamental skill development for kids of all ages and skill levels.",
hero("Summer Volleyball Camp", "Take your game to the next level this summer. Open to boys and girls.", "Summer Camp", "girls") + f'''
    <section class="section">
      <div class="container split">
        <div class="reveal">
          <span class="eyebrow">Summer at The HBC</span>
          <h2>All ages. All skill levels.</h2>
          <p class="lead">Our coaches focus on fundamental skill development, giving every camper the tools to play with confidence.</p>
          <ul class="checklist">
            <li>All kids of all ages and skill levels are welcome</li>
            <li>Fundamentals-first coaching from experienced staff</li>
            <li>Drills, games and competition in a fun, positive environment</li>
            <li>A great way to prepare for club tryouts or the school season</li>
          </ul>
          <div class="btn-row">
            <a class="btn btn-dark" href="contact.html">Reserve a Spot</a>
            <a class="btn btn-dark" href="tel:+17143059309">(714) 305-9309</a>
          </div>
        </div>
        <div class="visual duo reveal">{BOYS_IMG} width="300" height="300" loading="lazy">{GIRLS_IMG} width="300" height="300" loading="lazy">{WAVES}</div>
      </div>
    </section>

    <section class="section alt">
      <div class="container">
        {LOCATION_INFO}
        <p class="notice reveal" style="margin-top:20px">Camp dates are announced each spring. To reserve a spot, contact Kim at <a href="mailto:kimlucerohb@gmail.com">kimlucerohb@gmail.com</a> or <a href="tel:+17143059309">(714) 305-9309</a>.</p>
      </div>
    </section>
{cta("club")}''')

page("private-training.html", "club", "Private Training | The HBC Volleyball Club",
 "Private and small group volleyball lessons with experienced HBC coaches in Huntington Beach.",
hero("Private Training", "Private and small group lessons with experienced HBC coaches, for boys and girls.", "One-on-One", "boys") + f'''
    <section class="section">
      <div class="container">
        <div class="grid grid-2">
          <article class="card reveal">
            <div class="icon">{I["user"]}</div>
            <h3>Private Lessons</h3>
            <p>One-on-one sessions focused entirely on your player's goals, whether that's a new serve, cleaner passing, better approach footwork or position-specific skills.</p>
          </article>
          <article class="card reveal">
            <div class="icon">{I["team"]}</div>
            <h3>Small Group Lessons</h3>
            <p>Train with a few friends or teammates. You get focused coaching plus the energy and reps of working with a group.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section alt">
      <div class="container">
        <div class="center reveal">
          <span class="eyebrow">Booking</span>
          <h2>How to book a lesson</h2>
        </div>
        <div class="grid grid-3 steps" style="margin-top:40px">
          <div class="card step reveal"><h3>Choose a Coach</h3><p>Browse our <a href="coaches.html">coaching staff</a> to find the right fit for your player's position and goals.</p></div>
          <div class="card step reveal"><h3>Reach Out</h3><p>Contact the coach by email, or contact the club and we'll connect you.</p></div>
          <div class="card step reveal"><h3>Schedule &amp; Train</h3><p>Pick a time that works and get to work. Lessons are held in Huntington Beach.</p></div>
        </div>
      </div>
    </section>
{cta("club")}''')

page("coaches.html", "club", "Coaches | The HBC Volleyball Club",
 "Meet the coaching staff of The HBC Volleyball Club: former top-ranked players with Division 1, USA National Team, CIF and Olympic experience.",
hero("Our Coaches", "Many of our coaches were top-ranked players before becoming high school, college and club coaches.", "Coaching Staff", "boys") + f'''
    <section class="section">
      <div class="container">
{COACH_CREDS}
      </div>
    </section>

    <section class="section alt">
      <div class="container">
        <div class="center reveal">
          <span class="eyebrow">Meet the Staff</span>
          <h2>Club leadership</h2>
        </div>
        <div class="grid grid-3" style="margin-top:40px">
{DIRECTOR}
{placeholder_coach("boys")}
{placeholder_coach("girls")}
        </div>
        <div class="btn-row" style="justify-content:center;margin-top:36px">
          <a class="btn btn-dark" href="boys/coaches.html">Boys Coaches</a>
          <a class="btn btn-dark" href="girls/coaches.html">Girls Coaches</a>
        </div>
      </div>
    </section>
{cta("club")}''')

page("contact.html", "club", "Contact | The HBC Volleyball Club",
 "Contact The HBC Volleyball Club in Huntington Beach, CA. Call (714) 305-9309 or email kimlucerohb@gmail.com.",
hero("Contact Us", "Questions about the boys or girls club, clinics, camps or lessons? Reach out and we'll get back to you.", "Get in Touch", "boys") + f'''
    <section class="section">
      <div class="container split" style="align-items:start">
        <div class="reveal">
          <h2>Talk to Kim</h2>
          <p class="lead">For questions or to reserve a spot, contact Kim directly.</p>
          <ul class="contact-list" style="margin-bottom:28px">
            <li><span class="icon">{I["phone"]}</span><div><strong>Phone</strong><a href="tel:+17143059309">(714) 305-9309</a></div></li>
            <li><span class="icon">{I["mail"]}</span><div><strong>Email</strong><a href="mailto:kimlucerohb@gmail.com">kimlucerohb@gmail.com</a></div></li>
            <li><span class="icon">{I["pin"]}</span><div><strong>Facility</strong>7661 Windfield Drive, Huntington Beach, CA 92647</div></li>
            <li><span class="icon">{I["ig"]}</span><div><strong>Instagram</strong><a href="https://www.instagram.com/thehbcvolleyballclub/" target="_blank" rel="noopener">@thehbcvolleyballclub</a></div></li>
          </ul>
          {MAP}
        </div>
        <div class="card reveal">
          <h3>Send a message</h3>
          <p>This opens your email app with the message ready to send.</p>
          <form id="contact-form">
            <label>Parent / player name<input name="name" required autocomplete="name"></label>
            <div class="form-row">
              <label>Email<input type="email" name="email" required autocomplete="email"></label>
              <label>Phone<input type="tel" name="phone" autocomplete="tel"></label>
            </div>
            <div class="form-row">
              <label>Program
                <select name="program">
                  <option value="Boys">HBC Boys</option>
                  <option value="Girls">HBC Girls</option>
                  <option value="Both / not sure" selected>Both / not sure</option>
                </select>
              </label>
              <label>Player age<input name="age" inputmode="numeric"></label>
            </div>
            <label>Interested in
              <select name="interest">
                <option>Club Teams / Tryouts</option>
                <option>Weekly Clinics</option>
                <option>Summer Camp</option>
                <option>Private Training</option>
                <option>Something else</option>
              </select>
            </label>
            <label>Message<textarea name="message" rows="5" required></textarea></label>
            <button class="btn btn-primary" type="submit">Send Message</button>
          </form>
        </div>
      </div>
    </section>''')

# Old URL: forward to the club home's program chooser
open(os.path.join(OUT, "teams.html"), "w").write('''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Club Teams | The HBC Volleyball Club</title>
  <meta http-equiv="refresh" content="0; url=index.html#wings">
  <link rel="canonical" href="index.html#wings">
</head>
<body>
  <p>Club teams now have their own pages: <a href="boys/teams.html">HBC Boys</a> · <a href="girls/teams.html">HBC Girls</a></p>
</body>
</html>
''')

# =====================================================================
# BOYS & GIRLS WINGS
# =====================================================================
def wing_pages(w):
    boys = w == "boys"
    IMG = BOYS_IMG if boys else GIRLS_IMG
    Name = "HBC Boys" if boys else "HBC Girls"
    word = "Boys" if boys else "Girls"
    lower = word.lower()
    visual = "silver" if boys else "pink"
    fin = "" if boys else FIN
    intro = ("Competitive boys club volleyball in Huntington Beach, with age-group teams from 14s through 18s."
             if boys else
             "Competitive girls club volleyball in Huntington Beach, built on skill, chemistry and heart.")
    stats = (f'''        <div class="stat"><strong>14s–18s</strong><span>Age-group teams</span></div>
        <div class="stat"><strong>Club Season</strong><span>Tryouts each season</span></div>''' if boys else
             f'''        <div class="stat"><strong>All Levels</strong><span>Age-division teams</span></div>
        <div class="stat"><strong>Club Season</strong><span>Tryouts each season</span></div>''')
    teams = ('''          <article class="card level reveal"><span class="tag">14s / 15s</span><h3>Younger Division</h3><p>Players build strong fundamentals, learn the speed of club volleyball and grow into their positions.</p></article>
          <article class="card level l3 reveal"><span class="tag pink">16s / 17s / 18s</span><h3>Older Division</h3><p>High-level training and competition for players preparing for high school varsity and college volleyball.</p></article>'''
             if boys else
             '''          <article class="card level reveal"><span class="tag">Younger Divisions</span><h3>Build the Foundation</h3><p>Players develop fundamentals, confidence and a love for the game while learning to compete as a team.</p></article>
          <article class="card level l3 reveal"><span class="tag pink">Older Divisions</span><h3>Compete &amp; Grow</h3><p>Higher-level training and tournament play for players preparing for high school and college volleyball.</p></article>''')

    # ---- wing home ----
    page(f"{lower}/index.html", w, f"{Name} | The HBC Volleyball Club",
     f"{Name}: {intro}",
f'''    <section class="hero">
      <div class="container">
        <div>
        <span class="eyebrow">The HBC · Huntington Beach</span>
        <h1>HBC <span class="script">{word}</span></h1>
        <p>{intro}</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="teams.html">Teams &amp; Tryouts</a>
          <a class="btn btn-outline" href="../contact.html?program={lower}">Contact Us</a>
        </div>
        </div>
        <div class="hero-logos solo">
          {IMG} class="{lower}" width="360" height="360">
        </div>
      </div>
      {WAVES}
      {fin}
    </section>

    <div class="container">
      <div class="stats">
{stats}
        <div class="stat"><strong>Year-Round</strong><span>Clinics &amp; private training</span></div>
        <div class="stat"><strong>Huntington Beach</strong><span>7661 Windfield Dr</span></div>
      </div>
    </div>

    <section class="section">
      <div class="container split">
        <div class="reveal">
          <span class="eyebrow">The {word} Program</span>
          <h2>Built to compete. Built as a team.</h2>
          <p class="lead">{Name} carries the club's core goal: cultivate winning attitudes, strong athletes and cohesive teams.</p>
          <ul class="checklist">
            <li>Coaches with Division 1, USA National Team and CIF championship experience</li>
            <li>A fundamentals-first approach at every age</li>
            <li>Team chemistry, communication and competitive drive</li>
            <li>Extra development through HBC clinics and private lessons</li>
          </ul>
          <a class="btn btn-dark" href="teams.html">See Teams &amp; Tryouts</a>
        </div>
        <div class="visual {visual} reveal">{IMG} width="300" height="300" loading="lazy">{WAVES}</div>
      </div>
    </section>

    <section class="section alt">
      <div class="container">
        <div class="center reveal">
          <span class="eyebrow">Our Teams</span>
          <h2>{word} club teams</h2>
          <p class="lead">Teams are formed at tryouts each season by age group.</p>
        </div>
        <div class="grid grid-2" style="margin-top:40px">
{teams}
        </div>
      </div>
    </section>

    <section class="section dark">
      <div class="container">
        <div class="center reveal">
          <span class="eyebrow">Train Year-Round</span>
          <h2>Get better between seasons</h2>
          <p class="lead">{Name} players can keep developing through the club's clinics, private lessons and summer camp.</p>
        </div>
        <div class="grid grid-3" style="margin-top:40px">
{TRAINING_CARDS}
        </div>
      </div>
    </section>
{cta(w)}''')

    # ---- wing teams & tryouts ----
    commit = ("Players who receive an offer complete the boys commitment form to secure a roster spot for the season."
              if boys else "Players who receive an offer complete the commitment form to secure a roster spot for the season.")
    page(f"{lower}/teams.html", w, f"{Name} Teams & Tryouts | The HBC Volleyball Club",
     f"{Name} club teams and tryout information. The HBC Volleyball Club, Huntington Beach, CA.",
    hero(f'{word} Teams &amp; <span class="script">Tryouts</span>', f"Everything you need to know about joining an {Name} club team.", Name, lower) + f'''
    <section class="section">
      <div class="container">
        <div class="center reveal">
          <span class="eyebrow">Age Groups</span>
          <h2>Find your team</h2>
        </div>
        <div class="grid grid-2" style="margin-top:40px">
{teams}
        </div>
      </div>
    </section>

    <section class="section alt">
      <div class="container">
        <div class="center reveal">
          <span class="eyebrow">How It Works</span>
          <h2>The tryout process</h2>
          <p class="lead">Tryout dates and times are announced each season by age group. Make-up sessions are usually offered for players who can't attend their scheduled date.</p>
        </div>
        <div class="grid grid-3 steps" style="margin-top:40px">
          <div class="card step reveal"><h3>Register</h3><p>Contact the club to get the current tryout schedule for your age group and register your player.</p></div>
          <div class="card step reveal"><h3>Try Out</h3><p>Come ready to compete. Coaches evaluate skills, athleticism, attitude and how players work with others.</p></div>
          <div class="card step reveal"><h3>Commit</h3><p>{commit}</p></div>
        </div>
        <p class="notice reveal" style="margin-top:28px"><strong>{word} tryout schedule:</strong> dates for the upcoming season will be posted here. For the latest information, call Kim at <a href="tel:+17143059309">(714) 305-9309</a> or email <a href="mailto:kimlucerohb@gmail.com">kimlucerohb@gmail.com</a>.</p>
      </div>
    </section>

    <section class="section">
      <div class="container split">
        <div class="reveal">
          <span class="eyebrow">Get Ready</span>
          <h2>Prepare for tryouts</h2>
          <p class="lead">The best way to get ready is to get touches on the ball.</p>
          <ul class="checklist">
            <li>Join a <a href="../clinics.html">weekly clinic</a> at your skill level</li>
            <li>Work on specific skills with <a href="../private-training.html">private training</a></li>
            <li>Arrive early, bring water and knee pads, and compete on every rep</li>
          </ul>
        </div>
        <div class="visual {visual} reveal">{IMG} width="300" height="300" loading="lazy">{WAVES}</div>
      </div>
    </section>
{cta(w)}''')

    # ---- wing coaches ----
    page(f"{lower}/coaches.html", w, f"{Name} Coaches | The HBC Volleyball Club",
     f"Meet the {Name} coaching staff at The HBC Volleyball Club.",
    hero(f'{word} <span class="script">Coaches</span>', f"The coaching staff behind {Name}.", "Coaching Staff", lower) + f'''
    <section class="section">
      <div class="container">
{COACH_CREDS}
      </div>
    </section>

    <section class="section alt">
      <div class="container">
        <div class="center reveal">
          <span class="eyebrow">Meet the Staff</span>
          <h2>{Name} staff</h2>
        </div>
        <div class="grid grid-3" style="margin-top:40px">
{DIRECTOR}
{placeholder_coach(lower)}
{placeholder_coach(lower)}
        </div>
        <p class="center" style="margin-top:28px">Looking for a private lesson? <a href="../private-training.html">See private training</a>.</p>
      </div>
    </section>
{cta(w)}''')

wing_pages("boys")
wing_pages("girls")

# =====================================================================
# CALENDAR (public) + ADMIN
# =====================================================================
def calendar_body(program):
    filters = "" if program else """
          <div class="cal-seg" role="group" aria-label="Show program">
            <button type="button" data-filter="everything" aria-pressed="true">Everything</button>
            <button type="button" data-filter="boys">Boys</button>
            <button type="button" data-filter="girls">Girls</button>
          </div>"""
    legend = "" if program else """
        <ul class="cal-legend">
          <li><span class="cal-dot p-all"></span>Whole club</li>
          <li><span class="cal-dot p-boys"></span>HBC Boys</li>
          <li><span class="cal-dot p-girls"></span>HBC Girls</li>
        </ul>"""
    note = {"": "Showing events for the whole club. Use the buttons to show only the boys or girls schedule.",
            "boys": "Showing HBC Boys events plus whole-club events like clinics.",
            "girls": "Showing HBC Girls events plus whole-club events like clinics."}[program]
    return f"""    <section class="section">
      <div class="container">
        <div class="calendar" id="hbc-calendar" data-base="~/" data-program="{program}">
          <div class="cal-toolbar">
            <div class="cal-nav">
              <button type="button" class="cal-btn" data-nav="prev" aria-label="Previous month">&#8249;</button>
              <h2 class="cal-title" aria-live="polite">Calendar</h2>
              <button type="button" class="cal-btn" data-nav="next" aria-label="Next month">&#8250;</button>
              <button type="button" class="cal-btn cal-today" data-nav="today">Today</button>
            </div>
            <div class="cal-controls">{filters}
              <div class="cal-seg" role="group" aria-label="View">
                <button type="button" data-view="month" aria-pressed="true">Month</button>
                <button type="button" data-view="list">List</button>
              </div>
            </div>
          </div>
          <p class="cal-note">{note} Click any event for time, location and details.</p>
          <div class="cal-body"><p class="cal-empty">Loading calendar…</p></div>{legend}
        </div>
      </div>
    </section>
    <dialog id="cal-dialog" class="cal-dialog">
      <button type="button" class="cal-close" aria-label="Close">&times;</button>
      <div class="cal-d-body"></div>
    </dialog>
"""

page("calendar.html", "club", "Calendar | The HBC Volleyball Club",
 "Practices, tournaments, tryouts, clinics and club events for The HBC Volleyball Club in Huntington Beach.",
 hero('Club <span class="script">Calendar</span>', "Practices, tournaments, tryouts, clinics and club events for the whole season.", "Schedule", "boys")
 + calendar_body("") + cta("club"), scripts=("events.js", "calendar.js"))

for w in ("boys", "girls"):
    Name = "HBC Boys" if w == "boys" else "HBC Girls"
    word = w.capitalize()
    page(f"{w}/calendar.html", w, f"{Name} Calendar | The HBC Volleyball Club",
     f"{Name} practices, tournaments and tryouts.",
     hero(f'{word} <span class="script">Calendar</span>', f"{Name} practices, tournaments, tryouts and club events.", Name, w)
     + calendar_body(w) + cta(w), scripts=("events.js", "calendar.js"))

page("admin/index.html", "club", "Calendar Admin | The HBC Volleyball Club",
 "Calendar editor for The HBC staff.",
 """    <section class="page-hero adm-hero">
      <div class="container">
        <div>
          <span class="eyebrow">Staff Only</span>
          <h1>Calendar Admin</h1>
          <p>Add, edit and remove events on the club, boys and girls calendars.</p>
        </div>
      </div>
    </section>

    <section class="section adm">
      <div class="container">
        <div class="card adm-connect" id="adm-connect-card">
          <div class="adm-connect-main">
            <h3>1. Connect</h3>
            <p>Paste your GitHub access key to edit the live calendar. <a href="#adm-help">How do I get a key?</a></p>
            <div class="adm-row">
              <input id="adm-token" type="password" placeholder="github_pat_…" autocomplete="off" spellcheck="false" aria-label="GitHub access key">
              <button class="btn btn-dark" id="adm-connect" type="button">Connect</button>
            </div>
            <label class="adm-check"><input type="checkbox" id="adm-remember"> Remember this key on this device (only use on your own computer or phone)</label>
            <div class="adm-connected-bar">
              <span>Connected to GitHub.</span>
              <button class="adm-link" id="adm-reload" type="button">Reload</button>
              <button class="adm-link" id="adm-signout" type="button">Sign out</button>
            </div>
          </div>
          <details class="adm-settings">
            <summary>Advanced settings</summary>
            <div class="adm-grid">
              <label>GitHub owner<input id="s-owner"></label>
              <label>Repository<input id="s-repo"></label>
              <label>Branch<input id="s-branch"></label>
              <label>Calendar file<input id="s-path"></label>
            </div>
            <button class="btn btn-dark" id="adm-settings-save" type="button">Save settings</button>
          </details>
          <p id="adm-status" class="adm-status" role="status"></p>
        </div>

        <div id="adm-editor" hidden>
          <div class="adm-toolbar">
            <h3>2. Edit events</h3>
            <div class="adm-row wrap">
              <button class="btn btn-dark" id="adm-add" type="button">+ Add event</button>
              <input id="adm-search" type="search" placeholder="Search title, location, notes" aria-label="Search events">
              <select id="adm-filter" aria-label="Filter by program">
                <option value="any">All programs</option>
                <option value="all">Whole club</option>
                <option value="boys">HBC Boys</option>
                <option value="girls">HBC Girls</option>
              </select>
              <label class="adm-check"><input type="checkbox" id="adm-past"> Show past events</label>
            </div>
          </div>
          <div class="adm-table-wrap">
            <table class="adm-table">
              <thead><tr><th>Date</th><th>Event &amp; location</th><th>Time</th><th>Program</th><th>Type</th><th></th></tr></thead>
              <tbody id="adm-rows"></tbody>
            </table>
          </div>
          <p class="adm-count" id="adm-count"></p>

          <details class="card adm-import">
            <summary><strong>Add a whole season from a spreadsheet</strong></summary>
            <p>Build your schedule in Excel or Google Sheets using the template columns, select the cells (including the header row), copy, and paste below.
               For weekly practices, fill in <code>repeat_until</code> with the last date and the event will repeat every week on the same weekday.</p>
            <p><button class="adm-link" id="adm-csv-template" type="button">Download the spreadsheet template (.csv)</button></p>
            <textarea id="adm-csv" rows="7" placeholder="date,end_date,start,end,title,program,type,location,notes,repeat_until"></textarea>
            <div class="adm-row"><button class="btn btn-dark" id="adm-csv-import" type="button">Add these events</button></div>
            <p id="adm-csv-result" class="adm-status" role="status"></p>
          </details>

          <div class="adm-publish-bar">
            <div>
              <h3>3. Publish</h3>
              <p><span id="adm-unsaved" class="adm-unsaved" hidden>You have unpublished changes.</span> Changes aren't visible to the public until you publish.</p>
            </div>
            <div class="adm-row wrap">
              <button class="adm-link" id="adm-backup" type="button">Download backup</button>
              <a class="adm-link" href="../calendar.html" target="_blank" rel="noopener">View public calendar</a>
              <button class="btn btn-primary" id="adm-publish" type="button" disabled>Publish to website</button>
            </div>
          </div>
        </div>

        <div class="card adm-help" id="adm-help">
          <h3>Getting your access key (one time)</h3>
          <ol>
            <li>Sign in to GitHub as <strong>rparker-sudo</strong> and open <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens/new</a>.</li>
            <li>Name it <em>HBC Calendar</em> and pick an expiration (for example, 1 year).</li>
            <li>Under <strong>Repository access</strong>, choose <strong>Only select repositories</strong> and pick <strong>The-HBC</strong>.</li>
            <li>Under <strong>Permissions → Repository permissions</strong>, set <strong>Contents</strong> to <strong>Read and write</strong>.</li>
            <li>Click <strong>Generate token</strong>, copy it (it starts with <code>github_pat_</code>) and paste it above.</li>
          </ol>
          <p>Treat the key like a password: it can change the website's files. Anyone else who helps with the schedule can make their own key the same way from an account with access to the repository.</p>
        </div>
      </div>
    </section>

    <dialog id="adm-dialog" class="cal-dialog adm-dialog">
      <form id="adm-form" novalidate>
        <h3 id="adm-dialog-title">Add event</h3>
        <label>Title<input name="title" required placeholder="16s Practice, Fall Classic, Tryouts…"></label>
        <div class="form-row">
          <label>Program<select name="program"></select></label>
          <label>Type<select name="type"></select></label>
        </div>
        <label>Location<input name="location" list="f-locations" placeholder="Gym, address or venue"></label>
        <datalist id="f-locations"></datalist>
        <div class="form-row">
          <label>Date<input name="date" type="date" required></label>
          <label>End date <small>(multi-day events)</small><input name="endDate" type="date"></label>
        </div>
        <label class="adm-check"><input type="checkbox" name="allDay"> All day (no set time)</label>
        <div class="form-row" id="f-times">
          <label>Start time<input name="start" type="time"></label>
          <label>End time<input name="end" type="time"></label>
        </div>
        <label class="adm-check"><input type="checkbox" name="repeat"> Repeats every week</label>
        <div id="f-repeat-opts">
          <div class="form-row">
            <label>Repeat until<input name="until" type="date"></label>
            <label>Skip these dates <small>(holidays)</small><input name="skip" placeholder="2026-11-26, 2026-12-24"></label>
          </div>
        </div>
        <label>Notes <small>(optional)</small><textarea name="notes" rows="3" placeholder="What to bring, check-in time, uniform…"></textarea></label>
        <p id="f-error" class="adm-status err" role="alert"></p>
        <div class="adm-row">
          <button class="btn btn-dark" type="submit">Save event</button>
          <button class="adm-link" type="button" id="f-cancel">Cancel</button>
        </div>
      </form>
    </dialog>
""", head='\n  <meta name="robots" content="noindex, nofollow">', scripts=("events.js", "admin.js"))

print("ok")
