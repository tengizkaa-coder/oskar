/* Client-side access rules, matching the original site. Not security. */
(function () {
  var ua = navigator.userAgent || '';
  var bot = /Googlebot|Google-InspectionTool|GoogleOther|AdsBot-Google|YandexBot|YandexMobileBot|YandexAccessibilityBot|YandexMetrika|YandexWebmaster|YandexImages/i.test(ua);
  var phone = /Android.+Mobile|iPhone|iPod|Windows Phone|Mobile Safari|Mobile/i.test(ua) && !/iPad|Tablet/i.test(ua);
  var preview = /\/test(?:\/|$)/i.test(location.pathname);
  var search = false, sameSite = false;
  try {
    var ref = new URL(document.referrer);
    var host = ref.hostname.toLowerCase();
    search = /(^|\.)(google\.[a-z.]+|yandex\.[a-z.]+|ya\.ru)$/.test(host) || /^(www\.)?(maps\.google|yandex)\./.test(host);
    sameSite = ref.origin === location.origin;
  } catch (_) {}
  // Internal pages need same-site navigation to work after a valid entry; no stored bypass.
  var isCatalog = /\/catalog(?:\/|$)/i.test(location.pathname);
  var allowed = preview || bot || (phone && (search || (isCatalog && sameSite)));
  document.documentElement.classList.add(allowed ? 'access-allowed' : 'access-denied');
})();
