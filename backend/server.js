const express = require('express');
const path = require('path');
const session = require('express-session');
// const cors = require('cors');
const cron = require('node-cron');
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

// Mock database for schedules
const tutorSchedules = [
  {
    id: 1,
    tutorId: 't1',
    courseCode: 'CO3001',
    courseName: 'Software Engineering',
    groupCode: 'CC09',
    day: 'Monday',
    timeSlot: '--34------------',
    teachingWeek: '45',
    room: 'B4-201',
    capacity: 5,
    enrolled: ['s1'],
    status: 'editable', // 'editable' or 'locked'
    createdAt: new Date('2025-11-20')
  },
  {
    id: 2,
    tutorId: 't1',
    courseCode: 'CO3001',
    courseName: 'Software Engineering',
    groupCode: 'CC09',
    day: 'Wednesday',
    timeSlot: '-23-------------',
    teachingWeek: '45',
    room: 'B4-201',
    capacity: 5,
    enrolled: ['s1'],
    status: 'editable',
    createdAt: new Date('2025-11-20')
  }
];

const studentEnrollments = [
  { studentId: 's1', scheduleId: 1, enrolledAt: new Date() },
  { studentId: 's1', scheduleId: 2, enrolledAt: new Date() }
];

// ================== MIDDLEWARE ================== //

function requireLogin(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/login');
}

function requireRole(role) {
  return function (req, res, next) {
    if (req.session && req.session.user && req.session.user.role === role) {
      return next();
    }
    return res.redirect('/');
  };
}

// ================== CRON JOBS / SCHEDULED TASKS ================== //

// 1. Auto-lock schedules 24 hours before class
cron.schedule('0 * * * *', () => {
  console.log('Running hourly schedule lock check...');
  
  const now = new Date();
  
  tutorSchedules.forEach(schedule => {
    if (schedule.status === 'editable') {
      // Calculate next occurrence of this class
      const nextClassTime = getNextClassTime(schedule.day, schedule.timeSlot);
      const hoursDiff = (nextClassTime - now) / (1000 * 60 * 60);
      
      // Lock if less than 24 hours until class
      if (hoursDiff <= 24 && hoursDiff > 0) {
        schedule.status = 'locked';
        console.log(`Locked schedule ${schedule.id} - ${schedule.courseCode}`);
        
        // Notify enrolled students (placeholder)
        notifyStudents(schedule, 'Class starting soon - schedule is now locked');
      }
    }
  });
});

// 2. Send daily reminders for next day's classes
cron.schedule('0 20 * * *', () => {
  console.log('Sending daily class reminders...');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDay = getDayName(tomorrow);
  
  tutorSchedules.forEach(schedule => {
    if (schedule.day === tomorrowDay && schedule.enrolled.length > 0) {
      notifyStudents(schedule, `Reminder: You have ${schedule.courseName} class tomorrow`);
    }
  });
});

// 3. Weekly summary report (every Sunday at 6 PM)
cron.schedule('0 18 * * 0', () => {
  console.log('Generating weekly summary reports...');
  
  // For each student, generate summary
  const students = USERS.filter(u => u.role === 'student');
  students.forEach(student => {
    const enrollments = studentEnrollments.filter(e => e.studentId === student.id);
    const schedules = enrollments.map(e => 
      tutorSchedules.find(s => s.id === e.scheduleId)
    );
    
    const summary = {
      studentName: student.username,
      totalClasses: schedules.length,
      upcomingWeek: schedules.filter(s => isUpcomingWeek(s))
    };
    
    console.log('Weekly summary for', student.username, summary);
    // Send email or notification here
  });
});

// 4. Clean up old schedules (monthly)
cron.schedule('0 0 1 * *', () => {
  console.log('Cleaning up old schedules...');
  
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  // Remove schedules older than 3 months
  for (let i = tutorSchedules.length - 1; i >= 0; i--) {
    if (tutorSchedules[i].createdAt < threeMonthsAgo) {
      console.log(`Removing old schedule: ${tutorSchedules[i].id}`);
      tutorSchedules.splice(i, 1);
    }
  }
});

// ================== HELPER FUNCTIONS ================== //

function getNextClassTime(day, timeSlot) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDayIndex = days.indexOf(day);
  
  const now = new Date();
  const currentDayIndex = now.getDay();
  
  let daysUntil = targetDayIndex - currentDayIndex;
  if (daysUntil <= 0) daysUntil += 7;
  
  const nextClass = new Date(now);
  nextClass.setDate(now.getDate() + daysUntil);
  nextClass.setHours(getStartHour(timeSlot), 0, 0, 0);
  
  return nextClass;
}

function getStartHour(timeSlot) {
  // timeSlot format: '-23-------------' where position indicates period
  // Assuming each period is 1 hour, starting from 7 AM
  const firstPeriod = timeSlot.indexOf('2'); // Find first occurrence
  return 7 + firstPeriod;
}

function getDayName(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

function isUpcomingWeek(schedule) {
  const nextClass = getNextClassTime(schedule.day, schedule.timeSlot);
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return nextClass >= now && nextClass <= weekFromNow;
}

function notifyStudents(schedule, message) {
  // Placeholder for notification system
  schedule.enrolled.forEach(studentId => {
    console.log(`Notify ${studentId}: ${message} for ${schedule.courseCode}`);
    // TODO: Send actual notification (email, push notification, etc.)
  });
}

// ================== STATIC FILES ================== //

app.use(express.static(path.join(__dirname, '../frontend')));

// ================== ROUTES - GIAO DIỆN ================== //

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/LandingPage/LandingPage.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/LoginPage/LoginPage.html'));
});

app.get('/student/home', requireLogin, requireRole('student'), (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/Student_Homepage/Student_Homepage.html'));
});

app.get('/tutor/home', requireLogin, requireRole('tutor'), (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/Tutor_Homepage/Tutor_Homepage.html'));
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// ================== LOGIN ================== //

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const role = req.query.role;

  if (!role || !['student', 'tutor'].includes(role)) {
    return res.redirect('/login?error=1');
  }

  const user = USERS.find(
    (u) => u.username === username && u.password === password && u.role === role
  );

  if (!user) {
    return res.redirect(`/login?role=${role}&error=1`);
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  if (role === 'student') {
    return res.redirect('/student/home');
  } else if (role === 'tutor') {
    return res.redirect('/tutor/home');
  }

  return res.redirect('/');
});

// ================== SCHEDULE API ROUTES ================== //

// Get all schedules for a tutor
app.get('/api/tutor/schedules', requireLogin, requireRole('tutor'), (req, res) => {
  const tutorId = req.session.user.id;
  const schedules = tutorSchedules.filter(s => s.tutorId === tutorId);
  res.json(schedules);
});

// Create new schedule (tutor)
app.post('/api/tutor/schedules', requireLogin, requireRole('tutor'), (req, res) => {
  const tutorId = req.session.user.id;
  const { courseCode, courseName, groupCode, day, timeSlot, teachingWeek, room, capacity } = req.body;
  
  // Check for conflicts
  const conflict = tutorSchedules.find(s => 
    s.tutorId === tutorId && 
    s.day === day && 
    s.timeSlot === timeSlot &&
    s.status !== 'deleted'
  );
  
  if (conflict) {
    return res.status(400).json({ error: 'Time slot conflict detected' });
  }
  
  const newSchedule = {
    id: tutorSchedules.length + 1,
    tutorId,
    courseCode,
    courseName,
    groupCode,
    day,
    timeSlot,
    teachingWeek,
    room,
    capacity: parseInt(capacity),
    enrolled: [],
    status: 'editable',
    createdAt: new Date()
  };
  
  tutorSchedules.push(newSchedule);
  res.json({ success: true, schedule: newSchedule });
});

// Update schedule (tutor)
app.put('/api/tutor/schedules/:id', requireLogin, requireRole('tutor'), (req, res) => {
  const scheduleId = parseInt(req.params.id);
  const schedule = tutorSchedules.find(s => s.id === scheduleId);
  
  if (!schedule) {
    return res.status(404).json({ error: 'Schedule not found' });
  }
  
  if (schedule.tutorId !== req.session.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  if (schedule.status === 'locked') {
    return res.status(400).json({ error: 'Cannot modify locked schedule' });
  }
  
  // Update fields
  Object.assign(schedule, req.body);
  res.json({ success: true, schedule });
});

// Delete schedule (tutor)
app.delete('/api/tutor/schedules/:id', requireLogin, requireRole('tutor'), (req, res) => {
  const scheduleId = parseInt(req.params.id);
  const index = tutorSchedules.findIndex(s => s.id === scheduleId);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Schedule not found' });
  }
  
  if (tutorSchedules[index].tutorId !== req.session.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  if (tutorSchedules[index].status === 'locked') {
    return res.status(400).json({ error: 'Cannot delete locked schedule' });
  }
  
  // Notify enrolled students
  if (tutorSchedules[index].enrolled.length > 0) {
    notifyStudents(tutorSchedules[index], 'Class has been cancelled');
  }
  
  tutorSchedules.splice(index, 1);
  res.json({ success: true });
});

// Get student's enrolled schedules
app.get('/api/student/schedules', requireLogin, requireRole('student'), (req, res) => {
  const studentId = req.session.user.id;
  const enrollments = studentEnrollments.filter(e => e.studentId === studentId);
  
  const schedules = enrollments.map(enrollment => {
    const schedule = tutorSchedules.find(s => s.id === enrollment.scheduleId);
    return {
      ...schedule,
      enrolledAt: enrollment.enrolledAt
    };
  });
  
  res.json(schedules);
});

// Enroll in a schedule (student)
app.post('/api/student/enroll/:scheduleId', requireLogin, requireRole('student'), (req, res) => {
  const scheduleId = parseInt(req.params.scheduleId);
  const studentId = req.session.user.id;
  
  const schedule = tutorSchedules.find(s => s.id === scheduleId);
  
  if (!schedule) {
    return res.status(404).json({ error: 'Schedule not found' });
  }
  
  if (schedule.status === 'locked') {
    return res.status(400).json({ error: 'Schedule is locked' });
  }
  
  if (schedule.enrolled.length >= schedule.capacity) {
    return res.status(400).json({ error: 'Class is full' });
  }
  
  // Check if already enrolled in same course
  const alreadyEnrolled = studentEnrollments.some(e => {
    const s = tutorSchedules.find(sched => sched.id === e.scheduleId);
    return e.studentId === studentId && s && s.courseCode === schedule.courseCode;
  });
  
  if (alreadyEnrolled) {
    return res.status(400).json({ error: 'Already enrolled in this course' });
  }
  
  // Enroll student
  schedule.enrolled.push(studentId);
  studentEnrollments.push({
    studentId,
    scheduleId,
    enrolledAt: new Date()
  });
  
  res.json({ success: true, schedule });
});

// Unenroll from a schedule (student)
app.delete('/api/student/enroll/:scheduleId', requireLogin, requireRole('student'), (req, res) => {
  const scheduleId = parseInt(req.params.scheduleId);
  const studentId = req.session.user.id;
  
  const schedule = tutorSchedules.find(s => s.id === scheduleId);
  
  if (!schedule) {
    return res.status(404).json({ error: 'Schedule not found' });
  }
  
  if (schedule.status === 'locked') {
    return res.status(400).json({ error: 'Cannot unenroll from locked schedule' });
  }
  
  // Remove from schedule
  schedule.enrolled = schedule.enrolled.filter(id => id !== studentId);
  
  // Remove enrollment record
  const enrollIndex = studentEnrollments.findIndex(
    e => e.studentId === studentId && e.scheduleId === scheduleId
  );
  
  if (enrollIndex !== -1) {
    studentEnrollments.splice(enrollIndex, 1);
  }
  
  res.json({ success: true });
});

// Change group (student switching between groups of same course)
app.post('/api/student/change-group', requireLogin, requireRole('student'), (req, res) => {
  const { fromScheduleId, toScheduleId } = req.body;
  const studentId = req.session.user.id;
  
  const fromSchedule = tutorSchedules.find(s => s.id === fromScheduleId);
  const toSchedule = tutorSchedules.find(s => s.id === toScheduleId);
  
  if (!fromSchedule || !toSchedule) {
    return res.status(404).json({ error: 'Schedule not found' });
  }
  
  if (fromSchedule.status === 'locked' || toSchedule.status === 'locked') {
    return res.status(400).json({ error: 'Cannot change locked schedules' });
  }
  
  if (toSchedule.enrolled.length >= toSchedule.capacity) {
    return res.status(400).json({ error: 'Target group is full' });
  }
  
  // Remove from old group
  fromSchedule.enrolled = fromSchedule.enrolled.filter(id => id !== studentId);
  
  // Add to new group
  toSchedule.enrolled.push(studentId);
  
  // Update enrollment record
  const enrollment = studentEnrollments.find(
    e => e.studentId === studentId && e.scheduleId === fromScheduleId
  );
  
  if (enrollment) {
    enrollment.scheduleId = toScheduleId;
    enrollment.enrolledAt = new Date();
  }
  
  res.json({ success: true });
});

// Get available schedules for enrollment (student)
app.get('/api/schedules/available', requireLogin, requireRole('student'), (req, res) => {
  const { courseCode } = req.query;
  
  let available = tutorSchedules.filter(s => 
    s.status === 'editable' && 
    s.enrolled.length < s.capacity
  );
  
  if (courseCode) {
    available = available.filter(s => s.courseCode === courseCode);
  }
  
  res.json(available);
});

// ================== START SERVER ================== //

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// ================== START SERVER ================== //

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
