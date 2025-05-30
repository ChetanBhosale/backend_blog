const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'http://localhost:8000/oauth2callback'
);

// Generate the url that will be used for authorization
const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://mail.google.com/']
});

console.log('Authorize this app by visiting this url:', authUrl);

// After you get the code from the callback, use it to get tokens
const getTokens = async (code) => {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Access Token:', tokens.access_token);
    console.log('Refresh Token:', tokens.refresh_token);
};

// You'll need to call this function with the code you get from the callback
// getTokens('your_code_here'); 