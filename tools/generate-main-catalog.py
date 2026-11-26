#!/usr/bin/env python3
"""Generate the main site's catalog and noindex test previews from existing product data."""
from pathlib import Path
import json, html, re
ROOT = Path(__file__).resolve().parents[1]
products = json.loads((ROOT / 'site-previews/products.json').read_text())
CATS = {'whisky':('Виски','виски'), 'vodka':('Водка','водки'), 'gin':('Джин','джина'), 'cognac':('Коньяк','коньяка'), 'liqueur':('Ликёры','ликёров'), 'vermouth':('Вермут','вермута'), 'white-wine':('Белое вино','белого вина'), 'red-wine':('Красное вино','красного вина'), 'sparkling':('Игристое вино','игристого вина'), 'beer':('Пиво','пива')}
DISTRICTS = {
    'cao': ('Центральный округ', 'Центральном округе', 'ЦАО'),
    'sao': ('Северный округ', 'Северном округе', 'САО'),
    'svao': ('Северо-Восточный округ', 'Северо-Восточном округе', 'СВАО'),
    'vao': ('Восточный округ', 'Восточном округе', 'ВАО'),
    'yuvao': ('Юго-Восточный округ', 'Юго-Восточном округе', 'ЮВАО'),
    'yuao': ('Южный округ', 'Южном округе', 'ЮАО'),
    'yuzao': ('Юго-Западный округ', 'Юго-Западном округе', 'ЮЗАО'),
    'zao': ('Западный округ', 'Западном округе', 'ЗАО'),
    'szao': ('Северо-Западный округ', 'Северо-Западном округе', 'СЗАО'),
    'zelao': ('Зеленоградский округ', 'Зеленоградском округе', 'ЗелАО'),
    'nao': ('Новомосковский округ', 'Новомосковском округе', 'НАО'),
    'tao': ('Троицкий округ', 'Троицком округе', 'ТАО'),
}
E = lambda s: html.escape(str(s), quote=True)
slug = lambda p: Path(p[3]).stem
assert len({slug(p) for p in products}) == len(products)

def page(title, description, content, preview, canonical, jsonld=None, search=False):
    prefix = '/test/catalog/' if preview else '/catalog/'
    nav = f'<nav class="navigation"><a href="{"/test/" if preview else "/"}">Главная</a><a href="{prefix}">Каталог</a><a href="{prefix}delivery/">Районы доставки</a><a href="https://t.me/alkomsk_shop_bot">Telegram-бот</a><a href="tel:+74950959599">Позвонить</a></nav>'
    meta = '<meta name="robots" content="noindex,nofollow">' if preview else f'<meta name="robots" content="index,follow"><link rel="canonical" href="https://alcohub-msk.com{canonical}">'
    ld = '<script type="application/ld+json">'+json.dumps(jsonld, ensure_ascii=False).replace('<','\\u003c')+'</script>' if jsonld and not preview else ''
    # Breadcrumbs reflect the real hierarchy instead of pointing every page straight to the catalog.
    home = '/test/' if preview else '/'
    crumbs = [f'<a href="{home}">Главная</a>']
    parts = canonical.strip('/').split('/')
    if len(parts) > 1:
        crumbs.append(f'<a href="{prefix}">Каталог</a>')
    if len(parts) > 2 and parts[1] == 'delivery':
        crumbs.append(f'<a href="{prefix}delivery/">Доставка по округам</a>')
    if len(parts) > 2 and parts[1] == 'product':
        product = next((p for p in products if slug(p) == parts[2]), None)
        if product:
            crumbs.append(f'<a href="{prefix}{product[0]}/">{E(CATS[product[0]][0])}</a>')
    crumbs.append(f'<span aria-current="page">{E(title)}</span>')
    breadcrumbs = ' <span aria-hidden="true">/</span> '.join(crumbs)
    searchbox = '<label class="expanded-search"><span class="eyebrow">Поиск по каталогу</span><input id="expanded-search" type="search" placeholder="Название или категория" aria-label="Поиск по каталогу"></label><p class="search-empty basket-status" hidden>Ничего не найдено. Попробуйте другой запрос.</p>' if search else ''
    return f'''<!doctype html><html lang="ru" data-site="alco-main" data-image-base="/"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>{E(title)} — АЛКО МСК</title><meta name="description" content="{E(description)}">{meta}{ld}<link rel="icon" href="/favicon.ico"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sofia+Sans+Extra+Condensed:wght@600;800&amp;family=Golos+Text:wght@400;500;600&amp;family=Cormorant:ital,wght@1,500;1,600&amp;display=swap"><link rel="stylesheet" href="/site-previews/styles.css"><link rel="stylesheet" href="/site-previews/expanded.css"><link rel="stylesheet" href="/catalog-assets/catalog.css"><script src="/catalog-assets/gate.js"></script><script src="/catalog-assets/metrics.js?v=1" defer></script><script src="/site-previews/products.js" defer></script><script src="/site-previews/expanded.js" defer></script></head><body><header class="header expanded-header"><a class="brand brand-word" href="{"/test/" if preview else "/"}">Алко <i>мск</i></a>{nav}<button class="basket-open" type="button">Корзина <span class="basket-count">0</span></button></header><main class="expanded-main"><nav class="breadcrumbs">{breadcrumbs}</nav><div class="expanded-intro"><span class="eyebrow">АЛКО МСК / МОСКВА</span><h1>{E(title)}</h1><p>{E(description)}</p></div>{searchbox}{content}</main><footer class="expanded-footer"><div><strong>АЛКО МСК</strong><p>Москва, Мещанская ул., 18 · Работаем круглосуточно</p></div><div><a href="tel:+74950959599">+7 (495) 095-95-99</a> · <a href="https://t.me/alkomsk_shop_bot">Telegram-бот</a><p>18+ · Чрезмерное употребление алкоголя вредит вашему здоровью</p></div></footer><button class="basket-float" type="button" hidden>Корзина →</button><dialog class="basket-dialog" aria-labelledby="basket-title"><div class="basket-head"><h2 id="basket-title">Корзина</h2><button class="basket-close" type="button" aria-label="Закрыть корзину">✕</button></div><p class="basket-note">Список хранится на этом устройстве и не отправляется автоматически. Позвоните и назовите позиции оператору.</p><div class="basket-items" aria-live="polite"></div><p class="basket-empty basket-status">Корзина пока пуста</p><a class="primary basket-checkout" href="tel:+74950959599" hidden>Позвонить для заказа ↗</a></dialog></body></html>'''

def categories(prefix):
    return '<div class="category-grid">'+''.join(f'<a class="category-link" href="{prefix}{s}/">{E(n)} <span>↗</span></a>' for s,(n,_) in CATS.items())+'</div>'

def card(p, i, prefix):
    cat,name,vol,image=p
    return f'<article class="product expanded-product" data-search="{E((name+" "+CATS[cat][0]).lower())}"><div class="product-image"><a href="{prefix}product/{slug(p)}/"><img src="/{E(image)}" alt="{E(name)} — {E(CATS[cat][0])}, {E(vol)}" loading="lazy" decoding="async"></a></div><div class="product-info"><span class="product-cat">{E(CATS[cat][0])}</span><h3><a class="card-title-link" href="{prefix}product/{slug(p)}/">{E(name)}</a></h3><p>{E(vol)}</p><p>В наличии · цену уточняйте по телефону</p><button class="add-basket" data-product="{i}" type="button">В корзину</button><a href="tel:+74950959599">Заказать ↗</a></div></article>'

def section(cat,prefix):
    return f'<section class="catalog-section"><h2>{E(CATS[cat][0])}</h2><div class="products">'+''.join(card(p,i,prefix) for i,p in enumerate(products) if p[0]==cat)+'</div></section>'

def write(path, txt):
    p=ROOT / path; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(txt,encoding='utf-8')

urls=['https://alcohub-msk.com/']
for preview in (False, True):
    prefix='/test/catalog/' if preview else '/catalog/'
    out='test/catalog' if preview else 'catalog'
    desc='Каталог напитков: выберите категорию и позиции, уточните цену и условия доставки по телефону.'
    content=categories(prefix)+''.join(section(c,prefix) for c in CATS)
    write(f'{out}/index.html',page('Каталог алкоголя в Москве',desc,content,preview,'/catalog/',search=True))
    if not preview: urls.append('https://alcohub-msk.com/catalog/')
    for cat,(name,gen) in CATS.items():
        title=f'Доставка {gen} в Москве'
        desc=f'Выберите {name.lower()} в каталоге АЛКО МСК. Уточните цену и условия доставки по телефону.'
        content=categories(prefix)+section(cat,prefix)+f'<section class="expanded-copy"><h2>Как заказать {E(name.lower())}</h2><div><p>Посмотрите фотографии, названия и объёмы в каталоге. Добавьте интересующие позиции в корзину, чтобы составить список для звонка.</p><p>Позвоните нам и назовите выбранные напитки. Оператор уточнит актуальную цену, а также возможность, стоимость и сроки доставки по вашему адресу.</p><p>Корзина сохраняет список только на этом устройстве и не передаёт его автоматически.</p></div></section>'
        canonical=f'/catalog/{cat}/'; write(f'{out}/{cat}/index.html',page(title,desc,content,preview,canonical,search=True))
        if not preview: urls.append('https://alcohub-msk.com'+canonical)
    links = '<div class="category-grid">'+''.join(f'<a class="category-link" href="{prefix}delivery/{slug}/">{E(short)} · {E(name)} <span>↗</span></a>' for slug,(name,where,short) in DISTRICTS.items())+'</div>'
    delivery_desc = 'Работаем по Москве круглосуточно. Выберите округ, а стоимость и сроки доставки уточните по телефону.'
    delivery_body = links+'<section class="expanded-copy"><h2>Доставка по Москве</h2><div><p>Выберите округ, посмотрите каталог и составьте список интересующих напитков. Для уточнения условий назовите оператору адрес и выбранные позиции.</p><p>Стоимость, сроки и возможность доставки по конкретному адресу уточняйте по телефону. Также можно открыть наш Telegram-бот.</p><p><a class="primary" href="https://t.me/alkomsk_shop_bot">Открыть Telegram-бот ↗</a></p></div></section>'
    write(f'{out}/delivery/index.html',page('Доставка по районам Москвы',delivery_desc,delivery_body,preview,'/catalog/delivery/'))
    if not preview: urls.append('https://alcohub-msk.com/catalog/delivery/')
    for dslug,(name,where,short) in DISTRICTS.items():
        canonical = f'/catalog/delivery/{dslug}/'
        title = f'Доставка алкоголя: {name} Москвы'
        district_desc = f'Заказать доставку алкоголя в {where} Москвы: выберите напитки и уточните условия по телефону.'
        district_body = f'<section class="expanded-copy"><h2>{E(short)} · {E(name)}</h2><div><p>Выберите напитки в каталоге и подготовьте список для заказа в {E(where)} Москвы. В карточках указаны названия, фотографии и объёмы.</p><p>Назовите адрес оператору: стоимость и сроки доставки, а также цену выбранных напитков уточняйте по телефону.</p><p><a class="primary" href="{prefix}">Открыть каталог ↗</a></p><p><a href="https://t.me/alkomsk_shop_bot">Открыть Telegram-бот ↗</a></p></div></section><h2>Другие округа</h2>'+links
        write(f'{out}/delivery/{dslug}/index.html',page(title,district_desc,district_body,preview,canonical))
        if not preview: urls.append('https://alcohub-msk.com'+canonical)
    for i,p in enumerate(products):
        cat,name,vol,image=p; canonical=f'/catalog/product/{slug(p)}/'
        desc=f'{name}, {vol}: фото и сведения о товаре. В наличии. Стоимость и условия доставки уточняйте по телефону.'
        data={'@context':'https://schema.org','@type':'Product','name':name,'image':'https://alcohub-msk.com/'+image,'description':f'{name}, {vol}. В наличии, цену уточняйте по телефону.', 'offers':{'@type':'Offer','url':'https://alcohub-msk.com'+canonical,'availability':'https://schema.org/InStock'}}
        content=f'<div class="product-detail"><img src="/{E(image)}" alt="{E(name)}, {E(vol)}"><div><p>Категория: <a href="{prefix}{cat}/">{E(CATS[cat][0])}</a></p><p>Объём: {E(vol)}</p><p>В наличии</p><p>Цена уточняется по телефону.</p><button class="add-basket" data-product="{i}" type="button">В корзину</button><p><a class="primary" href="tel:+74950959599">Позвонить для заказа ↗</a></p><p><a href="https://t.me/alkomsk_shop_bot">Открыть Telegram-бот ↗</a></p><p class="return-note">Корзина не отправляется автоматически. Назовите товары оператору при звонке.</p></div></div>'
        write(f'{out}/product/{slug(p)}/index.html',page(name,desc,content,preview,canonical,jsonld=data))
        if not preview: urls.append('https://alcohub-msk.com'+canonical)
xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('  <url><loc>'+html.escape(u)+'</loc></url>\n' for u in urls)+'</urlset>\n'
write('sitemap.xml',xml)

# Keep the two homepage entry points synchronized and make /test/ a real,
# noindex preview rather than a directory listing. /test.html remains unchanged.
home = (ROOT / 'index.html').read_text(encoding='utf-8')
write('test.html', home)
write('test/index.html', home.replace('<meta name="robots" content="index,follow">', '<meta name="robots" content="noindex,nofollow">', 1))
