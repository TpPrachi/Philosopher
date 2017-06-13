var types = require('../../lib/validator/types');
var string = types.string;
var rString =  types.rString;
var rNumber =  types.rNumber;
var number = types.number;
var date = types.date;
var bool = types.bool;
var rId = types.rId;

var schema = {
  trendName : string.label('Trend Name'),
  trendType : string.label('Trend Type'),
  totalCountOfTrend : number.label('Total Count of Trend'),
  isDeleted : bool.label('Is Deleted')
}

module.exports = schema;
