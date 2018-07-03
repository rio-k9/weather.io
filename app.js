const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const config = require('./config/database');


const app = express();

mongoose.connect(config.database);
let db = mongoose.connection;

//Check connection
db.once('open', function(){
  console.log('Connected to MongoDB')
})

//Check for database errors
db.on('error', function(err){
  console.log(err)
})

//Import models


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.locals.basedir = path.join(__dirname, 'public')

//Bodyparser
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json());
app.use(cookieParser());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use(express.static(path.join(__dirname, 'public')));

//Express Session Middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));

//Express Messages Middlewar
app.use(require('connect-flash')());
app.use(function(req, res, next){
  res.locals.messages=require('express-messages')(req, res);
  next();
})


//Express Validator Middlewar
app.use(expressValidator({
  errorFormatter: function(param, msg, value){
    let namespace = param.split('.')
      , root = namespace.shift()
      , formParam = root;

    while(namespace.length){
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg : msg,
      value : value
    };
  }
}));

//Passport config
require('./config/passport')(passport)

app.use(passport.initialize());
app.use(passport.session());

app.get('*', function(req, res, next){
  console.log(req.user)
  res.locals.user = req.user || null;
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});



// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
