var types = require('../../lib/validator/types');
var rString =  types.rString;
var rNumber =  types.rNumber;
var date = types.date;
var bool = types.bool;
var rId = types.rId;

var schema = {
  trendName : rString.label('Trend Name'),
  trendType : rString.label('Trend Type'),
  totalCountOfTrend : rNumber.label('Total Count of Trend'),
  isDeleted : bool.label('Is Deleted')
}

module.exports = schema;
