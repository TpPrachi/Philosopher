var types = require('../../lib/validator/types');
var rBigString = types.rBigString
var bigString = types.bigString;
var string = types.string;
var rString =  types.rString;
var rNumber =  types.rNumber;
var number = types.number;
var date = types.date;
var bool = types.bool;
var rId = types.rId;

var schema = {
  username: string.label('User Name'),
  firstname: string.label('First Name'),
  lastname: string.label('Last Name'),
  email: string.label('Email').email(),
  fullname : string.label('Full Name'),
  username : string.label('User Name'),
  dateOfBirth : date.label('Date Of Birth'),
  gender : string.label('Gender'),
  biolosophy : bigString.label('Biolosophy'),
  location : string.label('Location'),
  langauge : string.label('Langauge'),
  isDeleted : bool.label('Is Deleted'),
  isEmailVerified : bool.label('Is Email Verified'),
  communityCount: number.label('community Count of User')
  // .regex(/^[a-zA-Z0-9)\(._]+$/g),
  // password : ,
  // profilePicture : ,
  // profilePictureName : ,
}

module.exports = schema;
