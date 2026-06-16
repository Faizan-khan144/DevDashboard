function updateClock() {
  const now = new Date();
  document.getElementById('liveClock').textContent =
    now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false });
}
setInterval(updateClock, 1000);
updateClock();


async function fetchGitHub() {
  const username = document.getElementById('ghUsernameInput').value.trim();
  if (!username) return;
  const content = document.getElementById('ghContent');
  content.innerHTML = `<p style="font-size:12px;color:var(--muted);font-family:var(--mono);">Fetching ${username}…</p>`;
  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`),
      fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`)
    ]);
    if (!userRes.ok) throw new Error('User not found');
    const user = await userRes.json();
    const repos = await reposRes.json();
    renderGitHub(user, repos);
  } catch(e) {
    content.innerHTML = `<div class="gh-input-row"><input class="gh-input" id="ghUsernameInput" type="text" placeholder="Enter GitHub username…" value="${username}" /><button class="btn" onclick="fetchGitHub()">Fetch</button></div><p style="font-size:12px;color:var(--danger);margin-top:10px;font-family:var(--mono);">Error: ${e.message}</p>`;
  }
}

function renderGitHub(user, repos) {
  const repoRows = repos.map(r => `
    <div class="repo-row">
      <span class="repo-name">${r.name}</span>
      <span class="repo-meta">
        ${r.language ? `<span class="repo-lang">${r.language}</span>` : ''}
        <span class="repo-stars">★ ${r.stargazers_count}</span>
      </span>
    </div>`).join('');

  document.getElementById('ghContent').innerHTML = `
    <div class="gh-user">
      <div class="gh-avatar">${user.login.charAt(0).toUpperCase()}</div>
      <div>
        <div class="gh-name">${user.name || user.login}</div>
        <div class="gh-handle">@${user.login}</div>
      </div>
    </div>
    <div class="gh-stats">
      <div class="gh-stat"><span class="gh-stat-num">${user.public_repos}</span><span class="gh-stat-lbl">Repos</span></div>
      <div class="gh-stat"><span class="gh-stat-num">${user.followers}</span><span class="gh-stat-lbl">Followers</span></div>
      <div class="gh-stat"><span class="gh-stat-num">${user.following}</span><span class="gh-stat-lbl">Following</span></div>
      <div class="gh-stat"><span class="gh-stat-num">${user.public_gists}</span><span class="gh-stat-lbl">Gists</span></div>
    </div>
    <div class="gh-repos">${repoRows}</div>
    <div class="gh-input-row" style="margin-top:14px;">
      <input class="gh-input" id="ghUsernameInput" type="text" placeholder="Search another user…" />
      <button class="btn btn-ghost" onclick="fetchGitHub()">Search</button>
    </div>`;
}


let pomoSeconds = 25 * 60;
let pomoTotal   = 25 * 60;
let pomoRunning = false;
let pomoInterval = null;
let pomoSessions = 0;
let currentMode = 'focus';

function setMode(mode, mins) {
  currentMode = mode;
  document.querySelectorAll('.pomo-mode-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  pomoTotal = mins * 60;
  pomoSeconds = pomoTotal;
  pomoRunning = false;
  clearInterval(pomoInterval);
  document.getElementById('pomoBtn').textContent = 'Start';
  updatePomoDisplay();
}

function updatePomoDisplay() {
  const m = Math.floor(pomoSeconds / 60);
  const s = pomoSeconds % 60;
  document.getElementById('pomoMin').textContent = String(m).padStart(2,'0');
  document.getElementById('pomoSec').textContent = ':' + String(s).padStart(2,'0');
  const pct = 1 - (pomoSeconds / pomoTotal);
  const circumference = 2 * Math.PI * 51;
  document.getElementById('pomoRing').style.strokeDashoffset = circumference * (1 - pct);
}

function toggleTimer() {
  if (pomoRunning) {
    clearInterval(pomoInterval);
    pomoRunning = false;
    document.getElementById('pomoBtn').textContent = 'Resume';
  } else {
    pomoRunning = true;
    document.getElementById('pomoBtn').textContent = 'Pause';
    pomoInterval = setInterval(() => {
      if (pomoSeconds <= 0) {
        clearInterval(pomoInterval);
        pomoRunning = false;
        document.getElementById('pomoBtn').textContent = 'Start';
        if (currentMode === 'focus') {
          pomoSessions++;
          renderDots();
        }
        pomoSeconds = pomoTotal;
        updatePomoDisplay();
        return;
      }
      pomoSeconds--;
      updatePomoDisplay();
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(pomoInterval);
  pomoRunning = false;
  pomoSeconds = pomoTotal;
  document.getElementById('pomoBtn').textContent = 'Start';
  updatePomoDisplay();
}

function renderDots() {
  const dots = document.getElementById('pomoDots');
  dots.innerHTML = '';
  for (let i = 0; i < Math.max(4, pomoSessions); i++) {
    const d = document.createElement('div');
    d.className = 'pomo-dot' + (i < pomoSessions ? ' done' : '');
    dots.appendChild(d);
  }
}

updatePomoDisplay();
renderDots();


const notesKey = 'devdash_notes';
const notesArea = document.getElementById('notesArea');
notesArea.value = localStorage.getItem(notesKey) || '';
updateNotesChars();

function saveNotes() {
  localStorage.setItem(notesKey, notesArea.value);
  updateNotesChars();
}
function updateNotesChars() {
  document.getElementById('notesChars').textContent = notesArea.value.length + ' chars';
}
function clearNotes() {
  if (confirm('Clear all notes?')) {
    notesArea.value = '';
    saveNotes();
  }
}


const todoKey = 'devdash_todos';
let todos = JSON.parse(localStorage.getItem(todoKey) || '[]');

function saveTodos() { localStorage.setItem(todoKey, JSON.stringify(todos)); }

function renderTodos() {
  const list = document.getElementById('todoList');
  list.innerHTML = '';
  todos.forEach((t, i) => {
    const item = document.createElement('div');
    item.className = 'todo-item' + (t.done ? ' done' : '');
    item.innerHTML = `
      <div class="todo-check ${t.done ? 'checked' : ''}" onclick="toggleTodo(${i})"></div>
      <span class="todo-text">${escHtml(t.text)}</span>
      <button class="todo-del" onclick="deleteTodo(${i})">×</button>`;
    list.appendChild(item);
  });
  const remaining = todos.filter(t => !t.done).length;
  document.getElementById('todoCount').textContent = remaining + ' remaining';
}

function addTodo() {
  const input = document.getElementById('todoInput');
  const text = input.value.trim();
  if (!text) return;
  todos.unshift({ text, done: false });
  input.value = '';
  saveTodos();
  renderTodos();
}

function toggleTodo(i) {
  todos[i].done = !todos[i].done;
  saveTodos();
  renderTodos();
}

function deleteTodo(i) {
  todos.splice(i, 1);
  saveTodos();
  renderTodos();
}

function clearDone() {
  todos = todos.filter(t => !t.done);
  saveTodos();
  renderTodos();
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

renderTodos();