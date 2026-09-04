    // Load commands (if any) and reviews
    async function loadCommands() {
      try {
        const res = await fetch('commands.json');
        if (!res.ok) return;
        const commands = await res.json();
        const list = document.getElementById('commandsList');
        list.innerHTML = '';
        commands.forEach(cmd => {
          const el = document.createElement('div');
          el.className = 'command';
          el.innerHTML = `<div><strong>/${cmd.name}</strong><div class="meta">${cmd.description || ''}</div></div>`;
          list.appendChild(el);
        });
      } catch (e) {
        console.error('Failed to load commands', e);
      }
    }

    async function loadReviews() {
      const list = document.getElementById('reviewsList');
      if (!list) return;
      list.innerHTML = 'Loading reviews…';
      try {
        const res = await fetch('reviews.json');
        if (!res.ok) { list.innerHTML = '<p class="muted">No reviews found.</p>'; return; }
        const reviews = await res.json();
        renderReviews(reviews);
      } catch (e) {
        console.error('Failed to load reviews', e);
        list.innerHTML = '<p class="muted">Unable to load reviews.</p>';
      }
    }

    function renderReviews(reviews) {
      const list = document.getElementById('reviewsList');
      list.innerHTML = '';
      if (!reviews || reviews.length === 0) {
        list.innerHTML = '<p class="muted">No reviews yet — be the first to add one.</p>';
        return;
      }
      reviews.forEach(r => {
        const el = document.createElement('div');
        el.className = 'command';
        el.innerHTML = `<div><strong>${escapeHtml(r.name)} — ${'★'.repeat(r.rating)}</strong><div class="meta">${escapeHtml(r.text)}</div></div>`;
        list.appendChild(el);
      });
    }

    function escapeHtml(str){
      return String(str).replace(/[&<>\"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s]);
    }

    document.addEventListener('DOMContentLoaded', () => {
      loadCommands();
      loadReviews();
      const year = document.getElementById('year');
      if (year) year.textContent = new Date().getFullYear();

      // simple menu toggle for mobile
      const toggle = document.getElementById('menuToggle');
      const nav = document.getElementById('nav');
      if (toggle && nav) toggle.addEventListener('click', () => nav.classList.toggle('open'));
    });
