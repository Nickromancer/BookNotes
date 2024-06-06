import pg from "pg";
import express, { response } from "express";
import bodyParser from "body-parser";
import axios from "axios";
const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "bookNotes",
  password: "Scooby160901",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let userId = -1;
let userName;

async function getUserBooks() {
  const result = await db.query("SELECT * FROM books WHERE user_id = $1", [
    userId,
  ]);
  let books = [];
  result.rows.forEach((book) => {
    books.push(book);
  });
  return books;
}

async function editBook() {
  console.log("Hello");
}

app.get("/", async (req, res) => {
  const books = await getUserBooks();
  res.render("index.ejs", {
    listBooks: books,
    name: userName,
  });
});

app.get("/login", async (req, res) => {
  try {
    const name = req.query.name;
    const password = req.query.password;
    const result = await db.query(
      "SELECT id from users WHERE name = $1 AND password = $2",
      [name, password]
    );
    userId = result.rows[0].id;
    userName = name;
    console.log(userId);
    res.render("index.ejs", {
      name: userName,
      listBooks: await getUserBooks(),
    });
  } catch (err) {
    res.render("index.ejs", {
      error: "Your email or password were incorrect.",
      listBooks: await getUserBooks(),
    });
  }
});

app.get("/signout", (req, res) => {
  userId = -1;
  userName = "";
  res.redirect("/");
});

app.get("/signup", async (req, res) => {
  const name = req.query.name;
  const password = req.query.password;
  try {
    let result = await db.query(
      "INSERT INTO users (name, password) VALUES ($1, $2)",
      [name, password]
    );
    result = await db.query(
      "SELECT id from users WHERE name = $1 AND password = $2",
      [name, password]
    );
    userId = result.rows[0].id;
    res.render("index.ejs", {
      name: name,
      listBooks: await getUserBooks(),
    });
  } catch (err) {
    res.render("index.ejs", {
      error: "Name already exists.",
      listBooks: await getUserBooks(),
    });
  }
});

app.post("/add", async (req, res) => {
  const isbn = parseInt(req.body.isbn);
  const rating = parseInt(req.body.rating);
  const notes = req.body.notes;
  try {
    const response = await axios.get(
      "https://covers.openlibrary.org/b/isbn/ " + isbn + "-M.jpg?default=false"
    );

    await db.query(
      "INSERT INTO books (user_id, rating, notes, isbn) VALUES ($1, $2, $3, $4)",
      [userId, rating, notes, isbn]
    );
    res.redirect("/");
  } catch (err) {
    console.error("Failed to create book:", err.message);
    res.render("index.ejs", {
      name: userName,
      error: "That book can't be found.",
      listBooks: await getUserBooks(userId),
    });
  }
});

app.get("/delete", async (req, res) => {
  const isbn = req.query.isbn;
  try {
    await db.query(
      "DELETE FROM books WHERE books.isbn = $1 AND books.user_id = $2",
      [isbn, userId]
    );
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
});

app.get("/edit", async (req, res) => {
  const isbn = req.query.isbn;
  const rating = req.query.rating;
  const notes = req.query.notes;
  await db.query("UPDATE books SET rating = $1, notes = $2 WHERE isbn = $3", [
    rating,
    notes,
    isbn,
  ]);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
