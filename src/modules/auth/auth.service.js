const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authModel = require('./auth.model');

class AuthService {
  async login(email, password) {
    const user = await authModel.findWithRole(email);
    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new Error('Account is not active');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  }

  async socialLogin({ email, fullName, profileImage, authProvider, providerId }) {
    if (!email) {
      throw new Error('Email is required for social login');
    }

    const pool = require('../../database/connection');

    // 1. Check if user already exists by email
    let [users] = await pool.execute(`
      SELECT u.*, r.role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.email = ? AND u.deletedAt IS NULL
    `, [email]);

    let user;
    if (users.length > 0) {
      user = users[0];
      // Update provider information if not set
      if (!user.authProvider || !user.providerId) {
        await pool.execute(
          'UPDATE users SET authProvider = ?, providerId = ?, profileImage = COALESCE(profileImage, ?), last_login = NOW() WHERE id = ?',
          [authProvider, providerId, profileImage, user.id]
        );
        user.authProvider = authProvider;
        user.providerId = providerId;
        if (!user.profileImage) user.profileImage = profileImage;
      } else {
        await pool.execute(
          'UPDATE users SET last_login = NOW() WHERE id = ?',
          [user.id]
        );
      }
    } else {
      // 2. User doesn't exist, create a new customer account
      const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      const [insertResult] = await pool.execute(
        'INSERT INTO users (full_name, email, password, role_id, status, authProvider, providerId, profileImage, last_login) VALUES (?, ?, ?, 6, "active", ?, ?, ?, NOW())',
        [fullName || 'Gila House Guest', email, hashedPassword, authProvider, providerId, profileImage]
      );
      
      const newUserId = insertResult.insertId;
      
      // Fetch newly created user with role
      const [newUsers] = await pool.execute(`
        SELECT u.*, r.role_name 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.id = ?
      `, [newUserId]);
      
      user = newUsers[0];
    }

    // 3. Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Remove password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  }
}

module.exports = new AuthService();
