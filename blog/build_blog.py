#!/usr/bin/env python3
"""
Static blog generator for Machshev Labs.

Reads the numbered markdown files in this folder, renders each to a
self-contained HTML page using the site's existing design system, and
writes a blog index page (../blog.html). No server, no database, no
runtime dependency — the output is plain static HTML that a visitor's
browser renders with zero JavaScript involvement beyond the site's
existing assets/js/main.js (nav, scroll-reveal, active-TOC highlight).

Requires, at generation time only (never shipped to visitors):
    pip install markdown latex2mathml

Run from the repo root or from this folder:
    python blog/build_blog.py

Regenerate whenever a blog/*.md file changes. The generator is
intentionally simple and content-specific (see README.md's Blog
section for the constraints it assumes about the source markdown).
"""

import html
import os
import re
import sys

import markdown
import latex2mathml.converter as l2m

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG_DIR = os.path.join(ROOT, "blog")

# Two series, each with its own reading order, numbering ("Reference 01
# of N"), and prev/next pager — a reader moving through the RF series
# never gets bounced into the tooling notes as a "next" post, and vice
# versa. The tag is the one-word topic label shown on cards and in the
# post meta line. Derived from the filenames' own numeric prefixes.
SERIES = [
    {
        "key": "rf",
        "label": "RF PCB Design",
        "intro": (
            "A reference series for engineers laying out boards above a few hundred "
            "megahertz: the physics, the formulas in spreadsheet-ready form, and the "
            "layout rules that actually follow from them."
        ),
        "posts": [
            ("1_rf_fundamentals.md", "Fundamentals"),
            ("2_rf_transmission_lines.md", "Transmission Lines"),
            ("3_rf_stubs.md", "Stubs"),
            ("4_rf_power_dividers.md", "Power Dividers"),
            ("5_rf_coupler.md", "Couplers"),
            ("6_rf_filter.md", "Filters"),
        ],
    },
    {
        "key": "notes",
        "label": "CEM Tooling & Industry Notes",
        "intro": (
            "Field notes on the open-source computational electromagnetics stack — "
            "solvers, meshing, visualization, HPC — and on why the commercial side of "
            "this market is priced the way it is."
        ),
        "posts": [
            ("7_open_source_fea_software.md", "FEA Tools"),
            ("8_open_source_mesh_generation.md", "Meshing"),
            ("9_scientific_3d_visualization.md", "Visualization"),
            ("10_open_source_electromagnetics.md", "FDTD/FEM/MoM"),
            ("11_hpc_on_the_cloud.md", "Cloud HPC"),
            ("12_em_software_market_gap.md", "Market"),
            ("13_hfss_cst_feko_comparison.md", "Commercial EM"),
            ("14_fem_electromagnetics_in_python.md", "Python Workflows"),
            ("15_palace_hfss_alternative.md", "Palace"),
            ("16_em_simulation_product_lifecycle.md", "Product Lifecycle"),
        ],
    },
]

WORDS_PER_MINUTE = 220


# --------------------------------------------------------------- math --

# Matches $$...$$, \[...\], and \(...\) spans, in that priority order,
# tagging each with whether it's display or inline math. These are the
# only three math delimiter styles used across the source files.
MATH_PATTERN = re.compile(
    r"\$\$(?P<a>.+?)\$\$"
    r"|\\\[(?P<b>.+?)\\\]"
    r"|\\\((?P<c>.+?)\\\)",
    re.S,
)


def protect_math(text):
    """Replace every math span with an inert placeholder token, and
    return (protected_text, {token: rendered_mathml_html})."""
    tokens = {}
    counter = [0]

    def sub(m):
        counter[0] += 1
        token = "ZZMATHTOKENZZ%dZZ" % counter[0]
        if m.group("a") is not None:
            latex, display = m.group("a"), "block"
        elif m.group("b") is not None:
            latex, display = m.group("b"), "block"
        else:
            latex, display = m.group("c"), "inline"
        mathml = l2m.convert(latex.strip(), display=display)
        tokens[token] = mathml
        return token

    return MATH_PATTERN.sub(sub, text), tokens


def restore_math(html_text, tokens):
    for token, mathml in tokens.items():
        html_text = html_text.replace(token, mathml)
    return html_text


# ------------------------------------------------------------- parsing --

def split_title_and_body(text):
    """Pull the title off the top of the document. Files 1-4 use a
    Markdown H1 (# Title); files 5-6 use a single bold line (**Title**)
    with no H1 at all. Returns (title, remaining_body_text)."""
    lines = text.splitlines()
    idx = 0
    while idx < len(lines) and not lines[idx].strip():
        idx += 1
    first = lines[idx].strip()

    if first.startswith("# "):
        title = first[2:].strip()
    elif first.startswith("**") and first.endswith("**") and len(first) > 4:
        title = first[2:-2].strip()
    else:
        raise ValueError("Unrecognized title line: %r" % first)

    rest = "\n".join(lines[idx + 1:])
    return title, rest


def split_excerpt_and_body(text):
    """Pull the first paragraph off the top of the (title-stripped) body
    to use as the dek/excerpt, and return (excerpt_markdown, remaining)."""
    text = text.lstrip("\n")
    parts = text.split("\n\n", 1)
    excerpt = parts[0].strip()
    remaining = parts[1] if len(parts) > 1 else ""
    return excerpt, remaining


def render_inline_markdown(text):
    """Render a single short markdown paragraph (the excerpt) to inline
    HTML, stripping the wrapping <p> tag. Protects any math the same way
    the body does, so a lede like file 6's renders real MathML instead
    of leaking raw LaTeX source."""
    protected, tokens = protect_math(text)
    out = markdown.markdown(protected)
    if out.startswith("<p>") and out.endswith("</p>"):
        out = out[3:-4]
    return restore_math(out, tokens)


def plain_text(text):
    """Collapse a markdown paragraph to plain text for <meta description>
    and card teasers. Math spans are dropped rather than rendered — a
    plain-text context can't show MathML, and the sentence reads fine
    without the symbol (confirmed by hand for every excerpt in this
    corpus that contains one)."""
    out = MATH_PATTERN.sub("", text)
    out = re.sub(r"[*_`]", "", out)
    out = re.sub(r"\s+([,.;:])", r"\1", out)  # drop-induced space before punctuation
    out = re.sub(r"\s+", " ", out).strip()
    return out


def build_toc(toc_tokens):
    """toc_tokens is markdown's toc extension output: a list of
    {level, id, name, children}. Use only the shallowest heading level
    actually present, so a doc using only ### still gets a flat list."""
    if not toc_tokens:
        return []
    top = min(t["level"] for t in toc_tokens)
    return [t for t in toc_tokens if t["level"] == top]


def word_count(html_text):
    text = re.sub(r"<[^>]+>", " ", html_text)
    return len(text.split())


# -------------------------------------------------------------- render --

def render_post_body(body_markdown):
    protected, tokens = protect_math(body_markdown)
    md = markdown.Markdown(extensions=["tables", "toc", "sane_lists", "fenced_code"])
    body_html = md.convert(protected)
    body_html = restore_math(body_html, tokens)
    # python-markdown's table extension emits a bare <table>; wrap it to
    # match the site's existing scrollable table treatment.
    body_html = body_html.replace("<table>", '<div class="table-wrap">\n<table>')
    body_html = body_html.replace("</table>", "</table>\n</div>")
    toc = build_toc(md.toc_tokens)
    return body_html, toc


NAV_LINKS = (
    '<li><a href="{p}services.html">Services</a></li>\n'
    '        <li><a href="{p}services.html#pricing">Pricing</a></li>\n'
    '        <li><a href="{p}resources.html">Free tools</a></li>\n'
    '        <li><a href="{p}blog.html"{blog_current}>Blog</a></li>\n'
    '        <li><a href="{p}about.html">About</a></li>'
)

HEADER = """<header class="site-header">
  <div class="wrap">
    <nav class="nav" aria-label="Primary">
      <a class="brand" href="{p}index.html">
        <img src="{p}images/logo-icon.png" alt="Machshev Labs" class="brand__mark" width="33" height="28">
        Machshev Labs<span class="brand__sub">EMI · SI/PI · FCC</span>
      </a>
      <button class="nav__toggle" type="button" aria-expanded="false" aria-label="Toggle navigation"><span></span></button>
      <ul class="nav__links">
        {nav_links}
      </ul>
      <div class="nav__cta">
        <a class="btn btn--sm" href="{p}contact.html">Get a fixed-price quote</a>
      </div>
    </nav>
  </div>
</header>"""

FOOTER = """<footer class="site-footer footer">
  <div class="wrap">
    <div class="footer__grid">
      <div class="footer__brand">
        <a class="brand" href="{p}index.html">
          <img src="{p}images/logo-icon.png" alt="Machshev Labs" class="brand__mark" width="33" height="28">
          Machshev Labs
        </a>
        <p>Computational electromagnetics for hardware startups. EMI/EMC, signal and power integrity, and FCC pre-compliance without the enterprise license.</p>
      </div>
      <div>
        <h4>Services</h4>
        <ul>
          <li><a href="{p}services.html#tier2">SI/PI &amp; EMI sprints</a></li>
          <li><a href="{p}services.html#tier3">FCC pre-compliance</a></li>
          <li><a href="{p}services.html#tier1">Pre-flight check (roadmap)</a></li>
          <li><a href="{p}services.html#pricing">Pricing</a></li>
        </ul>
      </div>
      <div>
        <h4>Free tools</h4>
        <ul>
          <li><a href="{p}resources.html#impedance">Trace impedance</a></li>
          <li><a href="{p}resources.html#resonance">Plane resonance</a></li>
          <li><a href="{p}resources.html#fcc">FCC limit converter</a></li>
          <li><a href="{p}resources.html#autopsies">EMI autopsies</a></li>
        </ul>
      </div>
      <div>
        <h4>Blog</h4>
        <ul>
          {footer_blog_links}
        </ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="{p}about.html">About</a></li>
          <li><a href="{p}about.html#approach">How we work</a></li>
          <li><a href="{p}contact.html">Contact</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__bar">
      <span>© <span data-year>2026</span> Machshev Labs LLC</span>
      <span class="spacer"></span>
      <span>Not an accredited test laboratory</span>
      <a href="#">Privacy</a>
      <a href="#">Terms</a>
    </div>
  </div>
</footer>"""


def header_html(prefix, blog_current=False):
    nav = NAV_LINKS.format(p=prefix, blog_current=' aria-current="page"' if blog_current else "")
    return HEADER.format(p=prefix, nav_links=nav)


def footer_html(prefix, footer_blog_links):
    return FOOTER.format(p=prefix, footer_blog_links=footer_blog_links)


POST_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} — Machshev Labs</title>
<meta name="description" content="{description}">
<meta name="theme-color" content="#06080c">
<link rel="icon" href="../images/favicon.png" type="image/png">
<link rel="stylesheet" href="../assets/css/styles.css">
</head>
<body>

{header}

<main>

  <section class="page-head">
    <div class="wrap">
      <a class="arrow-link" href="../blog.html" style="margin-bottom:18px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
        All posts
      </a>
      <div class="post-meta">
        <span class="badge badge--pass">{tag}</span>
        <span>{series_label} · {num:02d} of {series_total}</span>
        <span>·</span>
        <span>{reading_time} min read</span>
      </div>
      <h1 style="max-width:26ch">{title}</h1>
      <p class="lede">{excerpt}</p>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="post-layout">
        <article class="post-body">
{body}
        </article>
{toc}
      </div>
    </div>
  </section>

  <section class="section--tight">
    <div class="wrap">
      <div class="post-pager">
{pager}
      </div>
    </div>
  </section>

  <section class="section--tight" style="padding-bottom:clamp(64px,9vw,116px)">
    <div class="wrap">
      <div class="cta reveal">
        <h2>Found something like this on your own board?</h2>
        <p class="lede">
          A stub that looks like a mistake, a split that isn't, a resonance nobody accounted for —
          this is exactly what a Tier 2 simulation sprint checks before tape-out, not after a failed scan.
        </p>
        <div class="btn-row">
          <a class="btn" href="../contact.html">Get a fixed-price quote</a>
          <a class="btn btn--ghost" href="../services.html#tier2">See what a sprint covers</a>
        </div>
      </div>
    </div>
  </section>

</main>

{footer}

<script src="../assets/js/main.js"></script>
</body>
</html>
"""

INDEX_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Blog — Machshev Labs</title>
<meta name="description" content="Reference writing on RF PCB design and on the open-source computational electromagnetics stack, with the arithmetic done rather than gestured at.">
<meta name="theme-color" content="#06080c">
<link rel="icon" href="images/favicon.png" type="image/png">
<link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>

{header}

<main>

  <section class="page-head">
    <div class="wrap">
      <span class="eyebrow">Blog</span>
      <h1 style="max-width:20ch">Reference writing, worked in full</h1>
      <p class="lede">
        Two series: RF PCB design for engineers laying out boards above a few hundred megahertz,
        and field notes on the open-source CEM stack and why the commercial side of this market is
        priced the way it is. No signup, and the arithmetic is shown, not just the conclusion.
      </p>
    </div>
  </section>

{sections}

  <section class="section--tight" style="padding-bottom:clamp(64px,9vw,116px)">
    <div class="wrap">
      <div class="cta reveal">
        <h2>Already past the reference stage?</h2>
        <p class="lede">
          If you're staring at a layout or a sourcing decision that has real tape-out cost either
          way, that's what the simulation sprints are for.
        </p>
        <div class="btn-row">
          <a class="btn" href="contact.html">Get a fixed-price quote</a>
          <a class="btn btn--ghost" href="services.html">See the services</a>
        </div>
      </div>
    </div>
  </section>

</main>

{footer}

<script src="assets/js/main.js"></script>
</body>
</html>
"""

INDEX_SECTION_TEMPLATE = """  <section class="section{alt_class}">
    <div class="wrap">
      <div class="section-head reveal">
        <span class="eyebrow">{label}</span>
        <p class="lede">{intro}</p>
      </div>
      <div class="grid grid--2">
{cards}
      </div>
    </div>
  </section>
"""


def make_slug(md_filename):
    return os.path.splitext(md_filename)[0]


def build():
    all_posts = []  # flat list, in file-writing order, for the footer links

    for series in SERIES:
        series_posts = []
        series_total = len(series["posts"])

        for i, (fname, tag) in enumerate(series["posts"], start=1):
            path = os.path.join(BLOG_DIR, fname)
            with open(path, encoding="utf-8") as f:
                raw = f.read()

            title, rest = split_title_and_body(raw)
            excerpt_md, body_md = split_excerpt_and_body(rest)
            body_html, toc = render_post_body(body_md)
            reading_time = max(1, round(word_count(body_html) / WORDS_PER_MINUTE))

            series_posts.append({
                "num": i,
                "series_key": series["key"],
                "series_label": series["label"],
                "series_total": series_total,
                "slug": make_slug(fname),
                "tag": tag,
                "title": title,
                "excerpt_html": render_inline_markdown(excerpt_md),
                "excerpt_plain": plain_text(excerpt_md),
                "body_html": body_html,
                "toc": toc,
                "reading_time": reading_time,
            })

        series["parsed"] = series_posts
        all_posts.extend(series_posts)

    # Keep this column the same height as its siblings (Services, Free
    # tools, Company each list 3-4 items) rather than every post.
    first_post, last_post = all_posts[0], all_posts[-1]
    footer_blog_links_root = (
        '<li><a href="blog.html">All posts</a></li>\n'
        '          <li><a href="blog/%s.html">Start here: %s</a></li>\n'
        '          <li><a href="blog/%s.html">Latest: %s</a></li>'
    ) % (first_post["slug"], first_post["tag"], last_post["slug"], last_post["tag"])

    footer_blog_links_post = (
        '<li><a href="../blog.html">All posts</a></li>\n'
        '          <li><a href="%s.html">Start here: %s</a></li>\n'
        '          <li><a href="%s.html">Latest: %s</a></li>'
    ) % (first_post["slug"], first_post["tag"], last_post["slug"], last_post["tag"])

    # -------------------------------------------------------- post pages --
    # Prev/next stays inside each series — post 6 of the RF series never
    # hands off to post 1 of the tooling notes as a "next" post.
    for series in SERIES:
      parsed = series["parsed"]
      for i, post in enumerate(parsed):
        prev_post = parsed[i - 1] if i > 0 else None
        next_post = parsed[i + 1] if i < len(parsed) - 1 else None

        pager_parts = []
        if prev_post:
            pager_parts.append(
                '<a class="post-pager__link is-prev" href="%s.html">'
                '<span class="post-pager__dir">← Previous</span>'
                '<span class="post-pager__title">%s</span></a>'
                % (prev_post["slug"], html.escape(prev_post["title"]))
            )
        else:
            pager_parts.append('<span></span>')
        if next_post:
            pager_parts.append(
                '<a class="post-pager__link is-next" href="%s.html">'
                '<span class="post-pager__dir">Next →</span>'
                '<span class="post-pager__title">%s</span></a>'
                % (next_post["slug"], html.escape(next_post["title"]))
            )
        else:
            pager_parts.append('<span></span>')

        if post["toc"]:
            toc_items = "\n          ".join(
                '<li><a href="#%s">%s</a></li>' % (t["id"], html.escape(t["name"]))
                for t in post["toc"]
            )
            toc_html = (
                '<aside class="post-toc" data-post-toc>\n'
                '          <span class="post-toc__label">On this page</span>\n'
                '          <ol>\n          %s\n          </ol>\n'
                '        </aside>'
            ) % toc_items
        else:
            toc_html = ""

        description = post["excerpt_plain"]
        if len(description) > 200:
            description = description[:197].rsplit(" ", 1)[0] + "…"

        page = POST_TEMPLATE.format(
            title=html.escape(post["title"]),
            description=html.escape(description),
            header=header_html("../", blog_current=True),
            footer=footer_html("../", footer_blog_links_post),
            tag=post["tag"],
            num=post["num"],
            series_label=post["series_label"],
            series_total=post["series_total"],
            reading_time=post["reading_time"],
            excerpt=post["excerpt_html"],
            body=post["body_html"],
            toc=toc_html,
            pager="\n        ".join(pager_parts),
        )
        out_path = os.path.join(BLOG_DIR, post["slug"] + ".html")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(page)
        print("wrote", os.path.relpath(out_path, ROOT))

    # -------------------------------------------------------------- index --
    # One headed section per series, each with its own card grid.
    section_html = []
    for series in SERIES:
        cards = []
        for post in series["parsed"]:
            card = (
                '<article class="card blog-card reveal">\n'
                '          <div class="blog-card__head">\n'
                '            <span class="blog-card__num">REF {num:02d}</span>\n'
                '            <span class="badge badge--pass">{tag}</span>\n'
                '          </div>\n'
                '          <h3><a href="blog/{slug}.html" style="color:inherit">{title}</a></h3>\n'
                '          <p>{excerpt}</p>\n'
                '          <div class="blog-card__meta">\n'
                '            <span>{reading_time} min read</span>\n'
                '            <i class="dot"></i>\n'
                '            <a class="arrow-link" href="blog/{slug}.html">Read\n'
                '              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>\n'
                '            </a>\n'
                '          </div>\n'
                '        </article>'
            ).format(
                num=post["num"],
                tag=post["tag"],
                slug=post["slug"],
                title=html.escape(post["title"]),
                excerpt=html.escape(post["excerpt_plain"]),
                reading_time=post["reading_time"],
            )
            cards.append(card)

        section_html.append(INDEX_SECTION_TEMPLATE.format(
            alt_class=" section--alt" if series is SERIES[1] else "",
            label=series["label"],
            intro=series["intro"],
            cards="\n".join(cards),
        ))

    index_page = INDEX_TEMPLATE.format(
        header=header_html("", blog_current=True),
        footer=footer_html("", footer_blog_links_root),
        sections="\n".join(section_html),
    )
    index_path = os.path.join(ROOT, "blog.html")
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(index_page)
    print("wrote", os.path.relpath(index_path, ROOT))


if __name__ == "__main__":
    build()
