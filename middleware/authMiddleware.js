const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.cookies?.jwt; // ✅ Optional chaining for safety
  console.log('🍪 Incoming JWT Cookie:', token);

  if (!token) {
    return res.status(401).json({ msg: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.user?.id && !decoded?.user?._id) {
      return res.status(401).json({ msg: 'Malformed token payload' });
    }

    req.user = {
      _id: decoded.user._id || decoded.user.id, // fallback to `id`
      role: decoded.user.role,
    };

    console.log('🧠 Authenticated user:', req.user);
    next();
  } catch (err) {
    console.error('❌ JWT Error:', err.message);
    return res.status(401).json({ msg: 'Invalid token' });
  }
};

// ✅ Admin-only middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied: Admins only' });
  }
  next();
};

module.exports = { authMiddleware, isAdmin };
