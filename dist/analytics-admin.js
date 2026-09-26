(function () {
  const api = window.CL_SITE_CONFIG?.API_URL;
  const gate = document.querySelector('#stats-gate');
  const dashboard = document.querySelector('#stats-dashboard');
  const tokenInput = document.querySelector('#stats-token');
  const daysInput = document.querySelector('#stats-days');
  const gateStatus = document.querySelector('#stats-gate-status');
  const logoutButton = document.querySelector('#stats-logout');
  let timer = null;
  let loading = false;

  tokenInput.value = sessionStorage.getItem('clAnalyticsToken') || '';
  document.querySelector('#stats-login-form').addEventListener('submit', (event) => { event.preventDefault(); connect(); });
  document.querySelector('#toggle-token').addEventListener('click', () => {
    const visible = tokenInput.type === 'text'; tokenInput.type = visible ? 'password' : 'text';
    document.querySelector('#toggle-token').textContent = visible ? 'Voir' : 'Masquer';
  });
  document.querySelector('#stats-refresh').addEventListener('click', () => loadStats(true));
  daysInput.addEventListener('change', () => loadStats(true));
  logoutButton.addEventListener('click', logout);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && getToken()) loadStats(false); });
  if (getToken()) connect();

  function getToken() { return tokenInput.value.trim() || sessionStorage.getItem('clAnalyticsToken') || ''; }
  async function connect() {
    const token = tokenInput.value.trim();
    if (!token) { gateStatus.textContent = 'Saisissez votre clé administrateur.'; return; }
    gateStatus.textContent = 'Connexion sécurisée…'; sessionStorage.setItem('clAnalyticsToken', token);
    const ok = await loadStats(true);
    if (ok) { gate.hidden = true; dashboard.hidden = false; logoutButton.hidden = false; startPolling(); }
  }
  function logout() {
    clearInterval(timer); sessionStorage.removeItem('clAnalyticsToken'); tokenInput.value = '';
    dashboard.hidden = true; gate.hidden = false; logoutButton.hidden = true; gateStatus.textContent = '';
  }
  function startPolling() { clearInterval(timer); timer = setInterval(() => { if (!document.hidden) loadStats(false); }, 5000); }
  async function loadStats(manual) {
    const token = getToken(); if (!token || loading) return false; loading = true;
    document.querySelector('#refresh-state').textContent = manual ? 'Actualisation…' : 'Mise à jour en direct…';
    try {
      const response = await fetch(`${api}/api/admin/analytics?days=${daysInput.value}`, {headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Accès impossible');
      render(data); gateStatus.textContent = ''; return true;
    } catch (error) {
      if (error.message === 'Accès refusé') { sessionStorage.removeItem('clAnalyticsToken'); gateStatus.textContent = 'Clé incorrecte. Réinitialisez-la si vous l’avez perdue.'; }
      else gateStatus.textContent = 'Impossible de joindre le service de statistiques.';
      return false;
    } finally { loading = false; document.querySelector('#refresh-state').textContent = 'Actualisation toutes les 5 s'; }
  }

  function render(data) {
    setNumber('active-visitors',data.activeVisitors); setNumber('last-hour-views',data.lastHourViews);
    setNumber('today-views',data.today.views); setNumber('today-visitors',data.today.unique_visitors);
    setNumber('total-views',data.totals.views); setNumber('total-visitors',data.totals.unique_visitors);
    document.querySelector('#tracked-pages').textContent=`${data.pages.length} page${data.pages.length>1?'s':''}`;
    document.querySelector('#last-update').textContent=`Mis à jour à ${new Intl.DateTimeFormat('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(data.generatedAt))}`;
    renderTrend(data.daily); renderPages(data.pages); renderHourly(data.hourly);
    renderRanks('sources-list',data.sources,sourceLabel); renderRanks('devices-list',data.devices,(v)=>v);
    renderRanks('countries-list',data.countries,countryLabel); renderFeed(data.recent);
  }
  function setNumber(id,value){document.querySelector(`#${id}`).textContent=Number(value||0).toLocaleString('fr-FR')}
  function renderTrend(rows){
    const svg=document.querySelector('#trend-chart');
    if(!rows.length){svg.innerHTML='<text x="50%" y="50%" text-anchor="middle" class="chart-empty">Les premières visites apparaîtront ici.</text>';return}
    const width=900,height=280,left=48,right=18,top=24,bottom=42,innerW=width-left-right,innerH=height-top-bottom;
    const max=Math.max(1,...rows.flatMap((r)=>[Number(r.views),Number(r.unique_visitors)]));
    const x=(i)=>left+(rows.length===1?innerW/2:i*innerW/(rows.length-1));const y=(v)=>top+innerH-(Number(v)/max*innerH);
    const viewPoints=rows.map((r,i)=>`${x(i)},${y(r.views)}`).join(' ');const visitorPoints=rows.map((r,i)=>`${x(i)},${y(r.unique_visitors)}`).join(' ');
    const area=`${left},${top+innerH} ${viewPoints} ${x(rows.length-1)},${top+innerH}`;
    const grid=[0,.25,.5,.75,1].map((p)=>`<line x1="${left}" y1="${top+innerH*p}" x2="${width-right}" y2="${top+innerH*p}"/><text x="${left-10}" y="${top+innerH*p+4}" text-anchor="end">${Math.round(max*(1-p))}</text>`).join('');
    const step=Math.max(1,Math.ceil(rows.length/6));const labels=rows.map((r,i)=>i%step===0||i===rows.length-1?`<text x="${x(i)}" y="${height-12}" text-anchor="middle">${shortDate(r.date)}</text>`:'').join('');
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.innerHTML=`<defs><linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22d3ee" stop-opacity=".3"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></linearGradient></defs><g class="chart-grid">${grid}</g><polygon points="${area}" fill="url(#areaBlue)"/><polyline class="chart-line views" points="${viewPoints}"/><polyline class="chart-line visitors" points="${visitorPoints}"/><g class="chart-labels">${labels}</g>`;
  }
  function renderPages(rows){
    const total=Math.max(1,rows.reduce((sum,r)=>sum+Number(r.views),0));
    document.querySelector('#pages-table').innerHTML=rows.length?rows.map((r)=>`<tr><td><span class="page-name">${escapeHtml(pageLabel(r.page))}</span><small>${escapeHtml(r.page)}</small></td><td><b>${formatNumber(r.views)}</b></td><td>${formatNumber(r.unique_visitors)}</td><td><span class="share-bar"><i style="width:${Number(r.views)/total*100}%"></i></span><small>${Math.round(Number(r.views)/total*100)} %</small></td></tr>`).join(''):'<tr><td colspan="4" class="empty-cell">Aucune visite sur cette période.</td></tr>';
  }
  function renderHourly(rows){
    const max=Math.max(1,...rows.map((r)=>Number(r.views)));const now=new Date();const map=new Map(rows.map((r)=>[r.hour,Number(r.views)]));
    const hours=Array.from({length:24},(_,i)=>{const d=new Date(now);d.setUTCMinutes(0,0,0);d.setUTCHours(d.getUTCHours()-(23-i));return d});
    document.querySelector('#hourly-chart').innerHTML=hours.map((d,i)=>{const key=d.toISOString().slice(0,13)+':00:00Z';const value=map.get(key)||0;return `<div title="${value} vue${value>1?'s':''} à ${String(d.getHours()).padStart(2,'0')} h"><i style="height:${Math.max(3,value/max*100)}%"></i>${i%4===3?`<span>${String(d.getHours()).padStart(2,'0')}h</span>`:''}</div>`}).join('');
  }
  function renderRanks(id,rows,labeler){
    const max=Math.max(1,...rows.map((r)=>Number(r.value)));const total=Math.max(1,rows.reduce((sum,r)=>sum+Number(r.value),0));
    document.querySelector(`#${id}`).innerHTML=rows.length?rows.map((r)=>`<div class="rank-row"><div><span>${escapeHtml(labeler(r.label))}</span><b>${formatNumber(r.value)}</b></div><p><i style="width:${Number(r.value)/max*100}%"></i></p><small>${Math.round(Number(r.value)/total*100)} %</small></div>`).join(''):'<p class="empty-message">En attente de données récentes.</p>';
  }
  function renderFeed(rows){document.querySelector('#live-feed').innerHTML=rows.length?rows.map((r)=>`<article><i></i><div><strong>${escapeHtml(pageLabel(r.page))}</strong><p>${escapeHtml(sourceLabel(r.source))} · ${escapeHtml(r.device)} · ${escapeHtml(countryLabel(r.country))}</p></div><time>${relativeTime(r.visited_at)}</time></article>`).join(''):'<p class="empty-message">Les prochaines visites apparaîtront ici en direct.</p>'}
  function pageLabel(path){const labels={'/':'Accueil','/expertise-technique.html':'Expertise technique','/conseil-technique-immobilier.html':'Conseil technique immobilier','/audit-maintenance.html':'Audit maintenance','/securite-erp.html':'Sécurité ERP','/expertise-technique-hotellerie.html':'Expertise hôtellerie','/direction-technique-externalisee.html':'Direction technique externalisée','/mentions-legales.html':'Mentions légales','/confidentialite.html':'Confidentialité'};return labels[path]||decodeURIComponent(String(path).replace(/^\//,'').replace(/\.html$/,'').replace(/-/g,' '))||'Accueil'}
  function sourceLabel(value){return value==='Direct'?'Accès direct':value==='Interne'?'Navigation interne':value}
  function countryLabel(code){if(code==='—')return'Pays non disponible';try{return new Intl.DisplayNames(['fr'],{type:'region'}).of(code)||code}catch{return code}}
  function shortDate(value){return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short'}).format(new Date(`${value}T12:00:00Z`))}
  function relativeTime(value){const seconds=Math.max(0,Math.round((Date.now()-new Date(value).getTime())/1000));if(seconds<10)return'à l’instant';if(seconds<60)return`il y a ${seconds} s`;if(seconds<3600)return`il y a ${Math.floor(seconds/60)} min`;return new Intl.DateTimeFormat('fr-FR',{hour:'2-digit',minute:'2-digit'}).format(new Date(value))}
  function formatNumber(value){return Number(value||0).toLocaleString('fr-FR')}
  function escapeHtml(value){const div=document.createElement('div');div.textContent=String(value??'');return div.innerHTML}
})();
