const API_URL = "http://localhost:7000";

// --- State Management ---
let currentUser = null;

function getToken() {
  return localStorage.getItem("jwt_token");
}

function setToken(token) {
  localStorage.setItem("jwt_token", token);
}

function authHeaders(multipart = false) {
  const h = { Authorization: `Bearer ${getToken()}` };
  if (!multipart) h["Content-Type"] = "application/json";
  return h;
}

// --- Initialization ---
async function init() {
  const token = getToken();
  if (token) {
    await fetchMe();
  } else {
    showAuth();
  }
}

// --- Auth Actions ---
async function handleLogin(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();

    if (res.ok) {
      setToken(json.data.token);
      log(`Logged in as ${json.data.user.display_name}`);
      await fetchMe();
    } else {
      log(json.message || "Login failed");
    }
  } catch (err) {
    log("Error: " + err.message);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.ok) log("Registered! Please login.");
    else log(json.message);
  } catch (err) {
    log(err.message);
  }
}

function logout() {
  localStorage.removeItem("jwt_token");
  currentUser = null;
  showAuth();
  log("Logged out");
}

// --- Core Data ---
async function fetchMe() {
  try {
    const res = await fetch(`${API_URL}/users/me`, { headers: authHeaders() });
    const json = await res.json();
    if (res.ok) {
      currentUser = json.data;
      renderDashboard();
      fetchAllUsers();
      fetchFollowers();
    } else {
      // Token might be expired
      logout();
    }
  } catch (err) {
    log(err.message);
  }
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const name = document.getElementById("edit-name").value;
  const res = await fetch(`${API_URL}/users/me`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ id: currentUser.id, display_name: name }),
  });
  if (res.ok) fetchMe();
}

async function handleAvatarUpload(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const res = await fetch(`${API_URL}/users/me/avatar`, {
    method: "POST",
    headers: authHeaders(true),
    body: formData,
  });
  if (res.ok) fetchMe();
}

// --- Social ---
async function fetchAllUsers() {
  const res = await fetch(`${API_URL}/users`);
  const json = await res.json();
  const list = document.getElementById("user-list");
  list.innerHTML = "";

  json.data.forEach((u) => {
    if (currentUser && u.id === currentUser.id) return;
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
            <span>${u.display_name}</span>
            <div class="actions">
                <button onclick="followUser('${u.id}')" class="btn-sm">Follow</button>
                <button onclick="unfollowUser('${u.id}')" class="btn-sm btn-secondary">Unfollow</button>
            </div>
        `;
    list.appendChild(div);
  });
}

async function fetchFollowers() {
  const res = await fetch(`${API_URL}/users/${currentUser.id}/followers`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  const list = document.getElementById("follower-list");
  list.innerHTML = "";

  if (!json.data || json.data.length === 0) {
    list.innerHTML =
      '<div style="padding:0.5rem; color:#888">No followers yet</div>';
    return;
  }

  json.data.forEach((u) => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `<span>${u.display_name}</span>`;
    list.appendChild(div);
  });
}

async function followUser(id) {
  await fetch(`${API_URL}/users/follow/${id}`, {
    method: "POST",
    headers: authHeaders(),
  });
  fetchFollowers();
  log("Follow request sent");
}

async function unfollowUser(id) {
  await fetch(`${API_URL}/users/unfollow/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  fetchFollowers();
  log("Unfollow request sent");
}

// --- UI Helpers ---
function showAuth() {
  document.getElementById("auth-view").classList.remove("hidden");
  document.getElementById("dashboard-view").classList.add("hidden");
  document.getElementById("user-display").classList.add("hidden");
}

function renderDashboard() {
  document.getElementById("auth-view").classList.add("hidden");
  document.getElementById("dashboard-view").classList.remove("hidden");

  document.getElementById("user-display").classList.remove("hidden");
  document.getElementById("username").innerText = currentUser.display_name;

  document.getElementById("profile-name").innerText = currentUser.display_name;
  document.getElementById("profile-email").innerText = currentUser.email;
  if (currentUser.profile_pic_url) {
    document.getElementById("avatar-img").src =
      currentUser.profile_pic_url.startsWith("http")
        ? currentUser.profile_pic_url
        : API_URL + currentUser.profile_pic_url;
  }
}

function log(msg) {
  const el = document.getElementById("status-bar");
  el.innerText = msg;
  setTimeout(() => (el.innerText = "Ready"), 3000);
}

// Start
init();
