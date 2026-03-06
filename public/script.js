"use strict";

/* =========================
   Helpers
========================= */
function $(id) { return document.getElementById(id); }
function q(sel, root = document) { return root.querySelector(sel); }

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/* =========================
   PROFILE
========================= */
async function loadUser() {
  try {
    const { name } = await api("/api/user").catch(() => ({ name: null }));
    let user = name;
    if (!user) {
      const local = localStorage.getItem("username");
      if (local) {
        user = local;
        try { await api("/api/user", { method: "POST", body: { name: local } }); } catch {}
      }
    }
    if (user) {
      localStorage.setItem("username", user);
      if ($("currentUser")) $("currentUser").textContent = user;
      if ($("usernameInput")) $("usernameInput").value = user;
    } else {
      if ($("currentUser")) $("currentUser").textContent = "Profile";
      if ($("usernameInput")) $("usernameInput").value = "";
    }
  } catch (e) { console.warn("loadUser failed:", e); }
}

async function saveUser() {
  const input = $("usernameInput");
  if (!input) return;
  const name = input.value.trim();
  if (!name) return;

  try { await api("/api/user", { method: "POST", body: { name } }); } catch {}
  localStorage.setItem("username", name);
  if ($("currentUser")) $("currentUser").textContent = name;

  // Re-render playlists for the new user profile (if on playlists page)
  renderPlaylists();
}

function toggleProfileMenu() {
  const dd = $("profileDropdown");
  if (!dd) return;
  dd.style.display = dd.style.display === "block" ? "none" : "block";
}

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  const menu = q(".profile-menu");
  const dd = $("profileDropdown");
  if (!menu || !dd) return;
  if (!menu.contains(e.target)) dd.style.display = "none";
});

/* =========================
   THEME
========================= */
function applyTheme(mode) {
  const isDark = mode === "dark";
  document.body.classList.toggle("dark", isDark);
  document.documentElement.classList.toggle("dark", isDark);
}

async function loadTheme() {
  let mode = "light";
  try {
    const { theme } = await api("/api/theme").catch(() => ({ theme: null }));
    if (theme) mode = theme;
    else {
      const local = localStorage.getItem("theme");
      if (local) mode = local;
    }
  } catch {}
  applyTheme(mode);
}

async function setTheme(mode) {
  const val = mode === "dark" ? "dark" : "light";
  applyTheme(val);
  localStorage.setItem("theme", val);
  try { await api("/api/theme", { method: "POST", body: { theme: val } }); } catch {}
}

async function toggleTheme() {
  const isDark =
    document.body.classList.contains("dark") ||
    document.documentElement.classList.contains("dark");
  await setTheme(isDark ? "light" : "dark");
}

/* =========================
   LOGOUT
========================= */
async function logout() {
  try { await api("/api/logout", { method: "POST" }); } catch {}
  localStorage.removeItem("username");
  localStorage.removeItem("theme");
  if ($("currentUser")) $("currentUser").textContent = "Profile";
  if ($("usernameInput")) $("usernameInput").value = "";
  applyTheme("light");
  // Clear playlists view (they’re per-user)
  renderPlaylists();
}

/* =========================
   BOOKS (server-backed)
========================= */
async function ensureUserCookie() {
  try {
    const { name } = await api("/api/user");
    if (!name) {
      const local = localStorage.getItem("username");
      if (local) {
        await api("/api/user", { method: "POST", body: { name: local } });
      }
    }
  } catch {}
}

async function addBook() {
  await ensureUserCookie();
  const title = (q("#title")?.value || "").trim();
  const genre = (q("#genre")?.value || "").trim();
  const image = (q("#image")?.value || "").trim();
  const list  =  q("#list")?.value || "to-read";
  if (!title) { alert("Please enter a title"); return; }
  try {
    await api("/api/books", { method: "POST", body: { title, genre, image, list } });
  } catch (e) {
    if (e.status === 400) alert("Please save a profile name first (Profile ▼).");
    else alert("Failed to add the book.");
    return;
  }
  loadBooks();
}

async function loadBooks() {
  const container = $("books");
  if (!container) return;
  await ensureUserCookie();
  let data = [];
  try { data = await api("/api/books"); } catch (e) { console.warn("loadBooks failed", e); }
  container.innerHTML = "";
  data.forEach((book) => {
    const div = document.createElement("div");
    div.className = "book-card";
    div.innerHTML = `
      <h3>${book.title}</h3>
      <p>${book.genre || ""}</p>
      ${book.image ? `${book.image}` : ""}
      <p><strong>${book.list}</strong></p>
      <button type="button" onclick="deleteBook(${book.id})">Delete</button>
    `;
    container.appendChild(div);
  });
}

async function deleteBook(id) {
  try { await api(`/api/books/${id}`, { method: "DELETE" }); } catch {}
  loadBooks();
}

/* =========================
   PLAYLISTS (per-user in localStorage)
   Key: playerProfile::<username>  -> { playlists: [{name, songs:[]}] }
========================= */
function currentProfileKey() {
  const u = localStorage.getItem("username");
  return u ? `playerProfile::${u}` : null;
}

function readProfile() {
  const key = currentProfileKey();
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : { playlists: [] };
  } catch {
    localStorage.removeItem(key);
    return { playlists: [] };
  }
}

function writeProfile(profile) {
  const key = currentProfileKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(profile));
}

function readPlaylists() {
  const p = readProfile();
  return p?.playlists ?? [];
}

function writePlaylists(arr) {
  const key = currentProfileKey();
  if (!key) {
    alert("Please save a profile name first (Profile ▼).");
    return;
  }
  const p = readProfile() || {};
  p.playlists = arr;
  writeProfile(p);
}

function renderPlaylists() {
  const container = $("playlists-container");
  if (!container) return; // not on this page

  const playlists = readPlaylists();
  container.innerHTML = "";

  if (!playlists.length) {
    const empty = document.createElement("p");
    empty.textContent = "No playlists yet — create one to start adding songs.";
    container.appendChild(empty);
    return;
  }

  playlists.forEach((pl, index) => {
    const card = document.createElement("div");
    card.className = "playlist card";
    card.innerHTML = `
      <h2>${pl.name}</h2>
      <div style="margin:8px 0;">
        <input id="song${index}" placeholder="Song name" />
        <button type="button" onclick="addSong(${index})">Add Song</button>
      </div>
      <div id="songs${index}"></div>
    `;
    container.appendChild(card);

    const songBox = $("songs" + index);
    (pl.songs || []).forEach((song, i) => {
      const row = document.createElement("div");
      row.className = "song-item";
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "8px";
      row.style.margin = "4px 0";
      row.innerHTML = `
        <span>${i + 1}. ${song}</span>
        <button type="button" onclick="deleteSong(${index}, ${i})">❌</button>
      `;
      songBox.appendChild(row);
    });
  });
}

function createPlaylist() {
  const input = $("playlist-name");
  if (!input) return;
  const name = input.value.trim();
  if (!name) return;

  const playlists = readPlaylists();
  playlists.push({ name, songs: [] });
  writePlaylists(playlists);

  input.value = "";
  renderPlaylists();
}

function addSong(pIndex) {
  const input = $("song" + pIndex);
  if (!input) return;
  const name = input.value.trim();
  if (!name) return;

  const playlists = readPlaylists();
  if (!Array.isArray(playlists[pIndex]?.songs)) playlists[pIndex].songs = [];
  playlists[pIndex].songs.push(name);

  writePlaylists(playlists);
  renderPlaylists();
}

function deleteSong(pIndex, sIndex) {
  const playlists = readPlaylists();
  if (!Array.isArray(playlists[pIndex]?.songs)) return;
  playlists[pIndex].songs.splice(sIndex, 1);

  writePlaylists(playlists);
  renderPlaylists();
}

/* =========================
   Expose for inline HTML handlers
========================= */
window.toggleProfileMenu = toggleProfileMenu;
window.saveUser = saveUser;
window.setTheme = setTheme;
window.toggleTheme = toggleTheme;
window.logout = logout;

window.addBook = addBook;
window.loadBooks = loadBooks;
window.deleteBook = deleteBook;

window.createPlaylist = createPlaylist;
window.addSong = addSong;
window.deleteSong = deleteSong;
window.renderPlaylists = renderPlaylists;

/* =========================
   Init
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  await loadUser();
  await loadTheme();

  // Books page (safe no-op elsewhere)
  loadBooks();

  // Playlists page
  renderPlaylists();
  const createBtn = $("create-playlist");
  if (createBtn) {
    createBtn.addEventListener("click", createPlaylist);
  }
});
``
