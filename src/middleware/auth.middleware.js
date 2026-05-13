const jwt = require('jsonwebtoken');
const pool = require('../database/connection');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token required'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.execute(`
      SELECT u.id, u.full_name, u.email, u.role_id, r.role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ? AND u.deletedAt IS NULL
    `, [decoded.id]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: ' + err.message
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = (req.user.role_name || '').trim().toLowerCase();
    const authorizedRoles = roles.flat().map(r => String(r).trim().toLowerCase());
    
    // Check by name or common role IDs (1=admin, 2=manager)
    const isAdmin = authorizedRoles.includes('admin') && (userRole === 'admin' || req.user.role_id === 1);
    const isManager = authorizedRoles.includes('manager') && (userRole === 'manager' || req.user.role_id === 2);

    if (authorizedRoles.includes(userRole) || isAdmin || isManager) {
      return next();
    }

    console.warn(`[Auth Check] Denied: User ID ${req.user.id}, role "${userRole}", role_id ${req.user.role_id}. Required: ${JSON.stringify(authorizedRoles)}`);
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You do not have access to this resource'
    });
  };
};

module.exports = {
  authenticate,
  authorize
};
