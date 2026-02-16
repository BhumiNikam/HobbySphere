const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

app.set('trust proxy', 1);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

connectDB();

mongoose.connection.once('open', async () => {
  console.log('✅ MongoDB Connected');
  
  try {
    await Promise.all([
      mongoose.model('Community').createIndexes(),
      mongoose.model('Post').createIndexes(),
      mongoose.model('User').createIndexes()
    ]);
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Index creation error:', error);
  }
});

app.use(compression());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const userSockets = new Map();

io.on('connection', (socket) => {
  socket.on('register', (userId) => {
    userSockets.set(userId, socket.id);
  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});

app.set('io', io);
app.set('userSockets', userSockets);

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/communities', require('./routes/communityRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/posts', require('./routes/commentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/bookmarks', require('./routes/bookmarkRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'HobbySphere API running' });
});

app.get("/test-email", async (req, res) => {
  const { sendPasswordResetEmail } = require("./services/emailService");

  try {
    await sendPasswordResetEmail(
      "aniketkasav07@gmail.com",
      "Aniket",
      "Hashed-07"
    );
    res.send("Email sent");
  } catch (err) {
    console.error(err);
    res.status(500).send("Email failed");
  }
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server running on port ${PORT}`);
  }
});