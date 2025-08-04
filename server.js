require('dotenv').config();
// Allowed origins for CORS
const LOCAL_URL = 'http://localhost:3000';
const CLIENT_URL = process.env.CLIENT_URL; // https://nrglines.com
const WWW_CLIENT_URL = process.env.WWW_CLIENT_URL; // https://www.nrglines.com
const allowedOrigins = [LOCAL_URL, CLIENT_URL, WWW_CLIENT_URL].filter(Boolean);

const express = require('express');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// Import Routes
const articlesRoutes = require('./routes/articles');
const signupRoutes = require('./routes/auth/signup');
const signinRoutes = require('./routes/auth/signin');
const authRoutes = require('./routes/auth/auth');
const profileRoutes = require('./routes/profile');
const eventRoutes = require('./routes/events');
const { router: chatRoutes, socketHandler } = require('./routes/chat');

const app = express();
const server = http.createServer(app);

// Serve static files from the uploads folder so media can be accessed in the browser
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ✅ Setup Socket.IO
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'), false);
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
socketHandler(io);

// ✅ CORS and Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(bodyParser.json());

// ✅ MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'nrg_annex',
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    console.log(`🛢️ Connected to DB: ${mongoose.connection.name}`);
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ Routes
app.use('/api/auth/signup', signupRoutes);
app.use('/api/auth/signin', signinRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/chat', chatRoutes);

// ✅ Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
