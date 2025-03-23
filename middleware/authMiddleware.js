const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.cookies.jwt; // ✅ Get token from HttpOnly cookie

  if (!token) {
    return res.status(401).json({ msg: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // ✅ Attach user data to `req.user`
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
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
