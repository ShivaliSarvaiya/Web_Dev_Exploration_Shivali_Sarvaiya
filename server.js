"use strict";

const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

// In-memory stores (reset on server restart)
let books = [];
let playlists = [];
let nextId = 1;

//////////////////////////
// USER PROFILE
//////////////////////////

// Set / update username via cookie
app.post("/api/user", (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "No name" });

  // 30 days
  res.cookie("username", name, {
    maxAge: 1000 * 60 * 60 * 24 * 30,
    // sameSite 'lax' to be safe in modern browsers; not httpOnly so client can read via endpoints
    sameSite: "lax",
  });

  return res.json({ success: true, name });
});

// Read username from cookie
app.get("/api/user", (req, res) => {
  const name = req.cookies.username || null;
  return res.json({ name });
});

// Clear auth-related cookies
app.post("/api/logout", (req, res) => {
  res.clearCookie("username");
  res.clearCookie("theme");
  return res.json({ success: true });
});

//////////////////////////
// THEME
//////////////////////////

// Set theme via cookie
app.post("/api/theme", (req, res) => {
  const theme = (req.body?.theme || "light").trim();
  res.cookie("theme", theme, {
    maxAge: 1000 * 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  return res.json({ success: true, theme });
});

// Read theme from cookie
app.get("/api/theme", (req, res) => {
  return res.json({ theme: req.cookies.theme || "light" });
});

//////////////////////////
// BOOKS
//////////////////////////

// Get all books for current user
app.get("/api/books", (req, res) => {
  const user = req.cookies.username || null;
  if (!user) return res.json([]); // no user = no books
  const userBooks = books.filter((b) => b.user === user);
  return res.json(userBooks);
});

// Create a new book for current user
app.post("/api/books", (req, res) => {
  const user = req.cookies.username || null;
  if (!user) return res.status(400).json({ error: "No user" });

  const { title, genre, image, list } = req.body || {};
  if (!title) return res.status(400).json({ error: "Missing 'title'" });

  const book = {
    id: nextId++,
    title: String(title),
    genre: genre ? String(genre) : "",
    image: image ? String(image) : "",
    list: list ? String(list) : "", // which list the book belongs to, if applicable
    user,
  };

  books.push(book);
  return res.json(book);
});

// Delete a book by id for current user
app.delete("/api/books/:id", (req, res) => {
  const user = req.cookies.username || null;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const before = books.length;
  books = books.filter((b) => !(b.id === id && b.user === user));
  const removed = before !== books.length;

  return res.json({ success: true, removed });
});

//////////////////////////
// PLAYLISTS
//////////////////////////

// Get playlists for current user
app.get("/api/playlists", (req, res) => {
  const user = req.cookies.username || null;
  if (!user) return res.json([]);
  const userPlaylists = playlists.filter((p) => p.user === user);
  return res.json(userPlaylists);
});

// Create a new empty playlist for current user
app.post("/api/playlists", (req, res) => {
  const user = req.cookies.username || null;
  if (!user) return res.status(400).json({ error: "No user" });

  const name = (req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Missing 'name'" });

  const playlist = {
    id: nextId++,
    name,
    songs: [],
    user,
  };

  playlists.push(playlist);
  return res.json(playlist);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));