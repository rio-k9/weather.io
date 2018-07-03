const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

//Import User Model
let User = require('../models/user')

//Register Form
router.get('/register', function(req, res){
  res.render('register');
});

router.post('/register', function(req, res){
  const name = req.body.name;
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  const password2 = req.body.password2;

  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('username', 'Username is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  let errors = req.validationErrors();

  if(errors){
    res.render('register', {
      errors:errors
    });
  }
  else{
    let newUser = new User({
      name:name,
      email:email,
      username:username,
      password:password
    });
    bcrypt.genSalt(10, function(error, salt){
      bcrypt.hash(newUser.password, salt, function(error, hash){
        if(error){
          console.log(error)
        }
        else{
          newUser.password = hash;
          newUser.save(function(err){
            if(err){
              console.log(err);
            }
            else{
              req.flash('success', 'You are now registered and can log in.');
              res.redirect('/users/login');
            }
          })
        }
      });
    })
  }
});


//Login form
router.get('/login', function(req, res) {
  res.render('login')
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

//Login process
router.post('/login', function(req, res){
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res);
});


module.exports = router;