// authMiddleware.js
const generateToken = require('./authUtils'); // Import the generateToken function
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    console.log('Authenticating request...');
  // Get token from request headers
  const authHeader = req.headers.authorization;
  console.log('Full Authorization header:', authHeader); // Log the full Authorization header

  // Remove Bearer from string
  const token = authHeader.replace("Bearer ", "");
  console.log('Token after stripping prefix:', token); // Log the token after stripping the prefix

  // Check if token is provided
  if (!token) {
      return res.status(401).json({ message: 'No token provided. Unauthorized.' });
  }

  try {
      // Verify token
      const decoded = jwt.verify(token, '1X0t7pZk$fjG@^3rM#DLn6qA9C!eH5sJ');

      // Log the decoded token payload
      console.log('Decoded token payload:', decoded);

      // Attach user information to request object
      req.user = decoded;

      // Proceed to the next middleware or route handler
      next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
        const newToken = generateToken(req.user.userId);
        res.setHeader('Authorization', `Bearer ${newToken}`);
        return next();
    } else {
      console.error('Error verifying token:', error);
      return res.status(401).json({ message: 'Invalid token. Unauthorized.' });
    }
  }
};

module.exports = authenticate;
