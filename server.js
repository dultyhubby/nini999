const express = require('express');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const querystring = require('querystring');

const app = express();
const PORT = process.env.PORT || 3000;

// Add the session middleware
app.use(
  require('express-session')({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.static(path.join(__dirname, 'public')));

// Replace these values with your Spotify app credentials
const SPOTIFY_CLIENT_ID = '6482d51f91994ef49489b00ab84f02d1';
const SPOTIFY_REDIRECT_URI = 'http://localhost:3000/callback';

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    // Generate a random code_verifier
    const codeVerifier = base64urlencode(crypto.randomBytes(32));
    // Calculate the code_challenge
    const hashed = sha256(codeVerifier);
    const codeChallenge = base64urlencode(hashed);

    // Log the generated codeVerifier and codeChallenge
    console.log('Generated codeVerifier:', codeVerifier);
    console.log('Generated codeChallenge:', codeChallenge);

    // Save the codeVerifier in the session
    req.session.codeVerifier = codeVerifier;

    // Construct the Spotify authorization URL using the provided method
    var state = generateRandomString(16);
    var scope = 'user-read-private user-read-email';
    const authorizeURL = 'https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: SPOTIFY_CLIENT_ID,
            scope: scope,
            redirect_uri: SPOTIFY_REDIRECT_URI,
            state: state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        });

    // Redirect the user to the Spotify authorization URL
    res.redirect(authorizeURL);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    const codeVerifier = req.session.codeVerifier;

    try {
        const tokenResponse = await axios.post(
            'https://accounts.spotify.com/api/token',
            new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: SPOTIFY_REDIRECT_URI,
                client_id: SPOTIFY_CLIENT_ID,
                code_verifier: codeVerifier,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const accessToken = tokenResponse.data.access_token;

        // Log the access token for testing
        console.log('Access Token:', accessToken);

        // Redirect the user to the main page or wherever you want
        res.redirect('/');
    } catch (error) {
        console.error('Error exchanging code for access token:', error);

        if (error.response) {
            console.error('Spotify API Error:', error.response.data);
            // Send the Spotify API error details as a response
            res.status(error.response.status).json({ error: error.response.data });
        } else {
            // If the error is not from the Spotify API, send a generic error response
            res.status(500).send('Internal Server Error');
        }
    }
});

// Helper function to encode base64URL
async function base64urlencode(str) {
    const buffer = await str;
    return Buffer.from(buffer).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Helper function to calculate SHA-256 hash
async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);

    const hashedArrayBuffer = await crypto.subtle.digest('SHA-256', data);
    return Buffer.from(hashedArrayBuffer);
}

// Helper function to generate a random string
function generateRandomString(length) {
    const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
        text += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
    }
    return text;
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
