/* The only source of the main site's contact number. */
(() => {
  const PHONE = '+7 (495) 095-95-99';
  let opener = null;
  let dialog = null;
  document.addEventListener('click', event => {
    const trigger = event.target instanceof Element && event.target.closest('.order-trigger');
    if (!trigger || document.documentElement.hasAttribute('data-blocked')) return;
    event.preventDefault();
    if (dialog) return;
    opener = trigger;
    dialog = document.createElement('dialog');
    dialog.className = 'order-dialog';
    dialog.setAttribute('aria-labelledby', 'order-title');
    dialog.innerHTML = '<div class="order-dialog-head"><h2 id="order-title">Связаться с нами</h2><button type="button" class="order-close" aria-label="Закрыть">×</button></div><p class="order-number"></p><div class="order-dialog-actions"><a class="order-call" href="#">Позвонить</a><button type="button" class="order-copy">Скопировать номер</button><button type="button" class="order-dismiss">Закрыть</button></div><p class="order-copy-status" role="status" aria-live="polite"></p>';
    dialog.querySelector('.order-number').textContent = PHONE;
    const call = dialog.querySelector('.order-call');
    call.href = 'tel:' + PHONE.replace(/[^+\d]/g, '');
    const current = dialog;
    function close() { if (current.open) current.close(); }
    current.querySelector('.order-close').addEventListener('click', close);
    current.querySelector('.order-dismiss').addEventListener('click', close);
    current.addEventListener('click', e => { if (e.target === current) close(); });
    current.addEventListener('close', () => { current.remove(); dialog = null; if (opener && opener.isConnected) opener.focus(); opener = null; });
    current.querySelector('.order-copy').addEventListener('click', async () => {
      const status = current.querySelector('.order-copy-status');
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('clipboard unavailable');
        await navigator.clipboard.writeText(PHONE);
        status.textContent = 'Номер скопирован';
      } catch (_) {
        status.textContent = 'Не удалось скопировать. Выделите номер и скопируйте вручную.';
      }
    });
    document.body.appendChild(current);
    current.showModal();
    call.focus();
  });
})();
