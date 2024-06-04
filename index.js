import pg from "pg";
import express from "express";
import bodyParser from "body-parser";

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

let user = "Nicholas";

app.get("/", async (req, res) => {
  const name = await db.query("SELECT id from users WHERE name = $1", [user]);
  const id = name.rows[0];
  const result = await db.query("SELECT * FROM books WHERE user_id = $1", [
    id.id,
  ]);
  let books = [];
  result.rows.forEach((book) => {
    books.push(book);
  });
  res.render("index.ejs", {
    listBooks: books,
  });
});

app.post("/add", async (req, res) => {
  const result = await db.query("SELECT id from users WHERE name = $1", [user]);
  const id = result.rows[0];
  const isbn = parseInt(req.body.isbn);
  const rating = parseInt(req.body.rating);
  const notes = req.body.notes;
  console.log(isbn);
  console.log(notes);
  try {
    await db.query(
      "INSERT INTO books (user_id, rating, notes, isbn) VALUES ($1, $2, $3, $4)",
      [id.id, rating, notes, isbn]
    );
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
