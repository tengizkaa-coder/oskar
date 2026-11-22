const search = document.querySelector('#search');
const cards = [...document.querySelectorAll('.card')];
const sections = [...document.querySelectorAll('.category')];
search.addEventListener('input', () => {
  const term = search.value.trim().toLocaleLowerCase('ru');
  let visible = 0;
  for (const card of cards) {
    const matches = card.dataset.name.toLocaleLowerCase('ru').includes(term);
    card.hidden = !matches;
    if (matches) visible++;
  }
  for (const section of sections) section.hidden = !section.querySelector('.card:not([hidden])');
  document.querySelector('#empty').hidden = visible !== 0;
});
