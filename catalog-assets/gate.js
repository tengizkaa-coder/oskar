// Client-side access rules, preserving the main site's search-entry restriction.
(function () {
  var ua = navigator.userAgent || '';
  var bot = /Googlebot|Google-InspectionTool|GoogleOther|AdsBot-Google|YandexBot|YandexMobileBot|YandexAccessibilityBot|YandexMetrika|YandexWebmaster|YandexImages/i.test(ua);
  var phone = /Android.+Mobile|iPhone|iPod|Windows Phone|Mobile Safari|Mobile/i.test(ua) && !/iPad|Tablet/i.test(ua);
  var preview = /^\/test\/catalog(?:\/|$)/.test(location.pathname);
  var search = false, sameSite = false, authorized = false;
  try {
    var ref = new URL(document.referrer), host = ref.hostname.toLowerCase();
    search = /(^|\.)(google\.[a-z.]+|yandex\.[a-z.]+|ya\.ru)$/.test(host) || /^(www\.)?(maps\.google|yandex)\./.test(host);
    sameSite = ref.origin === location.origin;
  } catch (_) {}
  try { authorized = sessionStorage.getItem('alco-search-entry') === '1'; } catch (_) {}
  if (phone && search) { try { sessionStorage.setItem('alco-search-entry', '1'); } catch (_) {} }
  if (preview || bot || (phone && (search || (sameSite && authorized)))) return;
  document.documentElement.setAttribute('data-blocked', '1');
  document.addEventListener('DOMContentLoaded', function () {
    var d = document.createElement('div'); d.id = 'blocked';
    if (phone) d.textContent = 'Ошибка загрузки страницы.';
    document.body.appendChild(d);
  });
})();
