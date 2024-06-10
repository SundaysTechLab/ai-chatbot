// authUtils.js
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
    return jwt.sign({ userId }, '1X0t7pZk$fjG@^3rM#DLn6qA9C!eH5sJ', { expiresIn: '24h' });
};

module.exports = generateToken;
