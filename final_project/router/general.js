const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (isValid(username)) {
    return res.status(400).json({ message: "Username already exists" });
  }

  users.push({ username, password });
  return res.status(200).json({ message: "User registered successfully" });
});

public_users.get('/', function (req, res) {
  const bookList = Object.values(books);

  if (bookList.length === 0) {
    return res.status(404).json({ message: "No books available" });
  }

  return res.status(200).json(bookList);
});

// Task 7: Login as a Registered user
public_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Check if username and password are provided
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ message: "Invalid username" });
  }

  if (user.password !== password) {
    return res.status(401).json({ message: "Invalid password" });
  }

  // Create a JWT token if login is successful
  const token = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });

  return res.status(200).json({ message: "Login successful", token });
});

const authenticateUser = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: "Access denied, no token provided" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;  // Storing user information from the token
    next();  // Proceed to the next middleware or route handler
  });
};

// Task 8: Add or Modify a book review
regd_users.put("/auth/review/:isbn", authenticateUser, (req, res) => {
  const { isbn } = req.params;
  const { review } = req.body;  
  const username = req.user.username; 

  if (!review) {
    return res.status(400).json({ message: "Review text is required" });
  }

  // Find the book by ISBN
  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  // Add or update the review for the book (based on the username)
  book.reviews[username] = review;

  return res.status(200).json({ message: "Review added/modified successfully", book });
});

// Task 9: Delete a book review added by the user
regd_users.delete("/auth/review/:isbn", authenticateUser, (req, res) => {
  const { isbn } = req.params;
  const username = req.user.username;  // Get the username from the JWT payload

  // Find the book by ISBN
  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  // Check if the user has a review for this book
  if (!book.reviews[username]) {
    return res.status(404).json({ message: "Review not found for this book" });
  }

  // Delete the review
  delete book.reviews[username];

  return res.status(200).json({ message: "Review deleted successfully", book });
});

const getAllBooks = async (callback) => {
  try {
    setTimeout(() => {
      callback(null, books);  // Simulating fetching books
    }, 1000);
  } catch (error) {
    callback(error, null);
  }
};

regd_users.get("/auth/books", (req, res) => {
  getAllBooks((error, result) => {
    if (error) {
      return res.status(500).json({ message: "Error fetching books", error });
    }
    return res.status(200).json({ books: result });
  });
});

const searchByISBN = (isbn) => {
  return new Promise((resolve, reject) => {
    if (books[isbn]) {
      resolve(books[isbn]);  // Resolve with the book data if found
    } else {
      reject("Book not found");  // Reject with an error message if not found
    }
  });
};

regd_users.get("/auth/isbn/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  searchByISBN(isbn)
    .then((book) => {
      res.status(200).json({ book });
    })
    .catch((error) => {
      res.status(404).json({ message: error });
    });
});

// Search by Author – Using Promises
const searchByAuthor = (author) => {
  return new Promise((resolve, reject) => {
    const foundBooks = Object.values(books).filter(book => book.author.toLowerCase().includes(author.toLowerCase()));
    if (foundBooks.length > 0) {
      resolve(foundBooks);  // Resolve with the books by the author
    } else {
      reject("No books found for this author");  // Reject if no books are found
    }
  });
};

regd_users.get("/auth/author/:author", (req, res) => {
  const author = req.params.author;
  searchByAuthor(author)
    .then((booksByAuthor) => {
      res.status(200).json({ books: booksByAuthor });
    })
    .catch((error) => {
      res.status(404).json({ message: error });
    });
});


public_users.get('/isbn/:isbn', function (req, res) {
  const { isbn } = req.params;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json(book);
});

public_users.get('/', (req, res) => {
  res.json(books);
});



// Task 2: Get book details based on ISBN
public_users.get('/isbn/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  
  // Find the book by ISBN (ID in this case)
  const book = books[isbn];

  if (book) {
    res.json(book);  // Return the book details if found
  } else {
    res.status(404).json({ message: "Book not found" });  // Return error if the book is not found
  }
});

// Task 3: Get book details based on author
public_users.get('/author/:author', (req, res) => {
  const author = req.params.author.toLowerCase();
  const booksByAuthor = Object.values(books).filter(book => book.author.toLowerCase().includes(author));

  if (booksByAuthor.length > 0) {
    res.json(booksByAuthor);  // Return the list of books by the author
  } else {
    res.status(404).json({ message: "No books found by this author" });  // Return error if no books found
  }
});

// Task 4: Get all books based on Title
public_users.get('/title/:title', (req, res) => {
  const title = req.params.title.toLowerCase();
  
  // Filter books where the title matches the request
  const booksByTitle = Object.values(books).filter(book => book.title.toLowerCase().includes(title));

  if (booksByTitle.length > 0) {
    res.json(booksByTitle);
  } else {
    res.status(404).json({ message: "No books found with this title" });
  }
});

// Search by Title – Using Promises
const searchByTitle = (title) => {
  return new Promise((resolve, reject) => {
    const foundBooks = Object.values(books).filter(book => book.title.toLowerCase().includes(title.toLowerCase()));
    if (foundBooks.length > 0) {
      resolve(foundBooks);  // Resolve with the books that match the title
    } else {
      reject("No books found with this title");  // Reject if no books are found
    }
  });
};

regd_users.get("/auth/title/:title", (req, res) => {
  const title = req.params.title;
  searchByTitle(title)
    .then((booksByTitle) => {
      res.status(200).json({ books: booksByTitle });
    })
    .catch((error) => {
      res.status(404).json({ message: error });
    });
});


// Task 5: Get book review
public_users.get('/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    // Check if reviews exist for the book
    if (Object.keys(book.reviews).length > 0) {
      res.json(book.reviews);
    } else {
      res.status(404).json({ message: "No reviews found for this book" });
    }
  } else {
    res.status(404).json({ message: "Book not found" });
  }
});



public_users.get('/author/:author', function (req, res) {
  const { author } = req.params;
  const booksByAuthor = Object.values(books).filter(b => b.author.toLowerCase().includes(author.toLowerCase()));

  if (booksByAuthor.length === 0) {
    return res.status(404).json({ message: "No books found by this author" });
  }

  return res.status(200).json(booksByAuthor);
});

public_users.get('/title/:title', function (req, res) {
  const { title } = req.params;
  const booksByTitle = Object.values(books).filter(b => b.title.toLowerCase().includes(title.toLowerCase()));

  if (booksByTitle.length === 0) {
    return res.status(404).json({ message: "No books found with this title" });
  }

  return res.status(200).json(booksByTitle);
});

public_users.get('/review/:isbn', function (req, res) {
  const { isbn } = req.params;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  if (Object.keys(book.reviews).length === 0) {
    return res.status(404).json({ message: "No reviews available for this book" });
  }

  return res.status(200).json(book.reviews);
});

module.exports.general = public_users;
