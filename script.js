// Load commands (if any), reviews, gallery, and about; capture client-side errors
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
  list.innerHTML = '';
  if(!gallery || gallery.length === 0){ list.innerHTML = '<p class="muted">No images yet.</p>'; return; }
  gallery.forEach(item => {
    const el = document.createElement('div');
    el.className = 'gallery-item';
    const img = document.createElement('img');
    img.src = item.url;
    img.alt = item.caption || 'Gallery image';
    img.loading = 'lazy';
    img.width = 800;
    img.height = 450;
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
    el.innerHTML = about.html || about.text || '<p class="muted">No about content.</p>';
  }catch(e){ console.error('Failed to load about', e); el.innerHTML = '<p class="muted">Unable to load about content.</p>'; }
}

function escapeHtml(str){
  return String(str).replace(/[&<>\"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s]);
}

function submitReviewClient(name, rating, text){
  const list = document.getElementById('reviewsList');
  const review = { name, rating: parseInt(rating,10), text, date: new Date().toISOString().split('T')[0] };
  // show immediately to submitter
  const el = document.createElement('div');
  el.className = 'command';
  el.innerHTML = `<div><strong>${escapeHtml(review.name)} — ${'★'.repeat(review.rating)}</strong><div class="meta">${escapeHtml(review.text)}</div></div>`;
  list.insertBefore(el, list.firstChild);
  // store pending review locally so staff can pick it up
  const pending = JSON.parse(localStorage.getItem('pendingReviews') || '[]');
  pending.unshift(review);
  localStorage.setItem('pendingReviews', JSON.stringify(pending));
}

function buildIssueLink(name, rating, text){
  const title = encodeURIComponent(`Review from ${name} — ${rating}★`);
  const body = encodeURIComponent(`**Name:** ${name}\n**Rating:** ${rating}\n\n${text}`);
  return `https://github.com/pineyromax875-lgtm/vivid-network/issues/new?title=${title}&body=${body}`;
}

// Capture JS errors and store locally so staff can review them in the dashboard
function captureClientError(evtOrMsg, source, lineno, colno, error){
  let e = {};
  if (typeof evtOrMsg === 'string'){
    e = { message: evtOrMsg, source, lineno, colno, stack: error && error.stack ? error.stack : null, date: new Date().toISOString() };
  } else if (evtOrMsg && evtOrMsg.message){
    const ev = evtOrMsg;
    e = { message: ev.message, source: ev.filename || source || location.href, lineno: ev.lineno || lineno, colno: ev.colno || colno, stack: ev.error && ev.error.stack ? ev.error.stack : (ev.stack || null), date: new Date().toISOString() };
  }
  const stored = JSON.parse(localStorage.getItem('pendingErrors') || '[]');
  stored.unshift(e);
  localStorage.setItem('pendingErrors', JSON.stringify(stored));
}

window.addEventListener('error', function(ev){ captureClientError(ev); });
window.addEventListener('unhandledrejection', function(ev){ captureClientError({ message: 'Unhandled Promise Rejection: ' + (ev.reason && ev.reason.message ? ev.reason.message : String(ev.reason)), filename: ev.filename || location.href, lineno: ev.lineno, colno: ev.colno, stack: ev.reason && ev.reason.stack ? ev.reason.stack : null }); });

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

function toggleTheme(){
  const current = getSavedTheme();
  applyTheme(current === 'dark' ? 'light' : 'dark');
}


document.addEventListener('DOMContentLoaded', () => {
  loadCommands();
  loadReviews();
  loadGallery();
  loadAbout();
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // theme toggle init
  applyTheme(getSavedTheme());
  const themeBtn = document.getElementById('themeToggle');
  if(themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // review form
  const submitBtn = document.getElementById('submitReviewBtn');
  if (submitBtn){
    submitBtn.addEventListener('click', () => {
      const name = document.getElementById('r-name').value.trim();
      const rating = document.getElementById('r-rating').value;
      const text = document.getElementById('r-text').value.trim();
      if(!name || !text){ alert('Please provide name and review text.'); return; }
      submitReviewClient(name, rating, text);
      // prepare issue link
      const issueLink = buildIssueLink(name, rating, text);
      const issueAnchor = document.getElementById('issueLink');
      if (issueAnchor){ issueAnchor.href = issueLink; issueAnchor.textContent = 'Create GitHub Issue'; }
      document.getElementById('r-name').value=''; document.getElementById('r-text').value='';
      alert('Thanks! Your review is saved locally for staff review. If you want it published now, click the Create GitHub Issue link.');
    });
  }

  // simple menu toggle for mobile
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  if (toggle && nav) toggle.addEventListener('click', () => nav.classList.toggle('open'));
});
