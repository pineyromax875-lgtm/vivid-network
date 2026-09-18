// Admin client: uses the server session API; no GitHub token is ever collected in the browser.
(() => {
  'use strict';
  const API_BASE = window.VIVID_API_BASE || '';
  const TOKEN_KEY = 'vivid_admin_token';
  const $ = id => document.getElementById(id);
  let token = sessionStorage.getItem(TOKEN_KEY) || '';
  let reviews = [], gallery = [], about = {}, errors = [];

  async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) { token = ''; sessionStorage.removeItem(TOKEN_KEY); throw new Error('Session expired. Please log in again.'); }
    if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
    return body;
  }

  const message = text => { const el = $('loginMsg') || $('saveMsg'); if (el) el.textContent = text; };
  const toast = text => { if (typeof window.showToast === 'function') window.showToast(text); else message(text); };
  const today = () => new Date().toISOString().slice(0, 10);

  async function loadData() {
    [reviews, gallery, about, errors] = await Promise.all([
      api('/api/data/reviews.json').then(r => r.data).catch(() => []),
      api('/api/data/gallery.json').then(r => r.data).catch(() => []),
      api('/api/data/about.json').then(r => r.data).catch(() => ({})),
      api('/api/data/errors.json').then(r => r.data).catch(() => [])
    ]);
    render();
  }

  function render() {
    const reviewList = $('adminReviews');
    if (reviewList) reviewList.innerHTML = reviews.map((r, i) => `<div class="command"><div><strong>${escapeHTML(r.name || 'Review')} — ${'★'.repeat(Number(r.rating) || 5)}</strong><div class="meta">${escapeHTML(r.text || '')}</div><div class="meta">${escapeHTML(r.date || '')}</div></div><button class="btn ghost" data-delete-review="${i}">Delete</button></div>`).join('') || '<p class="muted">No reviews.</p>';
    const galleryList = $('adminGallery');
    if (galleryList) galleryList.innerHTML = gallery.map((g, i) => `<div class="command"><div><strong>${escapeHTML(g.caption || 'Image')}</strong><div class="meta">${escapeHTML(g.url || '')}</div></div><button class="btn ghost" data-delete-gallery="${i}">Delete</button></div>`).join('') || '<p class="muted">No gallery items.</p>';
    const editor = $('aboutEditor'); if (editor && document.activeElement !== editor) editor.value = about.html || about.text || '';
    const errorsList = $('errorsList'); if (errorsList) errorsList.textContent = errors.length ? JSON.stringify(errors, null, 2) : 'No errors reported.';
  }

  function escapeHTML(value) { const el = document.createElement('span'); el.textContent = String(value ?? ''); return el.innerHTML; }
  async function save(name, data) { await api(`/api/data/${name}`, { method: 'POST', body: JSON.stringify({ data }) }); toast(`${name} saved.`); }

  async function login() {
    const passcode = (($('passcode') || {}).value || '').trim();
    if (!passcode) return message('Enter the staff passcode.');
    try {
      const result = await api('/api/auth', { method: 'POST', body: JSON.stringify({ passcode }) });
      token = result.token; sessionStorage.setItem(TOKEN_KEY, token);
      const loginArea = document.querySelector('.admin-login') || $('loginSection'); if (loginArea) loginArea.style.display = 'none';
      message('Signed in securely.'); await loadData();
    } catch (error) { message(error.message); }
  }

  function wire() {
    $('loginBtn')?.addEventListener('click', login);
    $('passcode')?.addEventListener('keydown', event => { if (event.key === 'Enter') login(); });
    $('addReviewBtn')?.addEventListener('click', async () => { const name = prompt('Reviewer name'); const text = prompt('Review text'); if (!name || !text) return; reviews.unshift({ name, text, rating: 5, date: today() }); await save('reviews.json', reviews); render(); });
    $('addGalleryBtn')?.addEventListener('click', async () => { const url = ($('g-url')?.value || '').trim(); const caption = ($('g-caption')?.value || '').trim(); if (!url) return toast('Enter an image URL.'); gallery.unshift({ url, caption, date: today() }); await save('gallery.json', gallery); render(); });
    $('saveAboutBtn')?.addEventListener('click', async () => { const html = $('aboutEditor')?.value || ''; await save('about.json', { html }); about = { html }; render(); });
    $('exportBtn')?.addEventListener('click', () => download(reviews, 'reviews.json'));
    $('exportErrorsBtn')?.addEventListener('click', () => download(errors, 'errors.json'));
    document.addEventListener('click', async event => {
      const review = event.target.closest('[data-delete-review]'); const image = event.target.closest('[data-delete-gallery]');
      if (review && confirm('Delete this review?')) { reviews.splice(Number(review.dataset.deleteReview), 1); await save('reviews.json', reviews); render(); }
      if (image && confirm('Delete this image?')) { gallery.splice(Number(image.dataset.deleteGallery), 1); await save('gallery.json', gallery); render(); }
    });
    if (token) { const loginArea = document.querySelector('.admin-login') || $('loginSection'); if (loginArea) loginArea.style.display = 'none'; loadData().catch(error => message(error.message)); }
  }
  function download(data, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); a.download = name; a.click(); URL.revokeObjectURL(a.href); }
  document.addEventListener('DOMContentLoaded', wire);
})();
