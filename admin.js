// Lightweight admin dashboard script

const REPO_OWNER = 'pineyromax875-lgtm';
const REPO_NAME = 'vivid-network';
const FILE_PATH = 'reviews.json';

let reviews = [];
let isAuthed = false;
const DEMO_PASSCODE = 'VividStaff'; // demo passcode for staff (change to a secure auth in production)

async function fetchReviews(){
  try{
    const res = await fetch('/' + FILE_PATH);
    if(!res.ok) return [];
    return await res.json();
  }catch(e){
    console.error(e);
    return [];
  }
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

function exportJSON(){
  const dataStr = JSON.stringify(reviews, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'reviews.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

async function saveToGitHub(token){
  const saveMsg = document.getElementById('saveMsg');
  saveMsg.textContent = 'Saving to GitHub...';
  try{
    // get current file sha
    const getRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}` , {
      headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github+json' }
    });
    let sha = null;
    if(getRes.ok){
      const j = await getRes.json();
      sha = j.sha;
    }
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(reviews, null, 2))));
    const putRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github+json' },
      body: JSON.stringify({ message: 'Update reviews via admin dashboard', content, sha })
    });
    if(!putRes.ok){
      const err = await putRes.json();
      saveMsg.textContent = 'Failed to save: ' + (err.message || putRes.statusText);
      return;
    }
    saveMsg.textContent = 'Saved to repository!';
  }catch(e){
    console.error(e); saveMsg.textContent = 'Error saving to GitHub: ' + e.message;
  }
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

  reviews = await fetchReviews();

  loginBtn.addEventListener('click', () => {
    const val = passIn.value;
    if(val === DEMO_PASSCODE){
      isAuthed = true; loginMsg.textContent = 'Logged in (demo)'; loginSection.style.display = 'none'; dash.style.display = 'block';
      renderAdminReviews();
    } else { loginMsg.textContent = 'Invalid passcode'; }
  });

  document.getElementById('addReviewBtn').addEventListener('click', addReview);
  exportBtn.addEventListener('click', exportJSON);
  saveBtn.addEventListener('click', () => {
    const token = patInput.value.trim();
    if(!token){ if(!confirm('No token provided — you will only download the JSON. Continue?')) return; exportJSON(); return; }
    if(!confirm('This will push changes to the GitHub repository using the provided token. Make sure the token has repo:contents scope. Continue?')) return;
    saveToGitHub(token);
  });
});
