// script.js

// 1. Handle the user sign-up form submission
document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signup-form');
    const errorMessageContainer = document.getElementById('error-message');

    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(signupForm);
            const formDataObject = Object.fromEntries(formData.entries());

            // POST route to Sign up Handler on server.js
            try {
                const response = await fetch('/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formDataObject)
                });

                if (!response.ok) {
                    throw new Error('Failed to register. Please try again.');
                }

                const data = await response.json();
                const successMessage = document.createElement('p');
                successMessage.textContent = data.message;
                successMessage.classList.add('success-message');
                signupForm.insertAdjacentElement('afterend', successMessage);

                // Optionally, provide a link or button to proceed to the login page
                const loginLink = document.createElement('a');
                loginLink.href = '/login';
                loginLink.textContent = ' Proceed to Login';
                successMessage.appendChild(loginLink);

                // Scroll the page to the success message
                successMessage.scrollIntoView({ behavior: 'smooth' });
            } catch (error) {
                console.error('Error registering user:', error);
                errorMessageContainer.textContent = error.message; // Display error message on the sign-up page
            }
        });
    } else {
        console.log('Sign-up form element not found');
    }
});

// 2. JavaScript for Admin Sign-Up
document.addEventListener('DOMContentLoaded', function() {
    const adminSignupForm = document.getElementById('admin-signup-form');
    if (adminSignupForm) {
        adminSignupForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            console.log('Admin signup form submitted'); // Debugging line
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const name = document.getElementById('name').value;
            console.log({ email, password, name }); // Debugging line
            const formData = { email, password, name };
            try {
                const response = await fetch('/admin/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to sign up');
                }
                console.log('Sending signup data:', formData);
                const data = await response.json();
                console.log('Token received:', data.token); // Ensure this is not null or undefined
                localStorage.setItem('token', data.token);
                
                // Display success message and option to proceed to login
                const successMessage = document.createElement('div');
                successMessage.textContent = 'Registration successful!';
                document.body.appendChild(successMessage);

                // Optionally, provide a link or button to proceed to the login page
                const loginLink = document.createElement('a');
                loginLink.href = '/admin/login';
                loginLink.textContent = ' Proceed to Login';
                successMessage.appendChild(loginLink);
            } catch (error) {
                document.getElementById('signup-message').textContent = 'Error: ' + error.message;
                // Attempt to parse and display the server's error message if available
                error.response.json().then(errorData => {
                    document.getElementById('signup-message').textContent = 'Error: ' + errorData.message;
                }).catch(() => {
                    // Fallback error message if parsing fails
                    document.getElementById('signup-message').textContent = 'An error occurred during sign-up. Please try again.';
                });
            }
        });
    }
});
// 4.  JavaScript for Admin Login
const adminLoginForm = document.getElementById('admin-login-form');
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        console.log('Admin Login Form submitted');
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            const response = await fetch('/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            if (!response.ok) throw new Error('Failed to log in');
            const data = await response.json();
            // Store the token and redirect to the dashboard
            localStorage.setItem('token', data.token); // Assuming the response contains a token
            window.location.href = '/admin-dashboard.html'; // Redirect to dashboard after login
        } catch (error) 
        {console.error('Login failed or token not received')};
        
        {document.getElementById('login-message').textContent = 'Error: ' + error.message;
        }
    });
};

// 3. Function to handle user login
async function handleLogin(email, password) {
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        
        if (!response.ok) {
            const errorMessage = await response.json();
            throw new Error(errorMessage.message);
        }
        
        // Get the token from the response
        const data = await response.json();
        // After receiving the token from the server
        const token = data.token;
        console.log('Token received and stored:', token); // Log the token

        // Store the token in local storage
        localStorage.setItem('token', token);

        // Redirect the user to the chat page
        window.location.href = '/chat';
    } catch (error) {
        console.error('Error logging in:', error);
        // Handle login error & display to user on the login page
        const errorMessage = document.createElement('p');
        errorMessage.textContent = error.message;
        document.body.appendChild(errorMessage);
    };
}

// 3b. Add event listener to login form
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent default form submission
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            handleLogin(email, password); // Call handleLogin function
        });
        console.log('Login form element found'); // Log success
    } else {
        console.log('Login form element not found'); // Log when not found
    }

    const messageForm = document.getElementById('message-form');
    if (messageForm) {
        messageForm.addEventListener('submit', handleSubmit);
        console.log('Message form element found'); // Log success
    } else {
        console.log("Message form element not found."); // Log when not found
    }
});

// 3c. Token Mangagement - Function to include the token in the Authorization header for protected routes
function includeTokenInRequest(requestOptions) {
    const token = localStorage.getItem('token');
    console.log('Token being sent:', token); // Log the token being sent
    if (token) {
        requestOptions.headers = {
            ...requestOptions.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    return requestOptions;
}

// 3d Example of using includeTokenInRequest for a fetch request to a protected route
async function fetchProtectedResource() {
    const requestOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    };
      // Use the function to include the token
      const updatedRequestOptions = includeTokenInRequest(requestOptions);
        console.log('Request options:', updatedRequestOptions); // Log the request options

      // Make the request to chat route with the updated options
      const response = await fetch('/chat', updatedRequestOptions);
      // Handle the response
}


// 5. Chat Functionality

//5a. Function to Send Message to Server
function sendMessageToServer(message) {
    // Send an HTTP POST request to the server with the user message
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message }),
    };
    const updatedRequestOptions = includeTokenInRequest(requestOptions);
    fetch('/message', updatedRequestOptions)
    .then(response => {
        // Check if the response is successful
        if (response.ok) {
            // If successful, parse the JSON response
            return response.json();
        } else {
            // If not successful, throw an error
            throw new Error('Failed to receive response from server');
        }
    })
    .then(data => {
        // Handle the JSON response data here
        // display the bot's response in the chat window
        displayMessage(data.message, 'bot');
    })
    .catch(error => {
        // Handle any errors that occurred during the request
        console.error('Error sending message to server:', error);
    });
}

// 5b. Function to handle user input submission
function handleSubmit(event) {
    // Prevent the default form submission behavior
    event.preventDefault();
    
    // Get the user input message from the input field
    const userInput = document.getElementById('user-input').value;
    
    // Clear the input field
    document.getElementById('user-input').value = '';
    
    // Display the user message in the chat window
    displayMessage(userInput, 'user');
    
    // Send the user message to the server for processing
    sendMessageToServer(userInput);
}

// 5c. Function to display a message in the chat window
function displayMessage(message, sender) {
    // Create a wrapper for the message
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('message-wrapper');

    // Determine the sender's name
    let senderName = sender === 'user'? 'You' : sender.charAt(0).toUpperCase() + sender.slice(1); // Capitalize first letter of sender name

    // Create a sender label
    const senderLabel = document.createElement('span');
    senderLabel.classList.add('sender-label');
    senderLabel.textContent = senderName; // Use the determined sender name

    // Create a chat bubble for the message
    const chatBubble = document.createElement('div');
    chatBubble.classList.add('chat-bubble');
    chatBubble.classList.add(sender === 'user'? 'user-message' : 'bot-message');
    chatBubble.textContent = message;

    // Append the sender label and chat bubble to the message wrapper
    messageWrapper.appendChild(senderLabel);
    messageWrapper.appendChild(chatBubble);

    // Append the message wrapper to the chat box
    document.getElementById('chat-box').appendChild(messageWrapper);
}

// 6. Profile Management

// 6a. Standalone function for updating profile programmatically
async function updateProfile(profileData) {
    // Define your request options
    const requestOptions = {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
    };

    // Use the function to include the token
    const updatedRequestOptions = includeTokenInRequest(requestOptions);

    // Make the request to the /profile route with the updated options
    const response = await fetch('/profile', updatedRequestOptions);
    // Handle the response
}

// 6b. Function to fetch current user profile data from database
async function fetchUserProfile() {
  // Include the token in the request headers for authentication
  const requestOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  };

  try {
    const response = await fetch('/api/profile', requestOptions);
    if (!response.ok) {
      throw new Error('Failed to load user profile');
    }

    const data = await response.json();
    // Update form fields with the fetched profile data
    document.getElementById('name').value = data.name;
    document.getElementById('email').value = data.email;
    document.getElementById('phoneNumber').value = data.phoneNumber || 'Enter your phone number';
    document.getElementById('address').value = data.address || 'Enter your address';
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Optionally, display an error message to the user

    // Check the current URL and execute code accordingly
    if (window.location.pathname === '/profile.html') {
        fetchUserProfile();
    }

  }
}
    // Call this function when the profile page is loaded
    document.addEventListener('DOMContentLoaded', fetchUserProfile);

// 6c.Event listener for profile form submission Function
document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent the default form submission

            // Extract form data
            const formData = new FormData(event.target);
            const profileData = Object.fromEntries(formData.entries());

            // Send the profile data as a PUT request
            fetch('/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // Include the Authorization header if needed
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(profileData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Handle successful profile update
                console.log('Profile updated successfully:', data);
            })
            .then(data => {
                // Show success message
                document.getElementById('message').textContent = 'Profile updated successfully!';
                document.getElementById('message').style.display = 'block';

            
                // Fetch and update the form fields with the new profile data
                fetchUserProfile();
            })
            .catch(error => {
                // Handle errors
                console.error('Error updating profile:', error);
            });
        });
        console.log('Profile form element found');
    } else {
        console.log('Profile form not found');
    }
})

// 7. Function to handle logout
function logout() {
  // Remove the token from localStorage
  localStorage.removeItem('token');

  // Optionally, clear the session by making a request to the logout route
  fetch('/logout', { method: 'GET' })
   .then(() => {
      // Redirect to the login page after successfully logging out
      window.location.href = '/login';
    })
   .catch(error => console.error('Logout error:', error));
}

// 7b. Attach the logout function to the logout button
document.addEventListener('DOMContentLoaded', () => {
  // Select all elements with the class 'menu-item' and check if the text content is 'Log Out'
  document.querySelectorAll('.menu-item').forEach(button => {
    if (button.textContent === 'Log Out') {
      button.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent the default link behavior
        logout(); // Call the logout function
      });
    }
  });
});

// 8. Text-to-Speech 
document.getElementById('speakButton').addEventListener('click', (event) => {
    event.preventDefault();
  const chatBox = document.getElementById('chat-box');
  const messages = chatBox.querySelector('.bot-message:last-child').innerText; // Targets the last user message
  const utterance = new SpeechSynthesisUtterance(messages);
  speechSynthesis.speak(utterance);
});


// 9. Speech-to-Text
const listenButton = document.getElementById('listenButton');
let recognizing = false;
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition)();
recognition.interimResults = true;

if (recognition) {
  recognition.onresult = event => {
    const transcript = Array.from(event.results)
     .map(result => result[0])
     .map(result => result.transcript)
     .join('');

    document.getElementById('user-input').value = transcript;
    recognizing = false;
    if (event.results[0].isFinal) {
      // Optionally, handle the final transcript
    }
  };

  recognition.onerror = event => {
    console.error('Speech recognition error:', event.error);
  };

  document.getElementById('listenButton').addEventListener('click', (event) => {
    event.preventDefault();
    if (recognizing) {
      recognition.stop();
      recognizing = false;
      listenButton.innerHTML = '<i class="fas fa-microphone"></i>'; // Resets to icon
      listenButton.style.backgroundColor = ''; // Optional: Reset any background color or style changes
    } else {
      recognition.start();
      recognizing = true;
    }
  });
} else {
  console.error('Speech recognition not supported by your browser.');
}
