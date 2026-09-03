"""Build structural outlines (coverage maps) from Engineering Funda EM slide decks.

Emits section titles + sub-headings only -- deliberately NOT a transcription.
"""
import pymupdf, sys, re, os

WM     = "Engineering Funda"
BULLET = "\u25aa"   # small black square - body bullet
BOX    = "\u2751"   # shadowed square    - section header
ARROWS = ("\u27f9", "\u21d2")

# Decks whose structure lives in images, not the text layer; outlined by hand.
SKIP = {"Smith+Chart.pdf"}


def clean(t):
    for ch in (BULLET, BOX) + ARROWS:
        t = t.replace(ch, "")
    return re.sub(r"\s+", " ", t).strip(" .:\u2013-")


def is_mathy(c):
    # Mathematical alphanumerics, Greek, arrows, and combining vector hats.
    o = ord(c)
    return o > 0x2000 or 0x0370 <= o <= 0x03FF or 0x0D80 <= o <= 0x0DFF


def is_noise(t):
    """Reject equation fragments, stray diagram labels, and body prose.

    Real slide headings are short capitalised noun phrases containing no
    mathematical symbols; body copy and worked questions carry both.
    """
    letters = [c for c in t if c.isalpha()]
    if len(letters) < 4:
        return True
    # Any mathematical alphanumeric means this is an equation or prose, not a heading.
    if any(0x1D400 <= ord(c) <= 0x1D7FF for c in t):
        return True
    if sum(1 for c in letters if is_mathy(c)) / len(letters) > 0.35:
        return True
    if "=" in t and len(t.split()) < 4:
        return True
    if t[0].islower():                 # mid-sentence continuation line
        return True
    if t.lower().startswith(("question", "example:", "find ", "note:")):
        return True
    if len(t) > 85:
        return True
    return False


def page_lines(page):
    out = []
    for b in page.get_text("dict")["blocks"]:
        if b.get("type") != 0:
            continue
        for l in b["lines"]:
            txt = re.sub(r"\s+", " ", "".join(s["text"] for s in l["spans"])).strip()
            if not txt or WM in txt:
                continue
            out.append((round(max(s["size"] for s in l["spans"]), 1),
                        l["bbox"][1], l["bbox"][0], txt))
    out.sort(key=lambda r: (r[1], r[2]))
    return out


def body_size(doc):
    """Modal text size across the deck = its body-copy size."""
    from collections import Counter
    c = Counter()
    for page in doc:
        for sz, y, x, t in page_lines(page):
            if 18 <= sz < 40:
                c[round(sz)] += 1
    return c.most_common(1)[0][0] if c else 24


def outline(path):
    doc  = pymupdf.open(path)
    body = body_size(doc)
    secs = []
    for pno in range(len(doc)):
        ls      = page_lines(doc[pno])
        big     = [t for sz, y, x, t in ls if sz >= 40]
        is_outl = any(t.strip().lower() == "outlines" for sz, y, x, t in ls)

        topics = []
        for sz, y, x, t in ls:
            if t.strip().lower() == "outlines":
                continue
            # A slide heading sits at the top of the slide in a size above body copy.
            # Marker glyphs are unreliable: some decks use them for headers, others
            # for body prose, so they are never the deciding factor.
            heading = sz > body + 1 and sz < 40 and y < 45
            # On the deck's own contents page, every bullet is a topic.
            listed  = is_outl and 20 <= sz < 40 and t.lstrip().startswith((BULLET, BOX))
            if heading or listed:
                c = clean(t)
                if 4 <= len(c) <= 90 and not is_noise(c):
                    topics.append(c)

        if big:
            title = clean(" ".join(big))
            if secs and secs[-1]["title"].lower() == title.lower():
                secs[-1]["end"] = pno + 1
                secs[-1]["topics"] += topics
                continue
            secs.append({"title": title, "start": pno + 1, "end": pno + 1, "topics": topics})
        elif secs:
            secs[-1]["end"] = pno + 1
            secs[-1]["topics"] += topics
        else:
            secs.append({"title": "(front matter)", "start": pno + 1,
                         "end": pno + 1, "topics": topics})

    for s_ in secs:
        seen, keep = set(), []
        for t in s_["topics"]:
            k = t.lower()
            if k in seen or k == s_["title"].lower():
                continue
            seen.add(k)
            keep.append(t)
        s_["topics"] = keep
    return len(doc), secs


def render(path):
    name    = os.path.basename(path)
    pretty  = name[:-4].replace("+", " ")
    npages, secs = outline(path)
    L = [f"# {pretty} — Deck Outline\n",
         f"**Source:** `{name}` — {npages} slides, {len(secs)} sections.  ",
         "**Status:** structural outline only — a coverage map of what the deck covers, ",
         "not a transcription of its content.  ",
         "**Attribution:** the source slides are third-party material watermarked *Engineering Funda*. ",
         "Do not publish this material verbatim; use it to decide which topics to write about in your own words.\n",
         "---\n"]
    for i, s in enumerate(secs, 1):
        rng = f"slide {s['start']}" if s["start"] == s["end"] else f"slides {s['start']}–{s['end']}"
        L.append(f"## {i}. {s['title']}")
        L.append(f"*{rng}*\n")
        if s["topics"]:
            L += [f"- {t}" for t in s["topics"]]
        else:
            L.append("- *(no sub-headings — diagram/derivation slides)*")
        L.append("")
    return "\n".join(L)


if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(src)):
        if not f.lower().endswith(".pdf") or f in SKIP:
            continue
        md  = render(os.path.join(src, f))
        out = os.path.join(dst, f[:-4].replace("+", "_").lower() + "_outline.md")
        with open(out, "w", encoding="utf-8") as fh:
            fh.write(md)
        n_sec = md.count("\n## ")
        n_top = len([l for l in md.splitlines() if l.startswith("- ") and "no sub-headings" not in l])
        print(f"{os.path.basename(out):42} sections={n_sec:3} topics={n_top:4}")
