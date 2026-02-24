const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

let books = [
  { id: 1, title: "Percy Jackson", genre: "Fantasy" },
  { id: 2, title: "Hunger Games", genre: "Dystopian" }
];

let nextId = 3;

//// GET ALL
app.get("/api/books", (req, res) => {
  res.status(200).json(books);
});

//// GET ONE
app.get("/api/books/:id", (req, res) => {
  const book = books.find(b => b.id == req.params.id);
  if (!book) return res.status(404).json({ error: "Not found" });
  res.json(book);
});

//// POST CREATE
app.post("/api/books", (req, res) => {
  const { title, genre } = req.body;
  if (!title || !genre) {
    return res.status(400).json({ error: "Missing title or genre" });
  }
  const newBook = { id: nextId++, title, genre };
  books.push(newBook);
  res.status(201).json(newBook);
});

//// PUT UPDATE
app.put("/api/books/:id", (req, res) => {
  const book = books.find(b => b.id == req.params.id);
  if (!book) return res.status(404).json({ error: "Not found" });

  if (req.body.title) book.title = req.body.title;
  if (req.body.genre) book.genre = req.body.genre;

  res.json(book);
});

//// DELETE
app.delete("/api/books/:id", (req, res) => {
  const index = books.findIndex(b => b.id == req.params.id);
  if (index === -1) return res.status(404).json({ error: "Not found" });

  books.splice(index, 1);
  res.json({ message: "Deleted" });
});

//// COOKIE ROUTE (game score)
app.get("/api/score", (req, res) => {
  const score = req.cookies.score || 0;
  res.json({ score });
});

app.post("/api/score", (req, res) => {
  res.cookie("score", req.body.score, { maxAge: 900000 });
  res.json({ message: "Score saved!" });
});

app.listen(3000, () => console.log("Server running on port 3000"));