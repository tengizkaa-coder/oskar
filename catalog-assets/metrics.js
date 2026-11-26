/* Yandex Metrika for the public main site, not previews or blocked visits. */
(() => {
  const path = location.pathname;
  if (/^\/test(?:\.html|\/|$)/i.test(path) || document.documentElement.hasAttribute('data-blocked')) return;
  const ua = navigator.userAgent || '';
  if (/Googlebot|Google-InspectionTool|GoogleOther|AdsBot-Google|YandexBot|YandexMobileBot|YandexAccessibilityBot|YandexMetrika|YandexWebmaster|YandexImages/i.test(ua)) return;

  (function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j=0;j<document.scripts.length;j++) { if(document.scripts[j].src===r) return; }
    k=e.createElement(t); a=e.getElementsByTagName(t)[0]; k.async=1; k.src=r; a.parentNode.insertBefore(k,a);
  })(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=114685862','ym');
  window.ym(114685862, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:'dataLayer', referrer:document.referrer, url:location.href, accurateTrackBounce:true, trackLinks:true});

  document.addEventListener('click', function(event) {
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!anchor) return;
    const href = anchor.getAttribute('href') || '';
    if (/^tel:/i.test(href)) window.ym(114685862, 'reachGoal', 'call_click');
    else if (/^https:\/\/(?:www\.)?t\.me\/alkomsk_shop_bot(?:[/?#]|$)/i.test(anchor.href)) window.ym(114685862, 'reachGoal', 'telegram_click');
  }, true);
})();
