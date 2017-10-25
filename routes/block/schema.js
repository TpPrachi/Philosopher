var types = require('../../lib/validator/types');
var rId = types.rId;
var id = types.id;


var schema = {
  blockTo : rId.label('User Id for Block')
}

module.exports = schema;
