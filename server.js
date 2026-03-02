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

let currentUser = {
  name: null,
  theme: "light",
  score: 0
};

app.post("/api/user", (req, res) => {
  const name = req.body.name;
  if(!name) return res.status(400).json({error:"No name"});

  // Save to cookie (lasts 30 days)
  res.cookie("username", name, { maxAge: 1000*60*60*24*30 });

  res.json({ success:true });
});
app.get("/api/user", (req, res) => {
  res.json(currentUser);
});

app.get("/api/user", (req, res) => {
  const name = req.cookies.username || null;
  res.json({ name });
});


app.post("/api/theme",(req,res)=>{
  const theme=req.body.theme || "light";
  res.cookie("theme",theme,{maxAge:1000*60*60*24*30});
  res.json({success:true});
});

app.get("/api/theme",(req,res)=>{
  res.json({theme:req.cookies.theme || "light"});
});
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
app.get("/api/score",(req,res)=>{
  res.json({score:req.cookies.score || 0});
});

app.post("/api/score",(req,res)=>{
  const score=req.body.score || 0;
  res.cookie("score",score,{maxAge:1000*60*60*24*30});
  res.json({success:true});
});

app.listen(3000, () => console.log("Server running on port 3000"));