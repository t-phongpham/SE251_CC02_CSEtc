const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Để đọc JSON/form data nếu cần
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Ví dụ API test
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

// Ví dụ nhận form
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  console.log('Contact form:', name, email, message);
  res.json({ status: 'ok', msg: 'Đã nhận form!' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
