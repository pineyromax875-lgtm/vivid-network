// Lightweight admin dashboard script with errors, gallery and about editor

const REPO_OWNER = 'pineyromax875-lgtm';
const REPO_NAME = 'vivid-network';

let reviews = [];
let errors = [];
let gallery = [];
let about = {};
let isAuthed = false;
const DEMO_PASSCODE = 'VividStaff'; // demo passcode for staff (change to secure auth in production)

function $id(id){ return document.getElementById(id); }

function showToast(msg, type = 'info', timeout = 3500){
  const containerId = 'toastContainer';
  let container = $id(containerId);
  if(!container){ container = document.createElement('div'); container.id = containerId; document.body.appendChild(container); }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(()=>{ t.classList.add('visible'); }, 20);
  setTimeout(()=>{ t.classList.remove('visible'); setTimeout(()=>t.remove(), 300); }, timeout);
}

async function fetchReviews(){
  try{
    const res = await fetch('/reviews.json');
    if(!res.ok) return [];
    return await res.json();
  }catch(e){
    console.error(e);
    return [];
  }
}

async function fetchErrors(){
  try{
    const res = await fetch('/errors.json');
    if(!res.ok) return [];
    return await res.json();
  }catch(e){
    console.error(e);
    return [];
  }
}

async function fetchGallery(){
  try{
    const res = await fetch('/gallery.json');
    if(!res.ok) return [];
    return await res.json();
  }catch(e){ console.error(e); return []; }
}

async function fetchAbout(){
  try{
    const res = await fetch('/about.json');
    if(!res.ok) return {};
    return await res.json();
  }catch(e){ console.error(e); return {}; }
}

function renderAdminReviews(){
  const container = $id('adminReviews');
  if(!container) return;
  container.innerHTML = '';
  reviews.forEach((r, idx) => {
    const tpl = document.getElementById('reviewTemplate');
    if(!tpl) return;
    const node = tpl.content.cloneNode(true);
    node.querySelector('.r-name').textContent = `${r.name} — ${'★'.repeat(r.rating)}`;
    node.querySelector('.r-text').textContent = r.text;
    node.querySelector('.r-date').textContent = r.date || '';
    const editBtn = node.querySelector('.editBtn');
    const deleteBtn = node.querySelector('.deleteBtn');
    if(editBtn) editBtn.addEventListener('click', () => editReview(idx));
    if(deleteBtn) deleteBtn.addEventListener('click', () => deleteReview(idx));
    container.appendChild(node);
  });
}

function renderErrors(){
  const container = $id('errorsList');
  if(!container) return;
  container.innerHTML = '';
  if(!errors || errors.length === 0){ container.innerHTML = '<p class="muted">No errors reported.</p>'; return; }
  errors.forEach((e, idx) => {
    const tpl = document.getElementById('errorTemplate');
    if(!tpl) return;
    const node = tpl.content.cloneNode(true);
    node.querySelector('.e-title').textContent = `${e.title || e.message || 'Error'} ${e.resolved ? '(resolved)' : ''}`;
    node.querySelector('.e-stack').textContent = e.stack || e.message || '';
    node.querySelector('.e-date').textContent = e.date || '';
    const mBtn = node.querySelector('.markResolvedBtn');
    const dBtn = node.querySelector('.deleteErrorBtn');
    if(mBtn) mBtn.addEventListener('click', ()=> markResolved(idx));
    if(dBtn) dBtn.addEventListener('click', ()=> deleteError(idx));
    container.appendChild(node);
  });
}

function renderAdminGallery(){
  const container = $id('adminGallery');
  if(!container) return;
  container.innerHTML = '';
  if(!gallery || gallery.length === 0){ container.innerHTML = '<p class="muted">No gallery items.</p>'; return; }
  gallery.forEach((g, idx) => {
    const tpl = document.getElementById('galleryItemTemplate');
    if(!tpl) return;
    const node = tpl.content.cloneNode(true);
    const img = node.querySelector('.g-thumb');
    if(img) img.src = g.url;
    const cap = node.querySelector('.g-caption'); if(cap) cap.textContent = g.caption || '';
    const date = node.querySelector('.g-date'); if(date) date.textContent = g.date || '';
    const del = node.querySelector('.g-delete-btn'); if(del) del.addEventListener('click', ()=> deleteGalleryItem(idx));
    container.appendChild(node);
  });
}

function loadAboutEditor(){
  const editor = $id('aboutEditor');
  if(!editor) return;
  editor.value = about.html || about.text || '';
}

function markResolved(i){
  if(!confirm('Mark this error as resolved?')) return;
  errors[i].resolved = true;
  renderErrors();
  showToast('Marked error as resolved', 'success');
}

function deleteError(i){
  if(!confirm('Delete this error?')) return;
  errors.splice(i,1);
  renderErrors();
  showToast('Deleted error', 'success');
}

function editReview(i){
  const r = reviews[i];
  const name = prompt('Reviewer name', r.name);
  if(name === null) return;
  const text = prompt('Review text', r.text);
  if(text === null) return;
  const rating = parseInt(prompt('Rating (1-5)', r.rating),10) || 5;
  reviews[i] = { name, text, rating, date: new Date().toISOString().split('T')[0] };
  renderAdminReviews();
  showToast('Review updated', 'success');
}

function deleteReview(i){
  if(!confirm('Delete this review?')) return;
  reviews.splice(i,1);
  renderAdminReviews();
  showToast('Review deleted', 'success');
}

function addReview(){
  const name = prompt('Reviewer name',''); if(!name) return;
  const text = prompt('Review text',''); if(!text) return;
  const rating = parseInt(prompt('Rating (1-5)','5'),10) || 5;
  reviews.unshift({ name, text, rating, date: new Date().toISOString().split('T')[0] });
  renderAdminReviews();
  showToast('Review added', 'success');
}

function addGalleryItem(){
  const url = ($id('g-url') && $id('g-url').value || '').trim();
  const caption = ($id('g-caption') && $id('g-caption').value || '').trim();
  if(!url){ alert('Please provide an image URL.'); return; }
  const item = { url, caption, date: new Date().toISOString().split('T')[0] };
  gallery.unshift(item);
  renderAdminGallery();
  showToast('Gallery item added (local)', 'success');
}

function deleteGalleryItem(i){
  if(!confirm('Delete this gallery image?')) return;
  gallery.splice(i,1);
  renderAdminGallery();
  showToast('Gallery item deleted', 'success');
}

function exportJSON(data, filename){
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

async function getFileSha(token, path){
  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, { headers: { Authorization: 'token ' + token, Accept: 'application/vnd.github+json' } });
  if(!res.ok) return null;
  const j = await res.json();
  return j.sha;
}

async function saveFileToGitHub(token, path, content, message){
  const resultEl = $id('fileSaveResult');
  if(resultEl) resultEl.textContent = 'Saving...';
  try{
    const sha = await getFileSha(token, path);
    const encoded = btoa(unescape(encodeURIComponent(content)));
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
      method: 'PUT',
      headers: { Authorization: 'token ' + token, Accept: 'application/vnd.github+json' },
      body: JSON.stringify({ message: message || 'Update via admin dashboard', content: encoded, sha })
    });
    if(!res.ok){ const e = await res.json(); if(resultEl) resultEl.textContent = 'Failed: ' + (e.message || res.statusText); showToast('Failed to save to GitHub: ' + (e.message || res.statusText), 'error'); return false; }
    if(resultEl) resultEl.textContent = 'Saved to repository.';
    showToast('Saved to repository', 'success');
    return true;
  }catch(e){ console.error(e); if(resultEl) resultEl.textContent = 'Error saving: ' + e.message; showToast('Error saving: ' + e.message, 'error'); return false; }
}

async function saveGalleryToGitHub(token){
  const resultEl = $id('fileSaveResult');
  if(resultEl) resultEl.textContent = 'Saving gallery...';
  try{
    const content = JSON.stringify(gallery, null, 2);
    const ok = await saveFileToGitHub(token, 'gallery.json', content, 'Update gallery via admin dashboard');
    if(ok) resultEl.textContent = 'Saved gallery.json to repo.';
  }catch(e){ console.error(e); if(resultEl) resultEl.textContent = 'Error: ' + e.message; }
}

async function saveAboutToGitHub(token){
  const editor = $id('aboutEditor');
  const resultEl = $id('aboutSaveResult');
  if(!editor || !resultEl) return;
  resultEl.textContent = 'Saving about content...';
  try{
    const raw = editor.value || '';
    const safe = (window.DOMPurify && DOMPurify.sanitize) ? DOMPurify.sanitize(raw) : raw;
    const contentObj = { html: safe };
    const ok = await saveFileToGitHub(token, 'about.json', JSON.stringify(contentObj, null, 2), 'Update about content via admin dashboard');
    if(ok) resultEl.textContent = 'Saved about.json to repo.';
  }catch(e){ console.error(e); resultEl.textContent = 'Error saving about: ' + e.message; }
}

async function loadEditableFile(path){
  const editor = $id('fileEditor');
  const resultEl = $id('fileSaveResult');
  if(resultEl) resultEl.textContent = 'Loading...';
  try{
    const res = await fetch(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${path}`);
    if(!res.ok){ if(editor) editor.value = ''; if(resultEl) resultEl.textContent = 'Failed to load file.'; showToast('Failed to load file: ' + path, 'error'); return; }
    const text = await res.text();
    if(editor) editor.value = text;
    if(resultEl) resultEl.textContent = 'Loaded.';
  }catch(e){ console.error(e); if(resultEl) resultEl.textContent = 'Error loading file: ' + e.message; showToast('Error loading file: ' + e.message, 'error'); }
}

// Admin panel switching
function switchPanel(name){
  const panels = document.querySelectorAll('.admin-panel');
  panels.forEach(p => p.style.display = 'none');
  const target = $id('panel-' + name);
  if(target) target.style.display = 'block';
  // update active state
  document.querySelectorAll('.admin-nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.panel === name));
}

// Ensure admin section is shown when hash changes or when Staff link is clicked
function showAdmin(){
  const adminSec = $id('admin');
  if(!adminSec) return;
  adminSec.style.display = 'block';
  // default panel decision
  if(isAuthed) switchPanel('reviews');
  else switchPanel('reviews'); // show reviews but keep login visible
  setTimeout(()=>{ adminSec.scrollIntoView({behavior:'smooth'}); }, 40);
}

// Login & init
document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const passIn = $id('passcode');
  const loginBtn = $id('loginBtn');
  const loginMsg = $id('loginMsg');
  const exportBtn = $id('exportBtn');
  const saveBtn = $id('saveRepoBtn');
  const patInput = $id('pat');
  const exportErrorsBtn = $id('exportErrorsBtn');
  const loadFileBtn = $id('loadFileBtn');
  const saveFileBtn = $id('saveFileBtn');
  const fileSelect = $id('fileSelect');
  const patFile = $id('patFile');
  const addGalleryBtn = $id('addGalleryBtn');
  const addAboutBtn = $id('saveAboutBtn');
  const aboutPat = $id('aboutPat');

  // Fetch initial data
  reviews = await fetchReviews();
  errors = await fetchErrors();
  gallery = await fetchGallery();
  about = await fetchAbout();

  // Wire admin nav
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.panel;
      if(!isAuthed && (panel === 'files' || panel === 'gallery' || panel === 'about')){
        showToast('Please login as staff to access this panel', 'info');
        return;
      }
      switchPanel(panel);
    });
  });

  // Login handler
  if(loginBtn){
    loginBtn.addEventListener('click', () => {
      const val = (passIn && (passIn.value || '').trim()) || '';
      if(val === DEMO_PASSCODE){
        isAuthed = true;
        if(loginMsg) loginMsg.textContent = 'Logged in (demo)';
        // hide login fields but keep admin visible
        const loginArea = document.querySelector('.admin-login');
        if(loginArea) loginArea.style.display = 'none';
        switchPanel('reviews');
        renderAdminReviews(); renderErrors(); renderAdminGallery(); loadAboutEditor();
        showToast('Logged in as staff (demo)', 'success');
      } else {
        if(loginMsg) loginMsg.textContent = 'Invalid passcode';
        showToast('Invalid passcode', 'error');
      }
    });
  }

  // Buttons
  if($id('addReviewBtn')) $id('addReviewBtn').addEventListener('click', addReview);
  if(exportBtn) exportBtn.addEventListener('click', () => exportJSON(reviews, 'reviews.json'));
  if(exportErrorsBtn) exportErrorsBtn.addEventListener('click', () => exportJSON(errors, 'errors.json'));
  if(addGalleryBtn) addGalleryBtn.addEventListener('click', addGalleryItem);

  if(addAboutBtn){
    addAboutBtn.addEventListener('click', async () => {
      const token = (aboutPat && aboutPat.value||'').trim();
      if(!token){ alert('A staff GitHub token is required to save About content to the repo.'); return; }
      if(!confirm('Save About content to repository?')) return;
      await saveAboutToGitHub(token);
      // refresh public about content
      about = await fetchAbout();
      try{ const aboutEl = document.getElementById('aboutContent'); if(aboutEl) aboutEl.innerHTML = about.html || about.text || ''; }catch(e){}
    });
  }

  if(saveBtn){
    saveBtn.addEventListener('click', async () => {
      const token = (patInput && patInput.value || '').trim();
      if(!token){ if(!confirm('No token provided — you will only download the JSON. Continue?')) return; exportJSON(reviews, 'reviews.json'); return; }
      if(!confirm('This will push changes to the GitHub repository using the provided token. Make sure the token has repo:contents scope. Continue?')) return;
      const success = await saveFileToGitHub(token, 'reviews.json', JSON.stringify(reviews, null, 2), 'Update reviews via admin dashboard');
      if(success && $id('saveMsg')) $id('saveMsg').textContent = 'Saved reviews.json to repo.';
    });
  }

  if(loadFileBtn) loadFileBtn.addEventListener('click', async () => {
    const path = fileSelect && fileSelect.value;
    if(path) await loadEditableFile(path);
  });

  if(saveFileBtn){
    saveFileBtn.addEventListener('click', async () => {
      const token = (patFile && patFile.value || '').trim();
      if(!token){ alert('A staff GitHub token is required to save files to the repo.'); return; }
      const path = fileSelect && fileSelect.value;
      const content = ($id('fileEditor') && $id('fileEditor').value) || '';
      const message = ($id('fileCommitMsg') && $id('fileCommitMsg').value) || `Update ${path} via admin dashboard`;
      if(!confirm(`Save ${path} to repository? This will create a commit.`)) return;
      await saveFileToGitHub(token, path, content, message);
    });
  }

  // Save gallery convenience
  if($id('saveRepoBtn')){
    $id('saveRepoBtn').addEventListener('click', async () => {
      const token = ($id('pat') && $id('pat').value || '').trim();
      if(!token){ if(!confirm('No token provided — you will only download the JSON. Continue?')) return; exportJSON(reviews, 'reviews.json'); return; }
      if(($id('fileSelect') && $id('fileSelect').value) === 'gallery.json'){
        if(!confirm('Save gallery.json to repo?')) return;
        await saveGalleryToGitHub(token);
      } else {
        const success = await saveFileToGitHub(token, 'reviews.json', JSON.stringify(reviews, null, 2), 'Update reviews via admin dashboard');
        if(success) $id('saveMsg').textContent = 'Saved reviews.json to repo.';
      }
    });
  }

  // Initialize admin view if hash present
  if(location.hash.replace('#','') === 'admin') showAdmin();

});
