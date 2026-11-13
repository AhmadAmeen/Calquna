#!/usr/bin/env python3
"""Give every tool page an 'On this page' contents list (the Omni Calculator
pattern): slugify each h2 into an id, then insert a small nav after the
page's photograph linking to those sections. Idempotent."""
import re, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / 'src' / 'pages'
TITLE = {'en': 'On this page', 'es': 'En esta página', 'fr': 'Sur cette page'}

def slugify(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

TRUST = {
    'en': {'about', 'privacy', 'contact'},
    'es': {'acerca-de', 'privacidad', 'contacto'},
    'fr': {'a-propos', 'confidentialite', 'contact'},
}

changed = 0
for lang in ('en', 'es', 'fr'):
    base = ROOT if lang == 'en' else ROOT / lang
    slugs = sorted(d.name for d in base.iterdir() if d.is_dir() and d.name not in TRUST[lang] and d.name not in ('es', 'fr'))
    for slug in slugs:
        f = base / slug / 'index.astro'
        t = f.read_text(encoding='utf-8')
        if 'class="onpage"' in t:
            continue
        heads = []
        def add_id(m):
            attrs, text = m.group(1) or '', m.group(2)
            hid = slugify(text)
            heads.append((hid, text))
            if 'id=' in attrs:
                hid = re.search(r'id="([^"]+)"', attrs).group(1)
                heads[-1] = (hid, text)
                return m.group(0)
            return f'<h2 id="{hid}"{attrs}>{text}</h2>'
        t = re.sub(r'<h2([^>]*)>([^<]+)</h2>', add_id, t)
        if len(heads) < 2:
            print('FEW H2:', f, len(heads)); sys.exit(1)
        items = ''.join(f'<li><a href="#{h}">{x}</a></li>' for h, x in heads)
        nav = (f'<nav class="onpage" aria-label="{TITLE[lang]}">'
               f'<p class="onpage-title">{TITLE[lang]}</p><ul>{items}</ul></nav>')
        i = t.find('</figure>')
        if i == -1:
            print('NO FIGURE:', f); sys.exit(1)
        t = t[:i + 9] + '\n    ' + nav + t[i + 9:]
        f.write_text(t, encoding='utf-8')
        changed += 1
print('onpage added to', changed, 'pages')
