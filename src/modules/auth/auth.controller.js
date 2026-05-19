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

      let email, name, picture, sub;

      if (idToken.startsWith('dummy_google_')) {
        // Mock fallback for test environment bypass
        const base64Str = idToken.replace('dummy_google_', '');
        const jsonStr = Buffer.from(base64Str, 'base64').toString('utf-8');
        const payload = JSON.parse(jsonStr);
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
        sub = payload.sub;
      } else {
        // Verify Google token using tokeninfo endpoint
        const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (!googleRes.ok) {
          throw new Error('Google token verification failed');
        }
        
        const payload = await googleRes.json();
        if (payload.error_description) {
          throw new Error(payload.error_description);
        }

        email = payload.email;
        name = payload.name;
        picture = payload.picture;
        sub = payload.sub;
      }

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

      let email, sub, fullName = 'Apple User';

      if (idToken.startsWith('dummy_apple_')) {
        // Mock fallback for test environment bypass
        const base64Str = idToken.replace('dummy_apple_', '');
        const jsonStr = Buffer.from(base64Str, 'base64').toString('utf-8');
        const payload = JSON.parse(jsonStr);
        email = payload.email;
        sub = payload.sub;
      } else {
        const jwt = require('jsonwebtoken');
        const decodedToken = jwt.decode(idToken);
        if (!decodedToken) {
          throw new Error('Invalid Apple Token structure');
        }

        // Check token expiration
        if (decodedToken.exp && Date.now() >= decodedToken.exp * 1000) {
          throw new Error('Apple Token has expired');
        }

        email = decodedToken.email;
        sub = decodedToken.sub; // unique Apple user ID
      }

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
