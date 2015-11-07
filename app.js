var express = require('express');
var google = require('googleapis');
var mongoose = require('mongoose');
var app = express();


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



app.configure(function() {
  app.use(express.static(__dirname + '/public'));
});


var port = 8080;
app.listen(port);

app.get("/schedule", function(req, res){
  res.send("GET schedule");
});

app.post("/schedule", function(req, res){
  res.send("POST schedule");
});





console.log('Express server started on port %s', port);
