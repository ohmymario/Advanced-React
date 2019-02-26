const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: 'variables.env' });
const creatServer = require('./createServer');
const db = require('./db');


const server = creatServer();

// Use express middleware to handle cookies (JWT)
server.express.use(cookieParser());

// Decode JWT for userId value in all requests
// userId value is given to cookie when signing up and signing in
server.express.use((req, res, next) => {
  // Grab Token from request
  const { token } = req.cookies;
  // Check for token and decode it
  if(token) {
    // App secret prevents tampering
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    // Put the userId from token on each request for future requests to access
    req.userId = userId;
  }
  next();
});

server.start(
  {
  cors: {
    // Only allow permitted website to access server
    credentials: true,
    origin: process.env.FRONTEND_URL
  },
  },
  deets => {
    console.log(`Server is now running on port http://localhost:${deets.port}`);
    // console.log(JSON.stringify(deets));
  }
);