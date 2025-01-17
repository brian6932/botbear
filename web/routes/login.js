require('dotenv').config();
const querystring = require('querystring');

module.exports = (function () {
    const router = require('express').Router();

    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const redirect_uri = 'https://hotbear.org/callback';

    /* /Login */
    router.get('/', async (req, res) => {
        let state = generateRandomString(16);
        let scope = 'user-modify-playback-state user-read-playback-position user-top-read user-read-playback-state user-read-recently-played user-read-currently-playing user-read-email user-read-private';
      
        res.redirect('https://accounts.spotify.com/authorize?' +
          querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
          }));
    });

    return router;
})();

const generateRandomString = function(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };