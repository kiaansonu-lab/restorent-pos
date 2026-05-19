const authService = require('./auth.service');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      const result = await authService.login(email, password);

      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (err) {
      res.status(401).json({
        success: false,
        message: err.message
      });
    }
  }

  async getMe(req, res) {
    // req.user is set by auth middleware
    res.json({
      success: true,
      message: 'User data fetched successfully',
      data: req.user
    });
  }

  async googleLogin(req, res) {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return res.status(400).json({ success: false, message: 'Google ID Token is required' });
      }

      // Verify Google token using tokeninfo endpoint
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!googleRes.ok) {
        throw new Error('Google token verification failed');
      }
      
      const payload = await googleRes.json();
      if (payload.error_description) {
        throw new Error(payload.error_description);
      }

      const { email, name, picture, sub } = payload;

      const result = await authService.socialLogin({
        email,
        fullName: name,
        profileImage: picture,
        authProvider: 'google',
        providerId: sub
      });

      res.json({
        success: true,
        message: 'Google login successful',
        data: result
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }

  async appleLogin(req, res) {
    try {
      const { idToken, user } = req.body;
      if (!idToken) {
        return res.status(400).json({ success: false, message: 'Apple ID Token is required' });
      }

      const jwt = require('jsonwebtoken');
      const decodedToken = jwt.decode(idToken);
      if (!decodedToken) {
        throw new Error('Invalid Apple Token structure');
      }

      // Check token expiration
      if (decodedToken.exp && Date.now() >= decodedToken.exp * 1000) {
        throw new Error('Apple Token has expired');
      }

      const email = decodedToken.email;
      const sub = decodedToken.sub; // unique Apple user ID

      let fullName = 'Apple User';
      if (user && user.name) {
        fullName = `${user.name.firstName || ''} ${user.name.lastName || ''}`.trim() || fullName;
      }

      const result = await authService.socialLogin({
        email,
        fullName,
        profileImage: null,
        authProvider: 'apple',
        providerId: sub
      });

      res.json({
        success: true,
        message: 'Apple login successful',
        data: result
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }
}

module.exports = new AuthController();
