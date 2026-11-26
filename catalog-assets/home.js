// The same homepage is available at /test.html and /test/; keep all catalog links in the preview tree.
(() => {
  if (!/^\/test(?:\.html|\/(?:index\.html)?)?$/i.test(location.pathname)) return;
  document.querySelectorAll('.catalog-page-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('/catalog/')) link.setAttribute('href', '/test' + href);
  });
  const logo = document.querySelector('.logo');
  if (logo) logo.setAttribute('href', '/test/');
})();
