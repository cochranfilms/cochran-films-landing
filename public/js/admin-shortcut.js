(function () {
  if (window.__cfAdminShortcut) return;
  window.__cfAdminShortcut = true;

  var SEQUENCE = 'ADMIN';
  var GAP_MS = 2000;
  var buffer = '';
  var lastAt = 0;

  function isTyping(target) {
    if (!target || !target.closest) return false;
    var tag = (target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    return !!target.closest('[contenteditable="true"]');
  }

  function ensureStyles() {
    if (document.getElementById('cf-admin-gate-styles')) return;
    var style = document.createElement('style');
    style.id = 'cf-admin-gate-styles';
    style.textContent = [
      '.cf-admin-gate{position:fixed;inset:0;z-index:100003;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.46);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}',
      '.cf-admin-gate__panel{position:relative;width:min(92vw,340px);padding:32px 28px 28px;background:#fff;color:#1d1d1f;border:1px solid rgba(0,0,0,.08);border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.18);text-align:center;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",Helvetica,Arial,sans-serif}',
      '.cf-admin-gate__close{position:absolute;top:12px;right:12px;width:32px;height:32px;border:0;border-radius:50%;background:#f5f5f7;color:#1d1d1f;font-size:20px;line-height:1;cursor:pointer}',
      '.cf-admin-gate__close:hover{background:#e8e8ed}',
      '.cf-admin-gate__eyebrow{margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#6e6e73}',
      '.cf-admin-gate__panel h2{margin:0 0 20px;font-size:28px;font-weight:650;letter-spacing:-.02em}',
      '.cf-admin-gate__btn{display:inline-flex;align-items:center;justify-content:center;width:100%;min-height:48px;padding:12px 18px;border-radius:8px;background:#1d1d1f;color:#fff;font-size:16px;font-weight:600;text-decoration:none}',
      '.cf-admin-gate__btn:hover{background:#000}',
      '@media (prefers-reduced-motion: no-preference){.cf-admin-gate__panel{animation:cfAdminGateIn 180ms ease-out}}',
      '@keyframes cfAdminGateIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'
    ].join('');
    document.head.appendChild(style);
  }

  function closeGate() {
    var overlay = document.getElementById('cfAdminGate');
    if (!overlay) return;
    overlay.remove();
    if (document.documentElement.hasAttribute('data-cf-admin-scroll')) {
      document.body.style.overflow = document.documentElement.getAttribute('data-cf-admin-scroll') || '';
      document.documentElement.removeAttribute('data-cf-admin-scroll');
    }
    document.removeEventListener('keydown', onEscape, true);
  }

  function onEscape(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeGate();
    }
  }

  function openGate() {
    if (document.getElementById('cfAdminGate')) return;
    ensureStyles();
    var overlay = document.createElement('div');
    overlay.id = 'cfAdminGate';
    overlay.className = 'cf-admin-gate';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'cfAdminGateTitle');
    overlay.innerHTML =
      '<div class="cf-admin-gate__panel">' +
        '<button type="button" class="cf-admin-gate__close" aria-label="Close">&times;</button>' +
        '<p class="cf-admin-gate__eyebrow">Cochran Films</p>' +
        '<h2 id="cfAdminGateTitle">Admin</h2>' +
        '<a class="cf-admin-gate__btn" href="/admin">Open dashboard</a>' +
      '</div>';
    document.documentElement.setAttribute('data-cf-admin-scroll', document.body.style.overflow || '');
    document.body.style.overflow = 'hidden';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) closeGate();
    });
    overlay.querySelector('.cf-admin-gate__close').addEventListener('click', closeGate);
    document.addEventListener('keydown', onEscape, true);
    overlay.querySelector('.cf-admin-gate__btn').focus();
  }

  document.addEventListener('keydown', function (event) {
    if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
    if (document.getElementById('cfAdminGate')) return;
    if (isTyping(event.target)) {
      buffer = '';
      return;
    }
    if (!event.key || event.key.length !== 1) return;
    var now = Date.now();
    if (now - lastAt > GAP_MS) buffer = '';
    lastAt = now;
    buffer = (buffer + event.key.toUpperCase()).slice(-SEQUENCE.length);
    if (buffer === SEQUENCE) {
      buffer = '';
      openGate();
    }
  });
})();
