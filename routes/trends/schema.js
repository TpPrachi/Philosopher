var types = require('../../lib/validator/types');
var rString =  types.rString;
var rNumber =  types.rNumber;
var date = types.date;
var bool = types.bool;
var rId = types.rId;

var schema = {
  name : rString.label('Trend Name'),
  count : rNumber.label('Total Count of Trend')
}

module.exports = schema;
