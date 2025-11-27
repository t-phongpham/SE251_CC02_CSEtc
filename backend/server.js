const express = require('express');
const path = require('path');
const session = require('express-session');
// const cors = require('cors');

const app = express();
const PORT = 3000;

// Đọc JSON / form-data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session để nhớ user đã đăng nhập
app.use(
  session({
    secret: 'secret-key-123', // đổi thành chuỗi bất kỳ
    resave: false,
    saveUninitialized: false,
  })
);

// Hardcode tài khoản (ví dụ)
const USERS = [
  { username: 'student', password: '123456', role: 'student' },
  { username: 'tutor', password: '654321', role: 'tutor' },
];

// Middleware: bắt buộc login
function requireLogin(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/login');
}

// Middleware: kiểm tra đúng role
function requireRole(role) {
  return function (req, res, next) {
    if (req.session && req.session.user && req.session.user.role === role) {
      return next();
    }
    return res.redirect('/');
  };
}

// Serve toàn bộ frontend như static (giữ nguyên như bạn)
app.use(express.static(path.join(__dirname, '../frontend')));

// ================== ROUTES GIAO DIỆN ================== //

// LandingPage – public
app.get('/', (req, res) => {
  res.sendFile(
    path.join(__dirname, '../frontend/LandingPage/LandingPage.html')
  );
});

// LoginPage – public
app.get('/login', (req, res) => {
  res.sendFile(
    path.join(__dirname, '../frontend/LoginPage/LoginPage.html')
  );
});

// Student homepage – cần login + đúng role
app.get(
  '/student/home',
  requireLogin,
  requireRole('student'),
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        '../frontend/Student_Homepage/Student_Homepage.html'
      )
    );
  }
);

// Tutor homepage – cần login + đúng role
app.get(
  '/tutor/home',
  requireLogin,
  requireRole('tutor'),
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        '../frontend/Tutor_Homepage/Tutor_Homepage.html'
      )
    );
  }
);

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// ================== ROUTE XỬ LÝ LOGIN ================== //

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const role = req.query.role; // lấy từ ?role=student / ?role=tutor

  // Nếu không có role (vào /login trực tiếp) thì xem là lỗi
  if (!role || !['student', 'tutor'].includes(role)) {
    return res.redirect('/login?error=1');
  }

  const user = USERS.find(
    (u) => u.username === username && u.password === password && u.role === role
  );

  if (!user) {
    // Sai username/password hoặc không khớp role
    return res.redirect(`/login?role=${role}&error=1`);
  }

  // Lưu user vào session
  req.session.user = {
    username: user.username,
    role: user.role,
  };

  // Điều hướng theo role
  if (role === 'student') {
    return res.redirect('/student/home');
  } else if (role === 'tutor') {
    return res.redirect('/tutor/home');
  }

  return res.redirect('/');
});

// ================== API VÍ DỤ ================== //

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  console.log('Contact form:', name, email, message);
  res.json({ status: 'ok', msg: 'Đã nhận form!' });
});

// Sắp xếp lịch
//trường hợp 1: xếp lịch cho tutor
//TODO

//trường hợp 2: xếp lịch cho student
//TODO

// ================== START SERVER ================== //

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
