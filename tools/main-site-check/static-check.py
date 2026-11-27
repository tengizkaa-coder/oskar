#!/usr/bin/env python3
"""Verify main and preview page links and the pre-click contact markup."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import json
ROOT = Path(__file__).resolve().parents[2]
class Page(HTMLParser):
    def __init__(self): super().__init__(); self.links=[]; self.attrs=[]; self.text=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs); self.attrs.extend(v for v in a.values() if v)
        if tag == 'a' and a.get('href','').startswith('/'): self.links.append(a['href'])
    def handle_data(self, data): self.text.append(data)
files=[ROOT/'index.html', ROOT/'test.html', *(ROOT/'catalog').rglob('*.html'), *(ROOT/'test').rglob('*.html')]
for file in files:
    page=Page(); page.feed(file.read_text(encoding='utf8'))
    assert not any('tel:' in a.lower() for a in page.attrs), file
    assert not any('095-95-99' in x or '74950959599' in x for x in page.attrs+page.text), file
    for link in page.links:
        path=urlsplit(link).path; target=ROOT/path.lstrip('/')
        if path.endswith('/'): target=target/'index.html'
        assert target.is_file(), (file,link)
        if file.is_relative_to(ROOT/'test/catalog'): assert path != '/' and not path.startswith('/catalog/'), (file,link)
print(f'OK: {len(files)} main and test pages: no number or tel links in markup; local links resolve')
