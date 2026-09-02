const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { username, password } = req.body;

  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const jwtSecret = process.env.JWT_SECRET || 'alokana_dashboard_admin_jwt_secret_key_2026_x987';

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Please provide both username and password' });
  }

  if (username === adminUser && password === adminPass) {
    const token = jwt.sign(
      { username: adminUser, role: 'admin' },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        username: adminUser,
        role: 'admin',
      },
    });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
};

const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};

module.exports = {
  login,
  getMe,
};
