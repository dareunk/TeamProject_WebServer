const port =80,
        express = require("express"),
        app = express();

var client_id = 'CLIENT_ID';
var redirect_uri = 'http://localhost:8888/callback';


app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  var scope = 'user-read-private user-read-email';

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});
