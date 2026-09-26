(function () {
  const api = window.CL_SITE_CONFIG?.API_URL;
  const tokenInput = document.querySelector('#stats-token');
  const daysInput = document.querySelector('#stats-days');
  const status = document.querySelector('#stats-status');
  const content = document.querySelector('#stats-content');
  tokenInput.value = sessionStorage.getItem('clAnalyticsToken') || '';

  document.querySelector('#stats-load').addEventListener('click', loadStats);
  daysInput.addEventListener('change', () => { if (tokenInput.value) loadStats(); });

  async function loadStats() {
    const token = tokenInput.value.trim();
    if (!token) { status.textContent = 'Saisissez votre clé administrateur.'; return; }
    status.textContent = 'Chargement…'; content.hidden = true;
    try {
      const response = await fetch(`${api}/api/admin/analytics?days=${daysInput.value}`, {headers:{Authorization:`Bearer ${token}`}});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Accès impossible');
      sessionStorage.setItem('clAnalyticsToken', token);
      render(data); status.textContent = `Période affichée : ${data.periodDays} jours.`; content.hidden = false;
    } catch (error) { status.textContent = error.message === 'Accès refusé' ? 'Clé incorrecte.' : 'Impossible de charger les statistiques.'; }
  }

  function render(data) {
    document.querySelector('#total-views').textContent = Number(data.totals.views).toLocaleString('fr-FR');
    document.querySelector('#total-visitors').textContent = Number(data.totals.unique_visitors).toLocaleString('fr-FR');
    document.querySelector('#total-pages').textContent = data.pages.length;
    const max = Math.max(1, ...data.daily.map((d) => Number(d.views)));
    document.querySelector('#daily-chart').innerHTML = data.daily.length ? data.daily.map((d) => `<div class="chart-row"><time>${formatDate(d.date)}</time><span><i style="width:${Math.max(2,Number(d.views)/max*100)}%"></i></span><b>${d.views}</b></div>`).join('') : '<p>Aucune visite enregistrée sur cette période.</p>';
    document.querySelector('#pages-table').innerHTML = data.pages.length ? data.pages.map((p) => `<tr><td>${escapeHtml(pageLabel(p.page))}</td><td>${p.views}</td><td>${p.unique_visitors}</td></tr>`).join('') : '<tr><td colspan="3">Aucune donnée pour le moment.</td></tr>';
  }
  function formatDate(value) { return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short'}).format(new Date(`${value}T12:00:00Z`)); }
  function pageLabel(path) { return path === '/' ? 'Accueil' : decodeURIComponent(path.replace(/^\//,'').replace(/\.html$/,'').replace(/-/g,' ')); }
  function escapeHtml(value) { const div=document.createElement('div'); div.textContent=value; return div.innerHTML; }
})();
