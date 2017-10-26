var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
var routes = require('./routes');
var passport = require('passport');
var db = require('./lib/db');
var logger = require('./lib/logger')(__filename);
var busboy = require('connect-busboy');
var fs = require('fs');

// ZmEzNDc0NDAtY2RkZS00NjE3LWFkZjMtMTZlOWIyYzc5Yzdh - oneSignle

// view engine setup - currently we does not require view engine so we are not add in our express builder
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(busboy());


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit:'100mb', extended: true }));
app.use(cookieParser());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, DELETE, PATCH");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization,X-Authorization , If-Modified-Since, Cache-Control, Pragma, client-offset, x-content-type-options,x-frame-options,role-schema-update,If-Match,client-tz");
    next();
});

// Route for access public folder resources
app.use('/public', function(req, res, next){ // Middleware for check file is existing or not
  if (fs.existsSync(path.join(__dirname, 'public', req.path))) {
      next(); // file exists go with normal flow
  } else {
    // if file not found that return 404 file not found.
    return res.status(404).send({success: false, message: "Resource you looking is not found."});
  }
}, express.static(path.join(__dirname, 'public')));

// initialize passport for authentication and route security
app.use(passport.initialize());
require('./lib/oauth')(passport);

// configure only authorization routes for bypass authentication (login && signup)
app.use('/', require('./lib/oauth/authorization'));

// get jwt token from store collection based on authorization headers
app.use('/', function(req, res, next) {
  if(req.headers.authorization) {
    db['tokenmapped'].findOne({uuid:req.headers.authorization}, function(err, user) {
      if(err) {
        logger.error('App.js :: ' + err);
        return res.status(501).send({success: false, message: err});
      }
      if(user) {
        req.headers.authorization = user.token;
        req.body.userId = user.userId;
      } else {
        logger.error('Invalid token provided.');
        return res.status(403).send({success: false, message: 'Invalid token provided.'});
      }
      next();
    });
  } else {
   logger.error('No token provided.');
   return res.status(403).send({success: false, message: 'No token provided.'});
  }

});

// Route for accessing images and videos from public directive.
// this route is secure with token validation, means if you have valid token then you can access files unser public directory
//app.use('/profile', express.static(path.join(__dirname, 'public')));
process.env.FILE_STORE = path.join(__dirname, (process.env.FILE_STORE || './public/images/profile'));

// authenticate every request for valida token and valid authorization
require('./lib/authentication')(app, passport);

// Configures all routes
routes.configure(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  logger.error("Not Found. Accessing route - " + req.path + " For " + req.method);
  res.status(404).send({"success": false, "message":"Not Found. Accessing route - " + req.path + " For " + req.method});
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  logger.error("Error found - " + err.message);
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
