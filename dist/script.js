const catalogueGrid = document.querySelector('#catalogue-grid');
const missionDialog = document.querySelector('#mission-dialog');
const catalogue = window.CL_CATALOGUE || [];

function renderCatalogue(filter = 'all') {
  catalogueGrid.innerHTML = '';
  catalogue.filter((mission) => filter === 'all' || mission.category === filter).forEach((mission) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'mission-card';
    card.dataset.category = mission.category;
    card.innerHTML = `<span>${String(mission.id).padStart(2, '0')} · ${mission.label}</span><h3>${mission.title}</h3><p>${mission.description}</p><em>${mission.format} · Voir la fiche →</em>`;
    card.addEventListener('click', () => openMission(mission));
    catalogueGrid.appendChild(card);
  });
}

function openMission(mission) {
  document.querySelector('#mission-dialog-category').textContent = `${String(mission.id).padStart(2, '0')} · ${mission.label}`;
  document.querySelector('#mission-dialog-title').textContent = mission.title;
  document.querySelector('#mission-dialog-description').textContent = mission.description;
  document.querySelector('#mission-dialog-format').textContent = mission.format;
  document.querySelector('#mission-dialog-deliverable').textContent = mission.deliverable;
  document.querySelector('#mission-dialog-contact').href = `mailto:cl.expertise.technique@gmail.com?subject=${encodeURIComponent(`Mission ${String(mission.id).padStart(2, '0')} — ${mission.title}`)}`;
  missionDialog.showModal();
}

missionDialog.querySelector('.dialog-close').addEventListener('click', () => missionDialog.close());
missionDialog.addEventListener('click', (event) => { if (event.target === missionDialog) missionDialog.close(); });

document.querySelectorAll('.filter').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector('.filter.active')?.classList.remove('active');
    button.classList.add('active');
    renderCatalogue(button.dataset.filter);
  });
});

renderCatalogue();
