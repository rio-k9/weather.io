const express = require('express');
const router = express.Router();
//Access Control
function ensureAuthentication(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  else{}
  req.flash('danger', 'Please login');
  res.redirect('/users/login');
}

//Home Route
router.get('/',ensureAuthentication, function(req, res, next) {
  res.render('index')

});

module.exports = router;
