var express = require('express');
var google = require('googleapis');
var mongoose = require('mongoose');
var cred = require('./credentials.js');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

mongoose.connect('mongodb://localhost/test');
var app = express();
var OAuth2Client = google.auth.OAuth2;

var authinfo = google.oauth2('v2');

var oauth2Client = new OAuth2Client(cred.CLIENT_ID,
  cred.CLIENT_SECRET,
  "http://localhost:8080/oauthcallback")





app.get("/", function(req, res){
var url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/plus.me',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile']
});

res.send(url);
});


app.get("/oauthcallback", function(req, res){
  var code = req.query.code;

  oauth2Client.getToken(code, function(err, tokens){
    oauth2Client.setCredentials(tokens);
    authinfo.userinfo.get({fields: "email", auth:oauth2Client }, function(err, uinfo){
      console.log(tokens);
      res.send(uinfo.email);
    })
  });


});


var port = 8080;
app.listen(port);


console.log('Express server started on port %s', port);
