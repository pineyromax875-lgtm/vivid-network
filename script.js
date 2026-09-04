// Basic interactivity: load commands.json, mobile menu, invite button year
document.addEventListener('DOMContentLoaded', () => {
  // Insert current year
  document.getElementById('year').textContent = new Date().getFullYear();

  // Menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  menuToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
  });

  // Load commands from JSON
  const commandsList = document.getElementById('commandsList');
  fetch('commands.json')
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(list => {
      if (!Array.isArray(list) || list.length === 0) {
        commandsList.innerHTML = '<p class="muted">No commands found. Edit commands.json to add commands.</p>';
        return;
      }
      const frag = document.createDocumentFragment();
      list.forEach(cmd => {
        const el = document.createElement('div');
        el.className = 'command';
        el.innerHTML = `<div>
                          <strong>${cmd.trigger}</strong>
                          <div class="meta">${cmd.description || ''}</div>
                        </div>
                        <div class="meta">${cmd.category || ''}</div>`;
        frag.appendChild(el);
      });
      commandsList.innerHTML = '';
      commandsList.appendChild(frag);
    })
    .catch(() => {
      commandsList.innerHTML = '<p class="muted">Unable to load commands.json (ensure the file exists and is valid JSON).</p>';
    });

  // Replace placeholder invite hrefs (optional convenience)
  const inviteBtns = document.querySelectorAll('a[href="BOT_INVITE_LINK"]');
  const serverBtns = document.querySelectorAll('a[href="DISCORD_SERVER_INVITE"]');
  // If you want automatic replacement from environment, add logic here.
});
