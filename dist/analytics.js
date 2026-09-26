(function () {
  const endpoint = window.CL_SITE_CONFIG?.API_URL;
  if (!endpoint || location.protocol === 'file:' || document.querySelector('meta[name="robots"][content*="noindex"]')) return;
  const page = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '');
  let source = '';
  try { source = document.referrer ? new URL(document.referrer).hostname : ''; } catch {}
  fetch(`${endpoint}/api/analytics/hit`, {
    method: 'POST',
    headers: {'Content-Type':'text/plain;charset=UTF-8'},
    body: JSON.stringify({page, source}),
    keepalive: true,
    credentials: 'omit'
  }).catch(() => {});
})();
