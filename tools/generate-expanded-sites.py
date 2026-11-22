#!/usr/bin/env python3
"""Generate static subpages for the first four design previews, preserving existing catalog data."""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS = json.loads((ROOT / 'site-previews/products.json').read_text(encoding='utf-8'))
SITES = {
    1: ('АЛКО НОЧЬ', 'Выберите напитки для своего вечера: сравните позиции по категориям и уточните детали звонком.'),
    2: ('АЛКО МАЯК', 'Поможем с выбором: откройте нужный раздел, соберите список и обсудите заказ по телефону.'),
    3: ('АЛКО БЮРО', 'Каталог помогает быстро найти знакомые напитки и подготовить список перед звонком.'),
    4: ('АЛКО КЛУБ', 'Соберите подборку на вечер: в каталоге представлены разные категории напитков.'),
}
CATEGORIES = {
    'whisky': ('Виски', 'В разделе собраны позиции виски разных марок. Сравните фотографии и выберите то, что хотите уточнить по телефону.'),
    'vodka': ('Водка', 'В этом разделе представлены варианты водки. Выберите знакомую марку и уточните наличие и стоимость при звонке.'),
    'gin': ('Джин', 'Посмотрите джин в каталоге. Если нужна помощь с выбором конкретной позиции, обсудите её по телефону.'),
    'cognac': ('Коньяк', 'Здесь можно посмотреть коньяк из каталога и собрать список интересующих позиций перед звонком.'),
    'liqueur': ('Ликёры', 'В разделе собраны ликёры из текущего ассортимента. Наличие и стоимость выбранного напитка уточняйте по телефону.'),
    'vermouth': ('Вермут', 'Посмотрите представленные варианты вермута и добавьте выбранные позиции в список для звонка.'),
    'white-wine': ('Белое вино', 'В этом разделе — белое вино из каталога. Можно выбрать позицию по фотографии и названию, а детали обсудить при звонке.'),
    'red-wine': ('Красное вино', 'Подборка красного вина помогает сравнить доступные в каталоге позиции и подготовить список заказа.'),
    'sparkling': ('Игристое', 'Здесь представлены игристые напитки из каталога. Выберите подходящие позиции и уточните наличие по телефону.'),
    'beer': ('Пиво', 'В разделе можно посмотреть пиво из каталога и добавить интересующие позиции в список перед звонком.'),
}
E = lambda x: html.escape(str(x), quote=True)


def page(site, title, subtitle, body, location, is_catalog=False):
    name, _ = SITES[site]
    # Pages live at siteN/catalog/, siteN/catalog/category/, siteN/delivery/, siteN/faq/.
    depth = len(Path(location).parts)
    to_site = '../' * depth
    to_root = '../' * (depth + 1)
    css = to_root + 'site-previews/'
    nav = (f'<a href="{to_site}">Главная</a><a href="{to_site}catalog/">Каталог</a>'
           f'<a href="{to_site}delivery/">Доставка</a><a href="{to_site}faq/">Вопросы</a>')
    search = '<label class="expanded-search"><span class="eyebrow">Поиск по каталогу</span><input id="expanded-search" type="search" placeholder="Название или категория" aria-label="Поиск по каталогу"></label><p class="search-empty basket-status" hidden>Ничего не найдено. Попробуйте другой запрос.</p>' if is_catalog else ''
    dialog = '''<button class="basket-float" type="button" hidden>Корзина →</button><dialog class="basket-dialog" aria-labelledby="basket-title"><div class="basket-head"><h2 id="basket-title">Корзина</h2><button class="basket-close" type="button" aria-label="Закрыть корзину">✕</button></div><p class="basket-note">Выберите товары и позвоните, чтобы обсудить заказ. Список не отправляется автоматически — назовите его оператору.</p><div class="basket-items" aria-live="polite"></div><p class="basket-empty basket-status">Корзина пока пуста</p><a class="primary basket-checkout" href="tel:+74950959599" hidden>Оформить — позвонить ↗</a></dialog>'''
    return f'''<!doctype html>
<html lang="ru" data-theme="{site}" data-site="site{site}" data-image-base="{to_root}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><title>{E(title)} — {E(name)}</title><meta name="description" content="{E(subtitle)}"><link rel="icon" href="{to_site}logo.svg" type="image/svg+xml"><link rel="stylesheet" href="{css}styles.css"><link rel="stylesheet" href="{css}expanded.css"><script src="{css}products.js" defer></script><script src="{css}expanded.js" defer></script></head>
<body><header class="header expanded-header"><a class="brand" href="{to_site}"><img src="{to_site}logo.svg" alt=""><span>{E(name)}<small>Доставка по Москве 24/7</small></span></a><nav class="navigation" aria-label="Навигация">{nav}</nav><button class="basket-open" type="button" aria-haspopup="dialog">Корзина <span class="basket-count">0</span></button></header><main class="expanded-main"><nav class="breadcrumbs" aria-label="Навигационная цепочка"><a href="{to_site}">Главная</a><span> / </span><span>{E(title)}</span></nav><div class="expanded-intro"><span class="eyebrow">{E(name)} / МОСКВА</span><h1>{E(title)}</h1><p>{E(subtitle)}</p></div>{search}{body}</main><footer class="expanded-footer"><div><strong>{E(name)}</strong><p>Доставка по Москве 24/7</p></div><div><a href="tel:+74950959599">+7 (495) 095-95-99</a><p>Чрезмерное употребление алкоголя вредит вашему здоровью · 18+</p></div></footer>{dialog}</body></html>'''


def product_card(item, index, to_root):
    category, name, volume, image = item
    cat = CATEGORIES[category][0]
    terms = f'{name} {cat}'.lower()
    return f'''<article class="product expanded-product" data-search="{E(terms)}"><div class="product-image"><img src="{to_root}{E(image)}" alt="{E(name)}" loading="lazy" decoding="async"></div><div class="product-info"><span class="product-cat">{E(cat)}</span><h3>{E(name)}</h3><p>{E(volume)}</p><button class="add-basket" data-product="{index}" type="button" aria-label="Добавить {E(name)} в корзину">В корзину</button><a href="tel:+74950959599" aria-label="Заказать {E(name)} по телефону">Заказать <span>↗</span></a></div></article>'''


def links(prefix, current=None):
    items = []
    for slug, (label, _) in CATEGORIES.items():
        active = ' aria-current="page"' if current == slug else ''
        items.append(f'<a class="category-link" href="{prefix}{slug}/"{active}>{E(label)} <span>↗</span></a>')
    return '<div class="category-grid">' + ''.join(items) + '</div>'


def catalog_body(site, category=None):
    to_root = '../../../' if category else '../../'
    output = [links('../' if category else './', category)]
    selected = [category] if category else CATEGORIES.keys()
    for slug in selected:
        label, description = CATEGORIES[slug]
        cards = ''.join(product_card(p, i, to_root) for i, p in enumerate(PRODUCTS) if p[0] == slug)
        output.append(f'<section class="catalog-section" id="{slug}"><h2>{E(label)}</h2><div class="products">{cards}</div></section>')
        if category:
            output.append(f'<section class="expanded-copy"><h2>Как выбрать</h2><div><p>{E(description)}</p><p>Добавьте интересующие напитки в корзину или позвоните сразу. Цены, наличие и условия доставки уточняются у оператора.</p></div></section>')
    if not category:
        output.append('<section class="expanded-copy"><h2>Перед звонком</h2><div><p>Можно выбрать несколько товаров и собрать список в корзине. При оформлении откроется звонок; список остаётся на вашем устройстве и автоматически не передаётся.</p><p>Назовите оператору выбранные позиции и уточните стоимость, наличие и детали доставки.</p></div></section>')
    return ''.join(output)


def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding='utf-8')


def main():
    for number, (name, intro) in SITES.items():
        site = ROOT / f'site{number}'
        write(site/'catalog/index.html', page(number, 'Каталог напитков', intro, catalog_body(number), 'catalog', True))
        for slug, (label, text) in CATEGORIES.items():
            write(site/f'catalog/{slug}/index.html', page(number, label, text, catalog_body(number, slug), f'catalog/{slug}', True))
        body = '''<section class="expanded-copy"><h2>Три простых шага</h2><div><ol><li>Выберите интересующие напитки в каталоге и при желании добавьте их в корзину.</li><li>Позвоните нам и назовите выбранные позиции. Состав корзины не передаётся автоматически.</li><li>Обсудите наличие, стоимость, адрес и удобные условия доставки с оператором.</li></ol><p>Точные сроки и стоимость доставки зависят от деталей заказа. Уточните их до оформления по телефону.</p><a class="primary" href="tel:+74950959599">Позвонить нам ↗</a></div></section>'''
        write(site/'delivery/index.html', page(number, 'Доставка и заказ', 'Выберите напитки и обсудите все детали заказа по телефону.', body, 'delivery'))
        faq = [('Как оформить заказ?', 'Выберите напитки в каталоге и позвоните. При желании добавьте их в корзину — она поможет составить список.'), ('Корзина отправляет заказ автоматически?', 'Нет. Она сохраняет выбор на вашем устройстве. Чтобы оформить заказ, позвоните и назовите позиции оператору.'), ('Как узнать цену и наличие?', 'Позвоните по указанному номеру и уточните выбранные позиции.'), ('Сколько стоит доставка и когда она будет?', 'Условия и сроки уточняются при звонке с учётом адреса и деталей заказа.'), ('Какие напитки есть в каталоге?', 'Откройте каталог: там товары разделены на категории, а поиск помогает найти нужное название.')]
        faq_body = '<div class="faq-list">' + ''.join(f'<details><summary>{E(q)}</summary><p>{E(a)}</p></details>' for q, a in faq) + '</div><div class="homepage-extra-nav"><a href="../catalog/">Открыть каталог ↗</a><a href="tel:+74950959599">Позвонить нам ↗</a></div>'
        write(site/'faq/index.html', page(number, 'Вопросы и ответы', 'Собрали ответы о выборе напитков, корзине и оформлении заказа.', faq_body, 'faq'))
        home = site/'index.html'
        content = home.read_text(encoding='utf-8')
        if 'site-previews/expanded.css' not in content:
            content = content.replace('</head>', '<link rel="stylesheet" href="../site-previews/expanded.css"></head>', 1)
        if 'homepage-more' not in content:
            section = f'''<section class="section homepage-more"><div class="section-heading"><div><span class="eyebrow">РАЗДЕЛЫ / КАТАЛОГ</span><h2>Выбирайте <em>по категориям</em></h2></div><p>{E(intro)}</p></div>{links('catalog/')}<div class="homepage-extra-nav"><a href="catalog/">Весь каталог и корзина ↗</a><a href="delivery/">Доставка и заказ ↗</a><a href="faq/">Вопросы и ответы ↗</a></div></section>'''
            content = content.replace('</main>', section+'</main>', 1)
        content = content.replace('<nav class="navigation" aria-label="Навигация"><a href="#catalog">Каталог</a><a href="#how">Как заказать</a></nav>', '<nav class="navigation" aria-label="Навигация"><a href="catalog/">Каталог</a><a href="delivery/">Доставка</a><a href="faq/">Вопросы</a></nav>')
        home.write_text(content, encoding='utf-8')
    print('Готово: сайты 1–4, по 10 категорий, каталог, доставка и вопросы.')

if __name__ == '__main__':
    main()
