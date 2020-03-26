var SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();
const express = require('express');
var cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(cors());

const spotifyApi = new SpotifyWebApi({
  redirectUri: process.env.REDIRECT_URI,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});


app.get('/', function (req, res) {
  res.send('hello world')
});


app.get('/getPlaylistForUser', function (req, res) {

});

app.post('/verification', function (req, res) {
  const songIds = [];
  // console.log(req);
  let code = req.body.code;
  let year = req.body.year;
  spotifyApi.authorizationCodeGrant(code).then(
      function (data) {
        console.log('The token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);
        console.log('The refresh token is ' + data.body['refresh_token']);

        // Set the access token on the API object to use it in later calls
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);

        spotifyApi.getMe()
            .then(function (data) {
              console.log('Some information about the authenticated user', data.body);
              return data.body.id;
            }, function (err) {
              console.log('Something went wrong!', err);
            }).then(loggedInUserId => {
          spotifyApi.getUserPlaylists(loggedInUserId, {limit: 50})
              .then(function (playlistsforUser) {
                let boxPlaylist = null;
                const playlistNames = [];
                const arrayOfPlaylistObjects = playlistsforUser.body.items;
                arrayOfPlaylistObjects.forEach(playlist => {
                  playlistNames.push({name: playlist.name, id: playlist.id});
                });
                playlistNames.forEach(playList => {
                  if (playList.name === "JQBX :: Queue") {
                    console.log(playList.name);
                    console.log(playList.name === "JQBX :: Queue");
                    boxPlaylist = playList['id'];
                  }
                });
                return boxPlaylist;
              }, function (err) {
                console.log('Something went wrong!', err);
              }).then(playlistId => {
            console.log(playlistId);
            spotifyApi.search(`year:${year}`, ['track'], {limit: 50}).then(result => {
              let items = result.body['tracks']['items'];
              items.forEach(element => {
                songIds.push(`spotify:track:${element.id}`);
              });
              return songIds;
            }).then(songIds => {
              console.log('This songIds', songIds);
              console.log("playlists", playlistId);
              spotifyApi.addTracksToPlaylist(playlistId, songIds)
                  .then(function (data) {
                    console.log('Added tracks to playlist!');
                    res.send({message: 'All tracks added to playlist!'});
                  }, function (err) {
                    console.log('Something went wrong!', err);
                  });
            });
          });
        });
      },
      function (err) {
        console.log('Something went wrong!', err);
        res.send("something went wrong")
      }
  );
});

app.get('/getPermission', function (req, res) {
  var scopes = ['user-read-private', 'user-read-email','playlist-modify-public'];
  var state = 'random';
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  res.send({authorizeURL});
});

console.log('Running application on port 3000');
app.listen(3000);
