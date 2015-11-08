var express = require('express');
var google = require('googleapis');
var mongoose = require('mongoose');
var cred = require('./credentials.js');

var session = require('cookie-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');




var app = express();
app.use(session({
  secret: "hello",
  cookie: { maxAge: 60 * 60 * 1000 }
}));

app.use(cookieParser("hello"));
app.use(bodyParser({extended: true}));

var OAuth2Client = google.auth.OAuth2;

var authinfo = google.oauth2('v2');
var calendar = google.calendar('v3');

var oauth2Client = new OAuth2Client(cred.CLIENT_ID, cred.CLIENT_SECRET, cred.CALLBACK)


mongoose.connect(cred.MONGOURL);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


var UserSchema= mongoose.Schema({
  email: {type: String, unique: true},
  freetimestart: Number,
  freetimeend: Number,
  todos: [String]
});

var User = mongoose.model("User", UserSchema);

app.get("/login", function(req, res){
  if(!req.session.email){
    var url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/plus.me',
              'https://www.googleapis.com/auth/userinfo.email',
              'https://www.googleapis.com/auth/userinfo.profile',
              'https://www.googleapis.com/auth/calendar']
    });
    res.redirect(url);
  } else {
    res.send("Logged in as " + req.session.email);
  }
});

app.get("/", function(req, res){
  res.send("placeholder");
})


app.get("/oauthcallback", function(req, res){
  var code = req.query.code;


  oauth2Client.getToken(code, function(err, tokens){
    oauth2Client.setCredentials(tokens);
    authinfo.userinfo.get({fields: "email", auth:oauth2Client }, function(err, uinfo){
      req.session.email = uinfo.email;
      req.session.tokens = tokens;

      User.findOne({email: uinfo.email}, function(err, user){
        if(!user){
          var user = new User({email:uinfo.email});
          user.save(function(err,user) {
            if(err){
              console.log(err);
            }
            console.log("new user");
            res.redirect("/todos");
          });
        } else {

          console.log("old user");
          res.redirect("/todos");
        }


      });



    })
  });


});

app.get("/todos", authenticate, function(req, res){
  User.findOne({email: req.session.email}, function(err, user){
    if(err) console.log(err);
    res.render("todoform.ejs", {user: user});

  })

});

app.post("/todos", authenticate, function(req, res){
  var todo = req.body.todo;
  if(!todo){res.send("Empty")}
  User.update({email: req.session.email}, {$push: {todos: todo}}, function(err, data){
    console.log(data);

  })
  res.redirect("/todos");
})

app.post("/updateTodos", authenticate, function(req, res){
  var todos = JSON.parse(req.body.todos);
  if(todos == [""]) todos = [];

  User.update({email: req.session.email}, {todos: todos}, function(err, data){
    console.log(data);
  });
})



app.get("/schedule", authenticate, function(req, res){
  User.findOne({email: req.session.email}, function(err, user){
    var todos = user.todos;
    res.render("schedulepage.ejs", {todos:todos, dgen: generateDate})
  })



});

app.post("/schedule", authenticate, function(req, res){

  var summary = req.body.summary;
  var datetime = req.body.datetime;

  oauth2Client.setCredentials(req.session.tokens);
  var event = {
    'summary':  summary,
    'start': {
      'dateTime': datetime,
    },
    'end': {
      'dateTime': thirtyminslater(datetime),
    },
  }

  calendar.events.insert({
    auth: oauth2Client,
    calendarId: 'primary',
    resource: event,
  }, function(err, event) {
    if (err) {
      console.log('There was an error contacting the Calendar service: ' + err);
      return;
    }
    console.log('Event created: %s', event.htmlLink);
    res.json({"status": "success"});
  });


});


var port = 8080;
app.listen(port);


console.log('Express server started on port %s', port);


function generateDate(){
  var now = new Date()
  var t = {};
  t.y = now.getFullYear();
  t.m = now.getMonth();
  t.d = now.getDate();

  t.randomDay = Math.floor(Math.random()*6) + t.d;
  t.randomHour = Math.floor(Math.random()*12)+ 8;
  return new Date(t.y, t.m, t.randomDay, t.randomHour, 00, 00);
}

function thirtyminslater(date){
  var now = new Date(date);

  var hour = now.getHours();
  var minutes = now.getMinutes();

  if(minutes == 30){
    minutes = 0;
    hour+=1;
  } else {
    minutes+=30;
  }

  var then = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minutes, 00, now.getTimezoneOffset())
  return then.toISOString();



}

function authenticate(req, res, next){
  if(!req.session.email){
    res.redirect("/login");
  } else {
    next();
  }

}
