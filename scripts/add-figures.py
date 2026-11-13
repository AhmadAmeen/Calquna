#!/usr/bin/env python3
"""Insert a photograph figure after the lede of every tool page, and a hero
plus section band figures into the three homepages. Idempotent: skips pages
that already contain a figure."""
import re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / 'src' / 'pages'

ALT = {
    'en': {
        'hero': 'A desk with a calculator, paperwork and a notebook',
        'dates': 'A paper planner open at a month view, with a cup of coffee',
        'bmi': 'A person lifting a barbell in a gym',
        'due': 'A baby in a sun hat floating in a pool ring',
        'sleep': 'A calm, neatly made bedroom',
        'money': 'Coins on a table with a young plant growing from them',
        'salary': 'United States dollar bills spread out',
        'percent': 'Red sale tags on a dark background',
        'gpa': 'Open books and a notebook on a library desk',
        'words': 'A fountain pen writing on lined paper',
        'password': 'Lines of code on a screen',
        'qr': 'A QR code linking to the QR code generator',
        'youtube': 'A video editing timeline on a computer screen',
        'tiktok': 'A creator filming outdoors above the clouds',
        'instagram': 'The Instagram app icon',
    },
    'es': {
        'hero': 'Un escritorio con una calculadora, papeles y una libreta',
        'dates': 'Una agenda de papel abierta en la vista mensual, con una taza de café',
        'bmi': 'Una persona levantando una barra en un gimnasio',
        'due': 'Un bebé con gorro de sol flotando en un flotador',
        'sleep': 'Un dormitorio tranquilo con la cama hecha',
        'money': 'Monedas sobre una mesa con una planta joven creciendo entre ellas',
        'salary': 'Billetes de dólar estadounidense extendidos',
        'percent': 'Etiquetas rojas de rebajas sobre un fondo oscuro',
        'gpa': 'Libros abiertos y una libreta en una mesa de biblioteca',
        'words': 'Una pluma estilográfica escribiendo en papel rayado',
        'password': 'Líneas de código en una pantalla',
        'qr': 'Un código QR que enlaza al generador de códigos QR',
        'youtube': 'La línea de tiempo de un editor de vídeo en la pantalla de un ordenador',
        'tiktok': 'Un creador grabando al aire libre sobre las nubes',
        'instagram': 'El icono de la aplicación de Instagram',
    },
    'fr': {
        'hero': 'Un bureau avec une calculatrice, des papiers et un carnet',
        'dates': 'Un agenda papier ouvert sur la vue mensuelle, avec une tasse de café',
        'bmi': 'Une personne soulevant une barre dans une salle de sport',
        'due': 'Un bébé avec un chapeau de soleil dans une bouée',
        'sleep': 'Une chambre calme au lit soigneusement fait',
        'money': 'Des pièces sur une table et une jeune pousse qui grandit au milieu',
        'salary': 'Des billets en dollars américains étalés',
        'percent': 'Des étiquettes de soldes rouges sur fond sombre',
        'gpa': 'Des livres ouverts et un cahier sur une table de bibliothèque',
        'words': 'Un stylo-plume écrivant sur du papier ligné',
        'password': 'Des lignes de code sur un écran',
        'qr': 'Un code QR qui mène au générateur de codes QR',
        'youtube': "La timeline d'un logiciel de montage vidéo sur un écran",
        'tiktok': 'Un créateur qui filme en plein air au-dessus des nuages',
        'instagram': "L'icône de l'application Instagram",
    },
}

# slug -> (image, category)
TOOLS = {
    'en': {
        'age-calculator': ('dates', 'dates'), 'days-between-dates': ('dates', 'dates'),
        'bmi-calculator': ('bmi', 'health'), 'due-date-calculator': ('due', 'health'),
        'sleep-calculator': ('sleep', 'health'), 'compound-interest-calculator': ('money', 'money'),
        'salary-to-hourly-calculator': ('salary', 'money'), 'percentage-calculator': ('percent', 'money'),
        'gpa-calculator': ('gpa', 'school'), 'word-counter': ('words', 'words'),
        'password-generator': ('password', 'utilities'), 'qr-code-generator': ('qr', 'utilities'),
        'youtube-money-calculator': ('youtube', 'creator'), 'tiktok-money-calculator': ('tiktok', 'creator'),
        'instagram-unfollowers-checker': ('instagram', 'creator'),
    },
    'es': {
        'calculadora-de-edad': ('dates', 'dates'), 'dias-entre-fechas': ('dates', 'dates'),
        'calculadora-imc': ('bmi', 'health'), 'calculadora-de-embarazo': ('due', 'health'),
        'calculadora-de-sueno': ('sleep', 'health'), 'calculadora-interes-compuesto': ('money', 'money'),
        'salario-por-hora': ('salary', 'money'), 'calculadora-de-porcentajes': ('percent', 'money'),
        'calculadora-de-promedio': ('gpa', 'school'), 'contador-de-palabras': ('words', 'words'),
        'generador-de-contrasenas': ('password', 'utilities'), 'generador-de-codigos-qr': ('qr', 'utilities'),
        'calculadora-dinero-youtube': ('youtube', 'creator'), 'calculadora-dinero-tiktok': ('tiktok', 'creator'),
        'quien-no-me-sigue-en-instagram': ('instagram', 'creator'),
    },
    'fr': {
        'calculateur-age': ('dates', 'dates'), 'jours-entre-dates': ('dates', 'dates'),
        'calculateur-imc': ('bmi', 'health'), 'calculateur-date-accouchement': ('due', 'health'),
        'calculateur-de-sommeil': ('sleep', 'health'), 'calculateur-interets-composes': ('money', 'money'),
        'salaire-brut-net': ('salary', 'money'), 'calculateur-de-pourcentage': ('percent', 'money'),
        'calculateur-de-moyenne': ('gpa', 'school'), 'compteur-de-mots': ('words', 'words'),
        'generateur-de-mot-de-passe': ('password', 'utilities'), 'generateur-qr-code': ('qr', 'utilities'),
        'calculateur-revenus-youtube': ('youtube', 'creator'), 'calculateur-revenus-tiktok': ('tiktok', 'creator'),
        'qui-ne-me-suit-pas-sur-instagram': ('instagram', 'creator'),
    },
}

SECTIONS = {  # homepage h2 id -> image
    'dates': 'dates', 'fechas': 'dates',
    'health': 'bmi', 'salud': 'bmi', 'sante': 'bmi',
    'money': 'money', 'dinero': 'money', 'argent': 'money',
    'words': 'words', 'palabras': 'words', 'mots': 'words',
}

def fig(img, cat, lang, band=False, qr=False):
    ext = 'png' if img == 'qr' else 'webp'
    cls = 'fig' + (f' fig--{cat}' if cat else '') + (' fig--band' if band else '') + (' fig--qr' if qr else '')
    return (f'<figure class="{cls}"><img src="/img/{img}.{ext}" alt="{ALT[lang][img]}" '
            f'width="1200" height="514" loading="lazy" decoding="async"></figure>')

def after_lede(text, snippet):
    i = text.find('class="lede"')
    if i == -1:
        return None
    j = text.find('</p>', i)
    return text[:j + 4] + '\n    ' + snippet + text[j + 4:]

changed, skipped = [], []
for lang in ('en', 'es', 'fr'):
    base = ROOT if lang == 'en' else ROOT / lang
    for slug, (img, cat) in TOOLS[lang].items():
        f = base / slug / 'index.astro'
        t = f.read_text(encoding='utf-8')
        if '<figure' in t:
            skipped.append(str(f)); continue
        out = after_lede(t, fig(img, cat, lang, qr=(img == 'qr')))
        if out is None:
            print('NO LEDE:', f); sys.exit(1)
        f.write_text(out, encoding='utf-8'); changed.append(str(f))
    # homepage
    f = base / 'index.astro'
    t = f.read_text(encoding='utf-8')
    if '<figure' not in t:
        out = after_lede(t, fig('hero', None, lang))
        if out is None:
            print('NO LEDE home:', f); sys.exit(1)
        t = out
        def band(m):
            return m.group(0) + '\n    ' + fig(SECTIONS[m.group(1)], None, lang, band=True)
        t = re.sub(r'<h2 id="(dates|fechas|health|salud|sante|money|dinero|argent|words|palabras|mots)"[^>]*>.*?</h2>', band, t, flags=re.S)
        f.write_text(t, encoding='utf-8'); changed.append(str(f))

print(f'changed {len(changed)}, skipped {len(skipped)}')
