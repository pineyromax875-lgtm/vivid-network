// Client site script: load commands, reviews, gallery, about; capture client-side errors

async function loadCommands() {
  try {
    const res = await fetch('commands.json');
    if (!res.ok) return;
    const commands = await res.json();
    const list = document.getElementById('commandsList');
    if (!list) return;
    list.innerHTML = '';
    commands.forEach(cmd => {
      const el = document.createElement('div');
      el.className = 'command';
      el.innerHTML = `<div><strong>/${cmd.name}</strong><div class="meta">${cmd.description || ''}</div></div>`;
      list.appendChild(el);
    });
  } catch (e) {
    // don't break page if commands fail
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

function renderReviews(reviews){
  const list = document.getElementById('reviewsList');
  if(!list) return;
  list.innerHTML = '';
  if(!Array.isArray(reviews) || reviews.length === 0){ list.innerHTML = '<p class="muted">No reviews yet.</p>'; return; }
  reviews.forEach(r => {
    const el = document.createElement('div');
    el.className = 'command';
    el.innerHTML = `<div><strong>${escapeHtml(r.name)} — ${'★'.repeat(r.rating||5)}</strong><div class="meta">${escapeHtml(r.text||'')}</div></div>`;
    list.appendChild(el);
  });
}

async function loadGallery(){
  const list = document.getElementById('galleryList');
  if(!list) return;
  list.innerHTML = 'Loading gallery…';
  try{
    const res = await fetch('gallery.json');
    if(!res.ok){ list.innerHTML = '<p class="muted">No gallery items.</p>'; return; }
    const gallery = await res.json();
    renderGallery(gallery);
  }catch(e){ console.error('Failed to load gallery', e); list.innerHTML = '<p class="muted">Unable to load gallery.</p>'; }
}

function renderGallery(gallery){
  const list = document.getElementById('galleryList');
  if(!list) return;
  list.innerHTML = '';
  if(!gallery || gallery.length === 0){ list.innerHTML = '<p class="muted">No images yet.</p>'; return; }
  gallery.forEach(item => {
    const el = document.createElement('div');
    el.className = 'gallery-item';
    const img = document.createElement('img');
    img.src = item.url;
    img.alt = item.caption || 'Gallery image';
    img.loading = 'lazy';
    img.style.width = '100%';
    img.style.height = '160px';
    img.style.objectFit = 'cover';
    const caption = document.createElement('div');
    caption.className = 'g-caption';
    caption.textContent = item.caption || '';
    const date = document.createElement('div');
    date.className = 'muted';
    date.style.fontSize = '0.9em';
    date.textContent = item.date || '';
    el.appendChild(img);
    el.appendChild(caption);
    el.appendChild(date);
    list.appendChild(el);
  });
}

async function loadAbout(){
  const el = document.getElementById('aboutContent');
  if(!el) return;
  el.innerHTML = 'Loading about content…';
  try{
    const res = await fetch('about.json');
    if(!res.ok){ el.innerHTML = '<p class="muted">No about content.</p>'; return; }
    const about = await res.json();
    // If the about content is HTML, we trust only when sanitized by DOMPurify (included in page)
    if(window.DOMPurify && about && about.html){
      el.innerHTML = DOMPurify.sanitize(about.html);
    } else {
      el.innerHTML = about.html || about.text || '<p class="muted">No about content.</p>';
    }
  }catch(e){ console.error('Failed to load about', e); el.innerHTML = '<p class="muted">Unable to load about content.</p>'; }
}

function escapeHtml(str){
  if (str === undefined || str === null) return '';
  return String(str).replace(/[&<>\"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s]);
}

function submitReviewClient(name, rating, text){
  const list = document.getElementById('reviewsList');
  if(!list) return;
  const review = { name, rating: parseInt(rating,10), text, date: new Date().toISOString().split('T')[0] };
  const el = document.createElement('div');
  el.className = 'command';
  el.innerHTML = `<div><strong>${escapeHtml(review.name)} — ${'★'.repeat(review.rating)}</strong><div class="meta">${escapeHtml(review.text)}</div></div>`;
  list.insertBefore(el, list.firstChild);
  try{
    const pending = JSON.parse(localStorage.getItem('pendingReviews') || '[]');
    pending.unshift(review);
    localStorage.setItem('pendingReviews', JSON.stringify(pending));
  }catch(e){ console.error('Failed to save pending review', e); }
}

function buildIssueLink(name, rating, text){
  const title = encodeURIComponent(`Review from ${name} — ${rating}★`);
  const body = encodeURIComponent(`**Name:** ${name}\n**Rating:** ${rating}\n\n${text}`);
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/new?title=${title}&body=${body}`;
}

// Capture JS errors and store locally so staff can review them in the dashboard
function captureClientError(evtOrMsg, source, lineno, colno, error){
  try{
    let e = { date: new Date().toISOString() };
    if (typeof evtOrMsg === 'string'){
      e.message = evtOrMsg; e.source = source; e.lineno = lineno; e.colno = colno; e.stack = error && error.stack ? error.stack : null;
    } else if (evtOrMsg && evtOrMsg.message){
      // window.onerror or similar object
      const ev = evtOrMsg;
      e.message = ev.message || 'Error';
      e.source = ev.filename || source || location.href;
      e.lineno = ev.lineno || lineno || 0;
      e.colno = ev.colno || colno || 0;
      e.stack = (ev.error && ev.error.stack) ? ev.error.stack : (ev.stack || ev.stacktrace || null);
    } else if (evtOrMsg && evtOrMsg.reason){
      // unhandledrejection
      e.message = 'Unhandled Promise Rejection: ' + (evtOrMsg.reason && evtOrMsg.reason.message ? evtOrMsg.reason.message : String(evtOrMsg.reason));
      e.stack = (evtOrMsg.reason && evtOrMsg.reason.stack) ? evtOrMsg.reason.stack : null;
    } else {
      e.message = 'Unknown error';
    }
    const stored = JSON.parse(localStorage.getItem('pendingErrors') || '[]');
    stored.unshift(e);
    localStorage.setItem('pendingErrors', JSON.stringify(stored));
  }catch(ex){ console.error('captureClientError failed', ex); }
}

window.addEventListener('error', function(ev){ try{ captureClientError(ev); }catch(e){ console.error(e); } });
window.addEventListener('unhandledrejection', function(ev){ try{ captureClientError(ev); }catch(e){ console.error(e); } });

// Theme handling
function getSavedTheme(){ return localStorage.getItem('theme') || 'dark'; }
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  if(theme === 'light'){
    document.body.style.background = 'linear-gradient(180deg,#ffffff 0%, #f5f7fb 60%)';
    document.body.style.color = '#0b1220';
  } else {
    document.body.style.background = 'linear-gradient(180deg,#020617 0%, var(--bg-dark) 60%)';
    document.body.style.color = '#e7f0fb';
  }
  localStorage.setItem('theme', theme);
}
function toggleTheme(){ const current = getSavedTheme(); applyTheme(current === 'dark' ? 'light' : 'dark'); }

// Init
document.addEventListener('DOMContentLoaded', () => {
  try{
    loadCommands();
    loadReviews();
    loadGallery();
    loadAbout();
    const year = document.getElementById('year'); if (year) year.textContent = new Date().getFullYear();

    applyTheme(getSavedTheme());
    const themeBtn = document.getElementById('themeToggle'); if(themeBtn) themeBtn.addEventListener('click', toggleTheme);

    const submitBtn = document.getElementById('submitReviewBtn');
    if (submitBtn){
      submitBtn.addEventListener('click', () => {
        const nameEl = document.getElementById('r-name');
        const textEl = document.getElementById('r-text');
        const ratingEl = document.getElementById('r-rating');
        const name = nameEl ? nameEl.value.trim() : '';
        const rating = ratingEl ? ratingEl.value : '5';
        const text = textEl ? textEl.value.trim() : '';
        if(!name || !text){ alert('Please provide name and review text.'); return; }
        submitReviewClient(name, rating, text);
        const issueLink = buildIssueLink(name, rating, text);
        const issueAnchor = document.getElementById('issueLink');
        if (issueAnchor){ issueAnchor.href = issueLink; issueAnchor.textContent = 'Create GitHub Issue'; }
        if(nameEl) nameEl.value=''; if(textEl) textEl.value='';
        alert('Thanks! Your review is saved locally for staff review. If you want it published now, click the Create GitHub Issue link.');
      });
    }

    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');
    if (toggle && nav) toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }catch(e){ console.error('Init failed', e); }
});
