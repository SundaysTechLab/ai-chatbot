//1. Import Necessay Dependencies/Modules

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const authenticate = require('./authMiddleware');
const User = require('../models/User');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const Tagger = require('wink-pos-tagger');
const tagger = new Tagger();

// 2. Initialize Express Application
const app = express();

// 3. Middleware Setup for parsing, session handling & cross-origin request
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // Use bodyParser middleware to parse JSON requests
  app.use(bodyParser.json());
  app.use(cors());

  // Initialize and configure express-session
  app.use(session({
    secret: '1X0t7pZk$fjG@^3rM#DLn6qA9C!eH5sJ', // Secret key for session encryption
    resave: false,
    saveUninitialized: true
  }));

// 4. Middleware to authenticate admins
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

  const token = authHeader.split(' ')[1]; // Assuming the format "Bearer <token>"
  jwt.verify(token, '1X0t7pZk$fjG@^3rM#DLn6qA9C!eH5sJ', async (err, payload) => {
      if (err) return res.status(403).json({ message: 'Forbidden' });
      
      try {
          const user = await User.findById(payload.userId);
          if (!user ||!user.isAdmin) return res.status(403).json({ message: 'Forbidden' });
          
          req.user = user; // Attach user to request object for further processing
          next(); // Proceed to the route handler
      } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Internal Server Error' });
      }
  });
}

// 5. Serve static files from the 'frontend' directory
const frontendPath = path.join(__dirname, '..', 'frontend');
console.log('Frontend path:', frontendPath);
app.use(express.static(frontendPath));

// 5a. Define routes for each HTML page
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, 'frontend') });
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(frontendPath, 'profile.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(frontendPath, 'chat.html'));
});

app.get('/admin/signup', (req, res) => {
  res.sendFile('admin-signup.html', { root: frontendPath });
});

app.get('/admin/login', (req, res) => {
  res.sendFile('admin-login.html', { root: frontendPath });
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile('admin-dashboard.html', { root: frontendPath });
});

// 6. Authentication Setup for User Login & Logout Routes
// 6a. Login Endpoint
app.post('/login', async (req, res) => {
  // Extract email and password from the request body
  const { email, password } = req.body;
    console.log('Login attempt with email:', email);
    console.log('Login attempt successful with email:', email)


  try {
    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

     // Verify password
     const isMatch = await bcrypt.compare(password, user.password);
     if (!isMatch) {
         console.log('Incorrect password for email:', email);
         return res.status(401).json({ message: 'Invalid email or password' });
     }

    // If the email and password match, proceed with login
    // Generate JWT token with correct secret key and expiration time
    const token = jwt.sign({ userId: user._id, email: user.email }, '1X0t7pZk$fjG@^3rM#DLn6qA9C!eH5sJ', { expiresIn: '24h' });

    // Send JWT token in response
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'An error occurred while logging in user' });
  }
});

// 6b. Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error logging out:', err);
      res.status(500).json({ message: 'An error occurred while logging out.' });
    } else {
      res.status(200).json({ message: 'Successfully logged out.' });
    }
  });
})

// 7. Other Routes Definition/API endpoints & functions

// 7a. Route for handling User Signup
app.post('/', async (req, res) => {
  // Extract email, password, and name from the request body
  const { email, password, name } = req.body;

  try {
    // Check if email, password, and name are provided
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // Check if user with the provided email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // Hash the password before creating the user
    const hashedPassword = await bcrypt.hash(password, saltRounds); // Hash the password
    const newUser = new User({ name, email, password: hashedPassword }); // Use hashedPassword instead of plain password
    await newUser.save();

    // Respond with success message
    res.status(201).json({ message: 'Your account has been registered successfully.' });
  } 
  catch (error) {
    console.error('Error signing up user:', error);
    res.status(500).json({ message: 'An error occurred while signing up user.' });
  }

  // Redirect any access to /signup to the root
  app.all('/signup', (req, res) => {
  res.redirect('/');
  });
});

// 7b. Admin Sign Up Route
app.post('/admin/signup', async (req, res) => {
  // console.log(req.body); // Debugging line
  // console.log(req.headers); // Debugging line
  try {
      console.log('Admin signup initiated'); // Log when signup starts
      const { email, password, name } = req.body;
      console.log(`Signup data received: ${JSON.stringify(req.body)}`); // Log the received data

      // Validate and sanitize input...

      const existingUser = await User.findOne({ email });
      if (existingUser) {
          console.log('User already exists'); // Log if user already exists
          return res.status(400).json({ message: 'Email is already registered.' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
          name,
          email,
          password: hashedPassword,
          role: 'admin',
          isAdmin: true
      });
      console.log('Creating new admin user'); // Log before creating user
      await newUser.save();
      const token = jwt.sign(
          { userId: newUser._id, email: newUser.email },
          '1X0t7pZk$fjG@^3rM#DLn6qA9C!eH5sJ',
          { expiresIn: '24h' }
      );
      console.log('Admin user created and token generated'); // Log after successful creation
      res.status(201).json({ message: 'Admin account created successfully', token });
  } catch (error) {
      console.error('Error creating admin user:', error);
      res.status(500).json({ message: 'Error creating admin user', error: error.toString() });
}
});

// 7c. Route for Admin Login
app.post('/admin/login', async (req, res) => {
  // console.log(req.body); // Debugging line
  // console.log(req.headers); // Debugging line
  try {
      console.log('Admin login initiated');
      const { email, password } = req.body;
      console.log(`Login data received: ${JSON.stringify(req.body)}`);
      
      // Validate and sanitize input...

      const user = await User.findOne({ email });
      if (!user) {
          console.log('No user found with the provided email.');
          return res.status(400).json({ message: 'Invalid credentials.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          console.log('Password does not match.');
          return res.status(400).json({ message: 'Invalid credentials.' });
      }

      const token = jwt.sign(
          { userId: user._id, email: user.email },
          '1X0t7pZk$fjG@^3rM#DLn6qA9C!eH5sJ',
          { expiresIn: '24h' }
      );
      console.log('Token generated:', token);
      res.status(200).json({ message: 'Logged in successfully', token });
  } catch (error) {
      console.error('Error during admin login:', error);
      res.status(500).json({ message: 'Internal server error', error: error.toString() });
  }
});

// 7d. Route for Fetching Current User Profile Data
app.get('/api/profile', authenticate, (req, res) => {
  console.log('req.user:', req.user); // Debugging line
    getUserProfile(req.user.userId)
      .then(userProfile => {
            res.json(userProfile);
        })
      .catch(error => {
            console.error(error);
            res.status(500).json({ message: 'Error fetching user profile' });
        });
});

// 7e. funtion to Fetch Current User Profile Data
function getUserProfile(userId) {
  console.log('Fetching profile for user ID:', userId);
  return User.findById(userId)
    .then(user => {
          if (!user) {
              console.error('User not found');
              throw new Error('User not found');
          }
          const { password,...userProfile } = user._doc;
          console.log('User profile:', userProfile);
          return userProfile;
      })
    .catch(error => {
          console.error('Error fetching user profile:', error);
          throw new Error('Error fetching user profile');
      });
}

// 6c.  Update Profile Route
app.put('/profile', authenticate, async (req, res) => {
  console.log('Request body:', req.body);
  try {
    // Extract user information from request object
    const { user } = req;
    
    // Extract updated profile information from request body
    const { email, password, name, phoneNumber, address } = req.body;

    // Find user by ID
    const existingUser = await User.findById(req.user.userId);

    // Check if user exists
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's email if provided
    if (email) {
      existingUser.email = email;
    }

    // Update user's password if provided
    if (password) {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      existingUser.password = hashedPassword;
    }

    // Update user's name if provided
    if (name) {
      existingUser.name = name;
    }

    // Update user's phone number if provided
    if (phoneNumber) {
      existingUser.phoneNumber = phoneNumber;
    }

    // Update user's address if provided
    if (address) {
      existingUser.address = address;
    }

    // Save updated user profile to the database
    await existingUser.save();

    // Return success response
    res.json({ message: 'User profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'An error occurred while updating user profile' });
  }
});

// 7. Chatbot Functions & Routes

// 7a. Function to provide response based on predicted intent
function provideResponse(predictedIntent, res) {
  switch (predictedIntent) {
    case 'Greetings':
      res.json({ message: 'Hello! Welcome to our customer support. How can I assist you today?' });
      break;
    case 'Order Status':
      res.json({ message: 'Sure, I can help with that. Please provide your order number, and I\'ll check the status for you.' });
      break;
    case 'Product Information':
      res.json({ message: 'You can find out about Our Products, their Prices & any ongoing discounts or promo at www.aichatbot.com/products' });
      break;
    case 'Technical Support':
      res.json({ message: 'Please describe your technical issue in detail.' });
      break;
    case 'Transfer to Human Agent':
      res.json({ message: 'OK, please be patient while we transfer you to the nearest available human agent.' });
      break;
    case 'Appreciation':
      res.json({ message: 'You\'re welcome! If you have any more questions or need further assistance, feel free to reach out.' });
      break;
    case 'Goodbye':
      res.json({ message: 'Goodbye! If you need any help in the future, don\'t hesitate to contact us again.' });
      break;
    default:
      res.json({ message: 'I\'m sorry, I didn\'t understand that. Please clarify yourself better or indicate if I should transfer you to a human agent.' });
  }
}

// 7b. Define a route to handle incoming user messages
app.post('/message', authenticate, (req, res) => {
  // Extract the user message from the request body
  const { message } = req.body;

  // Log the received message data
  console.log(`Received message: ${message}`);

  // Preprocess the user message (assuming preprocessText function is implemented)
  const preprocessedMessage = preprocessText(message);

  // Use the trained classifier to predict the intent of the message
  const predictedIntent = classifier.classify(preprocessedMessage);

  // Log the predicted intent
  console.log('Predicted intent:', predictedIntent);

  // Provide response based on predicted intent using the common function
  provideResponse(predictedIntent, res);

  // Log the response being sent back to the client
  console.log('Response sent:', res);
});

// 7c. Route Handler for Chat and Other Chatbot Funtions
app.post("/chat", (req, res) => {
  const userInput = req.body.message;
  console.log('User input:', userInput); // Log user input

  // Preprocess the user input
  const preprocessedInput = preprocessText(userInput);
  console.log('Preprocessed input:', preprocessedInput); // Log preprocessed input

  // Ensure that the classifier object has the classify method
  if (classifier.classify) {
    // Predict the intent using the classifier object's classify method
    const predictedIntent = classifier.classify(preprocessedInput);
    console.log('Predicted intent:', predictedIntent); // Log predicted intent

    // Provide response based on predicted intent using the common function
    provideResponse(predictedIntent, res);

    // Log the response being sent back to the client
    console.log('Response sent:', res);
  } else {
    // Handle the case where the classify method is not available
    console.error('Classifier does not have a classify method');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 8. Define Patterns and Responses for Pattern Matching Algorithm - maps user input to predefined responses
const patternsAndResponses = {
  "hi|hello|hey": "Hello! Welcome to our customer support. How can I assist you today?",
  "help|need assistance|support": "Of course! I'm here to assist you with any questions or issues you may have. Feel free to ask.",
  "check order status|where is my order|delivery update": "Sure, I can help with that. Please provide your order number, and I'll check the status for you.",
  "product details|features of [product]|pricing": "Certainly! Which product are you interested in? I can provide you with details and pricing information.",
  "technical issue|tech support|troubleshooting": "Please describe your technical issue in detail.",
  "speak to a human|transfer to agent|need to talk to someone": "If you prefer to speak with a human agent, I'll connect you to one of our support representatives. Please hold for a moment.",
  "thank you|thanks a lot|appreciate it": "You're welcome! If you have any more questions or need further assistance, feel free to reach out.",
  "bye|goodbye|see you later": "Goodbye! If you need any help in the future, don't hesitate to contact us again."
};

// 8a. Implement Pattern Matching Algorithm with Natural
function matchPattern(userInput) {
  // Perform Part of Speech tagging
  const taggedTokens = tagger.tagSentence(userInput);
  
  // Analyze POS tags and match patterns by Iterating through each pattern and response
  for (const pattern in patternsAndResponses) {
    const regex = new RegExp(pattern, "i");
    if (regex.test(userInput)) {
      return patternsAndResponses[pattern];
    }
  }
  
  // If no direct match found, analyze the tagged tokens
  // Here you can implement your custom logic to analyze the tagged tokens
  // and match them with predefined patterns to generate responses
  
  // Application logic:
  // If the input contains nouns (NN) and verbs (VB), assume it's a general query
  // and provide a default response
  
  const nounTags = ['NN', 'NNS']; // Noun tags
  const verbTags = ['VB', 'VBP', 'VBZ']; // Verb tags
  
  const hasNouns = taggedTokens.some(token => nounTags.includes(token[1]));
  const hasVerbs = taggedTokens.some(token => verbTags.includes(token[1]));
  
  if (hasNouns && hasVerbs) {
    return "I'm sorry, I didn't understand that.";
  }
  
  // If no match found, return a default response
  return null;
}

// 8b. Import classifier data
const classifierData = require('./classifier.json');

// 8c. Import the preprocessText and classifier function from trainClassifier.js

    // console.log('Importing preprocessText and classifier function from trainClassifier.js');
  const { preprocessText, classifier } = require('./trainClassifier');
    // console.log('preprocessText and classifier function imported successfully:', preprocessText, classifier);

  // Log the classifier file content to inspect its structure
  // console.log('Classifier file content:', classifierData);


// 8d. Ensure the classifier object is loaded and accessible
if (classifier) {
  // Test output to verify the classifier object
  // console.log('Loaded classifier:', classifier);
} else {
  console.error('Classifier object not loaded properly.');
}

// 9. Connect to MongoDB
mongoose.connect('mongodb+srv://sundaystechlab:S0UAGyDdthtNgK2Q@cluster0.pjshx76.mongodb.net/chatbot?retryWrites=true&w=majority&appName=Cluster0',)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));


// 10. Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('An unexpected error occurred:', err);

  // Set a default status code
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Customize error response based on error type
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    // Handle JSON parsing errors
    message = 'Invalid JSON payload';
  }

  // Send error response
  res.status(statusCode).json({ error: { message } });
};

  // Register global error handler middleware
  app.use(errorHandler);

// 11. Define the port for the server to listen on
const PORT = process.env.PORT || 5000;

// 12. Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});