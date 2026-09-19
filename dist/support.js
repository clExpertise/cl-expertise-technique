(function () {
  const cfg = window.CL_CONFIG || {};
  const launcher = document.querySelector('#support-launcher');
  const panel = document.querySelector('#support-panel');
  if (!cfg.SUPPORT_ENABLED) { launcher.hidden = true; panel.hidden = true; return; }
  const close = document.querySelector('#support-close');
  const form = document.querySelector('#support-form');
  const input = document.querySelector('#support-input');
  const messages = document.querySelector('#support-messages');
  const typing = document.querySelector('#support-typing');
  const ticketButton = document.querySelector('#support-ticket');
  const ticketDialog = document.querySelector('#ticket-dialog');
  const ticketForm = document.querySelector('#ticket-form');
  const ticketStatus = document.querySelector('#ticket-status');
  const history = [];
  let sessionId = sessionStorage.getItem('clSupportSession') || crypto.randomUUID();
  sessionStorage.setItem('clSupportSession', sessionId);

  function addMessage(role, text, extraClass = '') {
    const message = document.createElement('div');
    message.className = `chat-message ${role === 'user' ? 'user' : ''} ${extraClass}`;
    message.textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
    if (role === 'user' || role === 'assistant') history.push({ role, content: text.slice(0, 1200) });
  }

  function toggle(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) input.focus();
  }

  launcher.addEventListener('click', () => toggle(panel.hidden));
  close.addEventListener('click', () => toggle(false));
  addMessage('assistant', 'Bonjour, je suis l’assistant CL Expertise Technique. Je peux vous orienter sur les prestations, les formats d’intervention et la prise de contact. Comment puis-je vous aider ?');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addMessage('user', text);
    input.value = '';
    typing.hidden = false;
    form.querySelector('button').disabled = true;
    try {
      const response = await fetch(`${cfg.API_URL}/api/chat`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ message:text, sessionId, history:history.slice(-10) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur du service');
      addMessage('assistant', data.reply, data.needsHuman ? 'system' : '');
      if (data.needsHuman) addMessage('assistant', 'Je peux transmettre votre demande au support humain. Utilisez « Créer un ticket » ci-dessous.', 'system');
    } catch (error) {
      addMessage('assistant', 'Notre assistant automatique est momentanément indisponible. Vous pouvez tout de même créer un ticket pour transmettre votre demande.', 'system');
    } finally {
      typing.hidden = true;
      form.querySelector('button').disabled = false;
      input.focus();
    }
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
  });

  ticketButton.addEventListener('click', () => ticketDialog.showModal());
  ticketDialog.querySelector('.dialog-close').addEventListener('click', () => ticketDialog.close());
  ticketForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    ticketStatus.textContent = 'Transmission en cours…';
    const payload = Object.fromEntries(new FormData(ticketForm).entries());
    payload.sessionId = sessionId;
    payload.history = history.slice(-12);
    payload.turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value || '';
    try {
      const response = await fetch(`${cfg.API_URL}/api/tickets`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Création impossible');
      const emailNote = data.emailSent ? ' Vous recevrez une réponse à l’adresse indiquée.' : ' Le ticket est enregistré ; la notification e-mail est temporairement différée.';
      ticketStatus.textContent = `Votre demande a bien été transmise. Numéro : ${data.ticketNumber}.${emailNote}`;
      addMessage('assistant', ticketStatus.textContent, 'system');
      ticketForm.reset();
    } catch (error) {
      ticketStatus.textContent = error.message || 'Impossible de créer le ticket. Réessayez dans quelques instants.';
    }
  });

  if (cfg.TURNSTILE_SITE_KEY) {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true; script.defer = true;
    script.onload = () => turnstile.render('#turnstile-container', {sitekey:cfg.TURNSTILE_SITE_KEY,theme:'dark'});
    document.head.appendChild(script);
  }
})();
