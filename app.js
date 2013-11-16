var express = require('express');
var app = express();
var flash = require('connect-flash');
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/node-saas');
var routes = require('./routes')(db);

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.cookieSession({secret: "my s3cr3t!!!"}));
  app.use(flash());
  app.use(app.router);
  app.use(express.static('public'))
});

app.get('/', routes.index);

app.get('/images/new', routes.images.new);
app.post('/images', routes.images.create);
app.get('/images/:id/delete', routes.images.delete);
app.get('/images/:id/build', routes.images.build);

app.listen(3000);
console.log('Listening to port 3000');
