const menuButton = document.querySelector('[aria-controls="mobile-nav"]');
const menu = document.querySelector('#mobile-nav');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menu.classList.toggle('max-h-0', !open);
  menu.classList.toggle('opacity-0', !open);
  menu.classList.toggle('preview-menu-open', open);
});
