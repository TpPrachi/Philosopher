var types = require('../../lib/validator/types');
var date = types.date;
var rId = types.rId;
var id = types.id;


var schema = {
  followingUser : rId.label('Following User Id'),
  followedUser : rId.label('Followed User Id'),
  createdDate : date.label('Created Date')
}

module.exports = schema;
