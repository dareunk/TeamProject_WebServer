/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
i */

const port = 80;
const express = require('express'); // Express web server framework
const request = require('request'); // "Request" library
const router = express.Router();
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const fs = require("fs")
//const mysql = require("mysql2/promise");
const db = require("./models/index.js");
const layouts = require("express-ejs-layouts");
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require("mysql2");
const path = require('path');
const crypto = require('crypto');
const FileStore = require('session-file-store')(session);
const app = express();
const axios = require('axios');
const http = require('http');
const socket = require('socket.io');
const server = http.createServer(app);
const io = socket(server);
const SpotifyWebApi = require('spotify-web-api-node');
//const client_id = '44593f8f0123478194b49d77f6b85f4f'; // Your client id
//const client_secret = 'eebbe9ab51264c24bbb0bde430b5027d'; // Your secret
//const redirect_uri = 'http://34.22.71.11/callback'; // Your redirect uri
const client_id = process.env.Client_id;
const client_secret = process.env.Client_secret;
const redirect_uri = process.env.Redirect_uri;

const spotifyApi = new SpotifyWebApi({
    clientId: client_id,
    clientSecret: client_secret,
    redirectUri: redirect_uri
});
require('dotenv').config();

//app.use('/css', express.static('./static/css'));
//app.use('/js', express.static('./static/js'));
app.use('/js',express.static('public'));

app.use(
    express.urlencoded({
        extended: true 
    })
);
app.use(express.json());
app.use(session({
    secret: 'blackzat',
    resave: false,
    saveUninitialized: true,
    store : new FileStore(),
    cookie: {
        maxAge: 60 * 60 * 1000
    }
}));
app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.set("view engine", "ejs");

//Database
db.sequelize.sync();
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PW,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});


app.get('/login', function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-read-currently-playing user-read-playback-state user-read-recently-played';
	
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});


// * Generates a random string containing numbers and letters
 //* @param  {number} length The length of the string
// * @return {string} The generated string
// */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
	//(var > const로 바꿈 바로 아래 코드)
        const access_token = body.access_token;
        const refresh_token = body.refresh_token;
	spotifyApi.setAccessToken(access_token);
	spotifyApi.setRefreshToken(refresh_token);      
        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });
	res.redirect('/plimatelist');
        // we can also pass the token to the browser to make requests from there
        //res.redirect('/#' +
        //  querystring.stringify({
        //    access_token: access_token,
        //    refresh_token: refresh_token
        //  }));
      //} else {
      //  res.redirect('/#' +
      //    querystring.stringify({
      //      error: 'invalid_token'
      //    }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.get('/',(req,res)=>{
    console.log('메인페이지 작동');
    console.log(req.session);
    if(req.session.is_logined == true){
        res.render('index',{
            is_logined : req.session.is_logined,
            name : req.session.name
        });
    }else{
        res.render('index',{
            is_logined : false
        });
    }
});

// 회원가입
app.get('/register',(req,res)=>{
    console.log('register page');
    res.render('register');
});

app.post('/register',(req,res)=>{
    console.log('register')
    const body = req.body;
    const Sequelize = require('sequelize');
    const id = body.id;
    const pw = body.pw;
    const nickname = body.nickname;
    const name = body.name;
    const phone = body.phone;

    connection.query('select * from members where memberId=?',[id],(err,data)=>{
        if(data.length == 0){
            console.log('register complete');
            connection.query('insert into members(memberId, fullName, nickname, password, phone) values(?,?,?,?,?)',[id, name, nickname, pw, phone]);
            res.redirect('/');
        }else{
            console.log('register failed');
            res.render('existError');
        }
    });
});

// 로그인
app.get('/logInPli',(req,res)=>{
    console.log('login page');
    res.render('logInPli');
});

app.post('/logInPli',(req,res)=>{
    const body = req.body;
    const id = body.id;
    const pw = body.pw;

    connection.query('select * from members where memberId=?',[id],(err,data)=>{
       // 로그인 확인
      /* 
        console.log(data[0]);
        console.log(id);
        console.log(data[0].memberId);
        console.log(data[0].password);
        console.log(id == data[0].memberId);
        console.log(pw == data[0].password);
      */
        if(data[0] != undefined) {
            if(id == data[0].memberId && pw == data[0].password){
                console.log('login complete');
                console.log(data[0]);
                // 세션에 추가
                req.session.is_logined = true;
                req.session.name = data[0].fullName;
                req.session.id = data[0].memberId;
                req.session.pw = data[0].password;
                req.session.save(function(){ //세션 스토어에 적용
                    res.render('index',{ //index.ejs로 전달 
                        name : data[0].fullName,
                        id : data[0].memberId,
                        nickname : data[0].nickname,
                        is_logined : true
                    });
                });
            }
            else{
                console.log('login failed');
                res.render('loginError');
            }
        }
        else{
            console.log('login failed');
            res.render('loginError');
        }
    });
});

// 로그아웃
app.get('/logout',(req,res)=>{
    console.log('로그아웃 성공');
    req.session.destroy(function(err){
        res.redirect('/');  //로그아웃하면 스포티파이 로그인으로 감 > 루트가 그것으로 설정되어 있음
    });
});

// 로그인 상태 확인하는 미들웨어
const authenticate = (req, res, next) => {
    if (req.session.is_logined) { //login O 
      next();
    } else { //login X
      res.redirect('/logInPli');
    }
};

//인증 미들웨어 아래부터 적용
app.use(authenticate);

app.get('/plimatelist', (req, res)=>{
    console.log('Plimate List');
    res.render('index', {
        is_logined: req.session.is_logined,
	name: req.session.name
    });
})

app.get('/noLink', (req,res)=>{
    console.log('no link');
    res.send('<h1> 연동하지 않았을 때의 페이지 </h1>')
})

// 이 파일 옮길 때 아래 sendFile 경로 바꿔줘야함
app.get('/socketio', (req, res)=>{
    console.log('chat');
    fs.readFile('./public/chatroom.html',(err, data)=>{
    if(err) {
        res.send('에러')
    } else {
        res.writeHead(200, {'Content-Type':'text/html'})
        res.write(data)
        res.end()
    }
  })
})

io.sockets.on('connection',(socket)=>{
    // 새로운 사용자 접속하면 다른 소켓에게 알려주기
    socket.on('newUser', (name)=>{
        console.log(name + ' 님이 접속하였습니다.')
        //소켓에 이름 저장
        socket.name = name
        // 모든 소켓에게 전송
        io.sockets.emit('update', {type: 'connect', name: 'SERVER', message: name + '님이 접속하였습니다.'})
    })
	
    //전송한 메시지 받기
    socket.on('message', (data)=>{
        //받은 메시지 누가 보냈는지 이름을 추가
        data.name = socket.name
        console.log(data)
        //보낸 사람 제외한 모든 사용자에게 메시지 전송	  
        socket.broadcast.emit('update', data);
    })

    //접속 종료
    socket.on('disconnect', ()=>{
        console.log(socket.name + '님이 나가셨습니다.')
        //나간 사람 제외하고 모든 사용자에게 아래 메시지 전송
        socket.broadcast.emit('update', {type: 'disconnect', name: 'SERVER', message: socket.name + '님이 나가셨습니다.'});
    })
})

//플레이리스트 정보 가져오기
async function getPlaylist(playlistId) {
    try {
        //플레이리스트 정보 요청
        const response = await spotifyApi.getPlaylist(playlistId);
        //플레이리스트 정보 반환
        return response.body;
    } catch (error) {
        console.error('Error retrieving playlist:', error);
        throw new Error('Failed to retrieve playlist');
    }
}

app.get('/playlist/:playlistId', async (req,res)=>{
    const playlistId = req.params.playlistId;

    try {
        // Spotify Web API를 사용하여 플레이리스트 정보 가져오기
        const playlist = await spotifyApi.getPlaylist(playlistId);
	//console.log(playlist);
        //console.log(playlist.body.tracks);
        //console.log(playlist.body.tracks.items);
        playlist.id = playlistId;
        //플레이리스트 정보 playlist.ejs 파일에 응답
        res.render('playlist', { playlist });
    } catch (error) {
        console.error('Error retrieving playlist:', error);
        res.status(500).json({ error: 'Failed to retrieve playlist' });
    }
});

//app.post('/searchingtest/:trackid', async(req,res) => {
//	console.log(req.params.trackid);
//	const trackId = req.params.trackid;
//	const playState = await spotifyApi.getMyCurrentPlayingTrack().then(function(data){                
//	    console.log(data.body.item);
//	    res.redirect(`/searching`);
	  //console.log('Now playling: '+ data.body.item.name);
  //      }, function(err){
   //                     console.log("something went wrong!",err);
     //           });
//});

app.post('/createPlaylist', async(req,res) =>{
	const playlistName = req.body.playlistName;

	try{
		const playlist = await spotifyApi.createPlaylist(playlistName);
		console.log(`created new playlist - ${playlistName}`);
		res.redirect(`/playlist/${playlist.body.id}`);
	}catch(error){
		console.error("Error creating playlist:", error);
		res.status(500).json({error: 'Failed to create playlist'});
	}
}); 


app.get('/createPlaylist',(req,res) => {
	res.render('createPlaylist');
});

 app.post('/playlist/:playlistId/editName', async (req, res) => {
     const playlistId = req.params.playlistId;
        const newName = req.body.newName;
             try {
                     await spotifyApi.changePlaylistDetails(playlistId, { name: newName });
                             res.redirect(`/playlist/${playlistId}`);
		                                      } catch (error){
							      console.error('Error editing playlist name:', error);
                                                 res.status(500).json({ error: 'Failed to edit playlist name' });                                                     }                                 
 });
//플레이리스트 목록 가져오기
app.get('/playlists', async (req,res)=>{
    try {
        // Spotify Web API를 사용해서 플레이리스트 목록 가져오기
        const playlists = await spotifyApi.getUserPlaylists();
       console.log(playlists);
        //console.log(playlists.body.items)
        res.render('playlists', { playlists });
    } catch (error) {
        console.error('Error retrieving playlists:', error);
        res.status(500).json({ error: 'Failed to retrieve playlists' });
    }
});
app.post('/addtrack/:playlistId', async (req, res) => {
	  const trackUri = req.body.trackUri;
	  const playlistId = req.params.playlistId;
	  const chatRoom = chatRooms.find(playlist => playlist.playlistId === playlistId);
	  try {
		      const response = await spotifyApi.addTracksToPlaylist(playlistId, [trackUri]);
		      console.log('Track added to playlist:', response);
		      if (chatRoom)
			        res.redirect(`/chat/${roomId}/${playlistId}`);
		      else 
			        res.redirect(`/playlist/${playlistId}`);
		    } catch (err) {
			        console.error('Failed to add track to playlist:', err);
			        res.json({ success: false });
			      }
});

app.get('/searchsong', async (req,res) => {
	console.log("searching");
	res.render('searchBar');
});

app.post('/searching', async(req,res)=>{
	const body = req.body;
	const obj = body.search;

	spotifyApi.searchTracks(obj).then(function(data){
	        const tracks = data.body.tracks.items;
		console.log(tracks);
		console.log(`Search track by ${obj} in tracks`);
		res.render('search', { tracks: tracks });
	}
		,function(err){
			console.log("something went wrong!",err);
		});
});
app.post('/searchingPli', async(req,res)=>{
	const body = req.body;
	const obj = body.searchPli;
	//console.log(obj);

	spotifyApi.searchPlaylists(obj).then(function(data){
	const playlists = data.body.playlists.items;
		console.log(playlists);
		console.log(`Search playlist by ${obj} in playlists`);
		res.render('findPli',{ playlists});	
	}, function(err){
		console.log("something went wrong!",err);
	});
});

app.get("/test", async(req,res)=>{
	spotifyApi.getMyRecentlyPlayedTracks({
		limit:20
	}).then(function(data){
		console.log("Your 20 most recently played tracks are:");
		data.body.items.forEach(item=>console.log(item.track));
	}, function(err){
		console.log("Something went wrong!",err);
	});});

server.listen(80,() => {
    console.log(`Server running on port: ${port}`);
})

/*
//spotifyApi.setAccessToken('BQB1KQ1kmIxxYJ0DQHnPUCYHDqN3Suls2q_uZFckTSGongKR8-KyMTmTYfcrK9O3g4iuP9uwrYqK5jlg1UwA20JGxyU73lCqcgIPlG9M9z7KZBlKglcHf9xKdymbtIOwXp4n1i8UeZ0DY1PR2_kiSBFR3tLiQjl7bChxGrFQkApMhNuH_jwbBpYxGBG3qPmIALXdgM6X6cSEDBQXscPhPLd0znc');

spotifyApi.getArtistAlbums('43ZHCT0cAZBISjO8DG9PnE').then(
  function(data) {
    console.log('Artist albums', data.body);
  },
  function(err) {
    console.error(err);
  }
);

spotifyApi.searchPlaylists('workout')
  .then(function(data) {
    console.log('Found playlists are', data.body);
  }, function(err) {
    console.log('Something went wrong!', err);
  });

spotifyApi.addTracksToPlaylist('5ieJqeLJjjI8iJWaxeBLuK', ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh", "spotify:track:1301WleyT98MSxVHPZCA6M"])
  .then(function(data) {
    console.log('Added tracks to playlist!');
  }, function(err) {
    console.log('Something went wrong!', err);
  });
*/

