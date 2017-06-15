var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
//var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
var routes = require('./routes');
var passport = require('passport');
var db = require('./lib/db');
var logger = require('./lib/logger');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit:'100mb', extended: true }));
app.use(cookieParser());

app.use(passport.initialize());

require('./lib/oauth')(passport);

// configure only authorization routes for bypass authentication (login && signup)
app.use('/', require('./lib/oauth/authorization'));

app.use('/', function(req, res, next) {
  if(req.headers.authorization) {
    db['tokenmapped'].findOne({uuid:req.headers.authorization}, function(err, user) {
      if(err) {
        logger.error('App.js :: ' + err);
        throw err;
      }
      if(user) {
        req.headers.authorization = user.token;
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
app.use('/profile', express.static(path.join(__dirname, 'public')));

// authenticate every request for valida token and valid authorization
require('./lib/authentication')(app, passport);

// Configures all routes
routes.configure(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  logger.error("Not Found. Accessing route - " + req.path);
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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
