/////////////////////////////
// BOOK API INTERACTIONS
/////////////////////////////

// Load all books onto the books page
async function loadBooks() {
  const container = document.getElementById("books");
  if (!container) return;

  const res = await fetch("/api/books");
  const data = await res.json();

  container.innerHTML = "";

   }

  data.forEach(book => {
  const div = document.createElement("div");
  div.className = "card";

  div.innerHTML = `
    <div class="book-card">
      <img src="${book.image}" alt="Cover of ${book.title}">
      <h3>${book.title}</h3>
      <p>${book.genre}</p>
      <p class="tag">${book.list}</p>

      <button onclick="deleteBook(${book.id})">Delete</button>
      <button onclick="updateBook(${book.id})">Rename</button>
      <a href="books.html?id=${book.id}">View</a>
    </div>
  `;

  container.appendChild(div);
});


async function addBook(){
  const title=document.getElementById("titleInput").value;
  const genre=document.getElementById("genreInput").value;
  const image=document.getElementById("imageInput").value;
  const list=document.getElementById("listInput").value;

  await fetch("/api/books",{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({title,genre,image,list})
  });

  loadBooks();
}


// UPDATE book
async function updateBook(id) {
  const newTitle = prompt("New title?");
  if (!newTitle) return;

  await fetch("/api/books/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: newTitle })
  });

  loadBooks();
}


// DELETE book
async function deleteBook(id) {
  await fetch("/api/books/" + id, { method: "DELETE" });
  loadBooks();
}



/////////////////////////////
// URL PARAMETER HANDLING
/////////////////////////////

async function loadSingleBookFromURL() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  const res = await fetch("/api/books/" + id);
  if (res.status !== 200) return;

  const book = await res.json();

  const detail = document.getElementById("bookDetail");
  if (detail) {
    detail.innerHTML = `
      <div class="card">
        <h2>${book.title}</h2>
        <p>Genre: ${book.genre}</p>
      </div>
    `;
  }
}



/////////////////////////////
// GUESS THE PLOT GAME
/////////////////////////////

const questions = [
  {
    text: "A boy discovers he is a wizard and attends a magical school.",
    answer: "Harry Potter"
  },
  {
    text: "A teen learns he is the son of a Greek god.",
    answer: "Percy Jackson"
  },
  {
    text: "A girl volunteers for a deadly televised competition.",
    answer: "The Hunger Games"
  }
];

let currentQ = null;
let score = 0;

function loadQuestion() {
  const qBox = document.getElementById("question");
  if (!qBox) return;

  currentQ = questions[Math.floor(Math.random() * questions.length)];
  qBox.textContent = currentQ.text;
}

async function guess(choice) {
  if (!currentQ) return;

  if (choice === currentQ.answer) {
    alert("Correct!");
    score++;
  } else {
    alert("Wrong!");
  }

  // Save score to cookie via backend
  await fetch("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ score })
  });

  loadQuestion();
}


// Load saved cookie score
async function loadScore() {
  const res = await fetch("/api/score");
  const data = await res.json();
  score = data.score || 0;

  const scoreBox = document.getElementById("score");
  if (scoreBox) scoreBox.textContent = "Score: " + score;
}



/////////////////////////////
// AUTO-RUN WHEN PAGE LOADS
/////////////////////////////

window.addEventListener("DOMContentLoaded", () => {
  loadBooks();
  loadSingleBookFromURL();
  loadQuestion();
  loadScore();
  loadUser();  
});

function saveUser(){
  const name=document.getElementById("usernameInput").value;
  if(!name) return alert("Enter a name");

  fetch("/api/user",{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name})
  });
}
  
async function loadUser(){
  const res = await fetch("/api/user");
  const user = await res.json();

  if(user.name){
    const banner = document.getElementById("currentUser");
    if(banner){
      banner.textContent = "Profile: " + user.name;
    }
  }


  document.getElementById("currentUser").textContent="Profile: "+name;
}

async function setTheme(theme){
  document.body.classList.toggle("dark", theme==="dark");

  await fetch("/api/theme",{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({theme})
  });
}

async function loadUser(){
  const res = await fetch("/api/user");
  const user = await res.json();

  if(user.name){
    const banner=document.getElementById("currentUser");
    if(banner) banner.textContent="Profile: "+user.name;
  }

  // Load theme
  const themeRes=await fetch("/api/theme");
  const themeData=await themeRes.json();
  document.body.classList.toggle("dark",themeData.theme==="dark");
}
