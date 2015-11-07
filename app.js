var express = require('express');
var google = require('googleapis');
var mongoose = require('mongoose');
var cred = require('./credentials.js');

var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');




var app = express();
app.use(session({
  secret: "hello",
  resave: true,
  saveUninitialized: false
}));

app.use(cookieParser("hello"));

var OAuth2Client = google.auth.OAuth2;

var authinfo = google.oauth2('v2');

var oauth2Client = new OAuth2Client(cred.CLIENT_ID, cred.CLIENT_SECRET, "http://localhost:8080/oauthcallback")


mongoose.connect('mongodb://localhost/test');


var UserSchema = new mongoose.Schema({
  email: String,
  freetimestart: Number,
  freetimeend: Number,
  todos: [{
    title: String,
    slots: Number,
    optionone: Number,
    optiontwo: Number
  }]
});

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

  console.log(code);

  oauth2Client.getToken(code, function(err, tokens){
    oauth2Client.setCredentials(tokens);
    authinfo.userinfo.get({fields: "email", auth:oauth2Client }, function(err, uinfo){
      req.session.email = uinfo.email;
      req.session.tokens = tokens;
      console.log(err);
      res.send(uinfo.email);
    })
  });


});



app.get("/schedule", function(req, res){
  console.log(req.session.email);
  res.send("GET schedule");
});

app.post("/schedule", function(req, res){
  res.send("POST schedule");
});


var port = 8080;
app.listen(port);


console.log('Express server started on port %s', port);
