var types = require('../../lib/validator/types');
var rBigString = types.rBigString;
var rString =  types.rString;
var rNumber =  types.rNumber;
var date = types.date;
var bool = types.bool;
var rId = types.rId;

var schema = {
  username: rString.label('User Name').regex(/^[a-zA-Z0-9)\(._]+$/g),
  firstname: rString.label('First Name'),
  lastname: rString.label('Last Name'),
  email: rString.label('Email').email(),
  fullname : rString.label('Full Name'),
  dateOfBirth : date.label('Date Of Birth'),
  gender : rString.label('Gender'),
  biolosophy : rBigString.label('Biolosophy'),
  location : rString.label('Location'),
  langauge : rString.label('Langauge'),
  isDeleted : bool.label('Is Deleted'),
  isEmailVerified : bool.label('Is Email Verified')
  // password : ,
  // profilePicture : ,
  // profilePictureName : ,
}

module.exports = schema;
