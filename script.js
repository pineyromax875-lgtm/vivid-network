// Load commands (if any), reviews, and capture client-side errors
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


document.addEventListener('DOMContentLoaded', () => {
  loadCommands();
  loadReviews();
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

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
