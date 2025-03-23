require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // ✅ Import cookie-parser
const bodyParser = require('body-parser');

// Import Routes
const articlesRoutes = require('./routes/articles');
const signupRoutes = require('./routes/auth/signup');
const signinRoutes = require('./routes/auth/signin');
const authRoutes = require('./routes/auth/auth');
const profileRoutes = require('./routes/profile');
const eventRoutes = require('./routes/events');

const app = express();

// ✅ CORS Configuration
app.use(
  cors({
    origin: 'http://localhost:3000', // Allow frontend requests
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // ✅ Allow cookies in requests
  })
);

// ✅ Middleware
app.use(cookieParser()); // ✅ Required to read HttpOnly cookies
app.use(bodyParser.json());

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ Routes (No changes to access levels)
app.use('/api/auth/signup', signupRoutes);
app.use('/api/auth/signin', signinRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/events', eventRoutes);

// ✅ Server Listener
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
