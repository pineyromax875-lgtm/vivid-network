// Lightweight admin dashboard script with errors, gallery and about editor

const REPO_OWNER = 'pineyromax875-lgtm';
const REPO_NAME = 'vivid-network';

let reviews = [];
let errors = [];
let gallery = [];
let about = {};
let isAuthed = false;
const DEMO_PASSCODE = 'VividStaff'; // demo passcode for staff (change to secure auth in production)

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
  const container = document.getElementById('adminReviews');
  container.innerHTML = '';
  reviews.forEach((r, idx) => {
    const tpl = document.getElementById('reviewTemplate');
    const node = tpl.content.cloneNode(true);
    node.querySelector('.r-name').textContent = `${r.name} — ${'★'.repeat(r.rating)}`;
    node.querySelector('.r-text').textContent = r.text;
    node.querySelector('.r-date').textContent = r.date || '';
    node.querySelector('.editBtn').addEventListener('click', () => editReview(idx));
    node.querySelector('.deleteBtn').addEventListener('click', () => deleteReview(idx));
    container.appendChild(node);
  });
}

function renderErrors(){
  const container = document.getElementById('errorsList');
  container.innerHTML = '';
  if(!errors || errors.length === 0){ container.innerHTML = '<p class="muted">No errors reported.</p>'; return; }
  errors.forEach((e, idx) => {
    const tpl = document.getElementById('errorTemplate');
    const node = tpl.content.cloneNode(true);
    node.querySelector('.e-title').textContent = `${e.title || e.message || 'Error'} ${e.resolved ? '(resolved)' : ''}`;
    node.querySelector('.e-stack').textContent = e.stack || e.message || '';
    node.querySelector('.e-date').textContent = e.date || '';
    node.querySelector('.markResolvedBtn').addEventListener('click', ()=> markResolved(idx));
    node.querySelector('.deleteErrorBtn').addEventListener('click', ()=> deleteError(idx));
    container.appendChild(node);
  });
}

function renderAdminGallery(){
  const container = document.getElementById('adminGallery');
  container.innerHTML = '';
  if(!gallery || gallery.length === 0){ container.innerHTML = '<p class="muted">No gallery items.</p>'; return; }
  gallery.forEach((g, idx) => {
    const tpl = document.getElementById('galleryItemTemplate');
    const node = tpl.content.cloneNode(true);
    node.querySelector('.g-thumb').src = g.url;
    node.querySelector('.g-caption').textContent = g.caption || '';
    node.querySelector('.g-date').textContent = g.date || '';
    node.querySelector('.g-delete-btn').addEventListener('click', ()=> deleteGalleryItem(idx));
    container.appendChild(node);
  });
}

function loadAboutEditor(){
  const editor = document.getElementById('aboutEditor');
  if(!editor) return;
  editor.value = about.html || about.text || '';
}

function markResolved(i){
  if(!confirm('Mark this error as resolved?')) return;
  errors[i].resolved = true;
  renderErrors();
}

function deleteError(i){
  if(!confirm('Delete this error?')) return;
  errors.splice(i,1);
  renderErrors();
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
}

function deleteReview(i){
  if(!confirm('Delete this review?')) return;
  reviews.splice(i,1);
  renderAdminReviews();
}

function addReview(){
  const name = prompt('Reviewer name',''); if(!name) return;
  const text = prompt('Review text',''); if(!text) return;
  const rating = parseInt(prompt('Rating (1-5)','5'),10) || 5;
  reviews.unshift({ name, text, rating, date: new Date().toISOString().split('T')[0] });
  renderAdminReviews();
}

function addGalleryItem(){
  const url = (document.getElementById('g-url').value || '').trim();
  const caption = (document.getElementById('g-caption').value || '').trim();
  if(!url){ alert('Please provide an image URL.'); return; }
  const item = { url, caption, date: new Date().toISOString().split('T')[0] };
  gallery.unshift(item);
  renderAdminGallery();
}

function deleteGalleryItem(i){
  if(!confirm('Delete this gallery image?')) return;
  gallery.splice(i,1);
  renderAdminGallery();
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
  const resultEl = document.getElementById('fileSaveResult');
  if(resultEl) resultEl.textContent = 'Saving...';
  try{
    const sha = await getFileSha(token, path);
    const encoded = btoa(unescape(encodeURIComponent(content)));
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
      method: 'PUT',
      headers: { Authorization: 'token ' + token, Accept: 'application/vnd.github+json' },
      body: JSON.stringify({ message: message || 'Update via admin dashboard', content: encoded, sha })
    });
    if(!res.ok){ const e = await res.json(); if(resultEl) resultEl.textContent = 'Failed: ' + (e.message || res.statusText); return false; }
    if(resultEl) resultEl.textContent = 'Saved to repository.';
    return true;
  }catch(e){ console.error(e); if(resultEl) resultEl.textContent = 'Error saving: ' + e.message; return false; }
}

async function saveGalleryToGitHub(token){
  const resultEl = document.getElementById('fileSaveResult');
  if(resultEl) resultEl.textContent = 'Saving gallery...';
  try{
    const content = JSON.stringify(gallery, null, 2);
    const ok = await saveFileToGitHub(token, 'gallery.json', content, 'Update gallery via admin dashboard');
    if(ok) resultEl.textContent = 'Saved gallery.json to repo.';
  }catch(e){ console.error(e); if(resultEl) resultEl.textContent = 'Error: ' + e.message; }
}

async function saveAboutToGitHub(token){
  const editor = document.getElementById('aboutEditor');
  const resultEl = document.getElementById('aboutSaveResult');
  if(!editor || !resultEl) return;
  resultEl.textContent = 'Saving about content...';
  try{
    const contentObj = { html: editor.value };
    const ok = await saveFileToGitHub(token, 'about.json', JSON.stringify(contentObj, null, 2), 'Update about content via admin dashboard');
    if(ok) resultEl.textContent = 'Saved about.json to repo.';
  }catch(e){ console.error(e); resultEl.textContent = 'Error saving about: ' + e.message; }
}

async function loadEditableFile(path){
  const editor = document.getElementById('fileEditor');
  const resultEl = document.getElementById('fileSaveResult');
  if(resultEl) resultEl.textContent = 'Loading...';
  try{
    const res = await fetch(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${path}`);
    if(!res.ok){ editor.value = ''; if(resultEl) resultEl.textContent = 'Failed to load file.'; return; }
    const text = await res.text();
    editor.value = text;
    if(resultEl) resultEl.textContent = 'Loaded.';
  }catch(e){ console.error(e); if(resultEl) resultEl.textContent = 'Error loading file: ' + e.message; }
}

// Login & init
document.addEventListener('DOMContentLoaded', async () => {
  const passIn = document.getElementById('passcode');
  const loginBtn = document.getElementById('loginBtn');
  const loginMsg = document.getElementById('loginMsg');
  const dash = document.getElementById('dashboard');
  const loginSection = document.getElementById('loginSection');
  const exportBtn = document.getElementById('exportBtn');
  const saveBtn = document.getElementById('saveRepoBtn');
  const patInput = document.getElementById('pat');
  const exportErrorsBtn = document.getElementById('exportErrorsBtn');
  const loadFileBtn = document.getElementById('loadFileBtn');
  const saveFileBtn = document.getElementById('saveFileBtn');
  const fileSelect = document.getElementById('fileSelect');
  const patFile = document.getElementById('patFile');
  const addGalleryBtn = document.getElementById('addGalleryBtn');
  const addAboutBtn = document.getElementById('saveAboutBtn');
  const aboutPat = document.getElementById('aboutPat');
  const exportGalleryBtn = document.getElementById('exportGalleryBtn');

  reviews = await fetchReviews();
  errors = await fetchErrors();
  gallery = await fetchGallery();
  about = await fetchAbout();

  loginBtn.addEventListener('click', () => {
    const val = (passIn.value || '').trim();
    if(val === DEMO_PASSCODE){
      isAuthed = true; loginMsg.textContent = 'Logged in (demo)'; loginSection.style.display = 'none'; dash.style.display = 'block';
      renderAdminReviews(); renderErrors(); renderAdminGallery(); loadAboutEditor();
    } else { loginMsg.textContent = 'Invalid passcode'; }
  });

  document.getElementById('addReviewBtn').addEventListener('click', addReview);
  exportBtn.addEventListener('click', () => exportJSON(reviews, 'reviews.json'));
  exportErrorsBtn.addEventListener('click', () => exportJSON(errors, 'errors.json'));

  addGalleryBtn.addEventListener('click', () => {
    addGalleryItem();
  });

  addAboutBtn.addEventListener('click', async () => {
    const token = (aboutPat.value||'').trim();
    if(!token){ alert('A staff GitHub token is required to save About content to the repo.'); return; }
    if(!confirm('Save About content to repository?')) return;
    await saveAboutToGitHub(token);
    // refresh public about content
    about = await fetchAbout();
    // reload public area
    try{ const aboutEl = document.getElementById('aboutContent'); if(aboutEl) aboutEl.innerHTML = about.html || about.text || ''; }catch(e){}
  });

  saveBtn.addEventListener('click', async () => {
    const token = patInput.value.trim();
    if(!token){ if(!confirm('No token provided — you will only download the JSON. Continue?')) return; exportJSON(reviews, 'reviews.json'); return; }
    if(!confirm('This will push changes to the GitHub repository using the provided token. Make sure the token has repo:contents scope. Continue?')) return;
    // save reviews.json
    const success = await saveFileToGitHub(token, 'reviews.json', JSON.stringify(reviews, null, 2), 'Update reviews via admin dashboard');
    if(success) document.getElementById('saveMsg').textContent = 'Saved reviews.json to repo.';
  });

  loadFileBtn.addEventListener('click', async () => {
    const path = fileSelect.value;
    await loadEditableFile(path);
  });

  saveFileBtn.addEventListener('click', async () => {
    const token = (patFile.value || '').trim();
    if(!token){ alert('A staff GitHub token is required to save files to the repo.'); return; }
    const path = fileSelect.value;
    const content = document.getElementById('fileEditor').value;
    const message = document.getElementById('fileCommitMsg').value || `Update ${path} via admin dashboard`;
    if(!confirm(`Save ${path} to repository? This will create a commit.`)) return;
    await saveFileToGitHub(token, path, content, message);
  });

  // Save gallery to repo when staff explicitly saves via file editor or by using saveGalleryToGitHub (could add a button)
  // For convenience, add a save when a PAT is provided to the main save area and fileSelect is gallery.json
  document.getElementById('saveRepoBtn').addEventListener('click', async () => {
    const token = (patInput.value || '').trim();
    if(!token){ if(!confirm('No token provided — you will only download the JSON. Continue?')) return; exportJSON(reviews, 'reviews.json'); return; }
    if(fileSelect.value === 'gallery.json'){
      if(!confirm('Save gallery.json to repo?')) return;
      await saveGalleryToGitHub(token);
    } else {
      const success = await saveFileToGitHub(token, 'reviews.json', JSON.stringify(reviews, null, 2), 'Update reviews via admin dashboard');
      if(success) document.getElementById('saveMsg').textContent = 'Saved reviews.json to repo.';
    }
  });

});
