const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();
require('dotenv').config();  // Load environment variables

let users = [];

const isValid = (username) => {
  // Check if the username is valid (e.g., non-empty and exists in the users array)
  return users.some(user => user.username === username);
}

const authenticatedUser = (username, password) => {
  // Check if the username and password match the one in records
  const user = users.find(user => user.username === username && user.password === password);
  return user !== undefined;
}

// only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!isValid(username)) {
    return res.status(401).json({ message: "Invalid username" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(403).json({ message: "Invalid credentials" });
  }

  // Generate JWT token using the secret key from environment variables
  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });

  return res.status(200).json({ message: "Login successful", token });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).json({ message: "Token is required for authentication" });
  }

  // Verify the token using the secret key from environment variables
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    const { username } = decoded;
    const { isbn } = req.params;
    const { review } = req.body;

    if (!review) {
      return res.status(400).json({ message: "Review is required" });
    }

    // Find the book and add the review
    const book = books.find(book => book.isbn === isbn);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    book.reviews.push({ username, review });

    return res.status(200).json({ message: "Review added successfully", book });
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
