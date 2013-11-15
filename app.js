var express = require('express');
var app = express();
var flash = require('connect-flash');

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.cookieParser());
  app.use(express.cookieSession({secret: "my s3cr3t!!!"}));
  app.use(flash());
  app.use(app.router);
  app.use(express.static('public'))
});

app.get('/', function(req, res) {
  res.render('index');
});

app.post('/start', function(req, res) {
  res.end('Spinning up container.');
});

app.listen(3000);
console.log('Listening to port 3000');
