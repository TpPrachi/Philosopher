var types = require('../../lib/validator/types');
var bigString = types.bigString;
var rString =  types.rString;
var string =  types.string;
var rNumber =  types.rNumber;
var number =  types.number;
var date = types.date;
var bool = types.bool;

var userSignUp = {
  email: rString.label('Email').email(),
  fullname : rString.label('Full Name'),
  username : rString.label('User Name'),
  dateOfBirth : date.label('Date Of Birth'),
  gender : string.label('Gender'),
  biolosophy : bigString.label('Biolosophy'),
  location : string.label('Location'),
  langauge : string.label('Langauge'),
  isDeleted : bool.label('Is Deleted'),
  isEmailVerified : bool.label('Is Email Verified'),
  password : string.label('Password'),
  profilePhoto :string.label('Profile Picture Name'),
  communityCount: number.label('community Count of User')
};

var userChangePassword = {
  password: rString.label('Password'),
  newPassword: rString.label('New Password')
};

module.exports = {
  userSignUp : userSignUp,
  userChangePassword : userChangePassword
};
