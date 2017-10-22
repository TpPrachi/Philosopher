var types = require('../../lib/validator/types');
var string = types.string;
var rString =  types.rString;
var rNumber =  types.rNumber;
var number = types.number;
var id = types.id;
var array = types.array;
var date = types.date;
var bool = types.bool;
var rId = types.rId;
var rExtraLargeString = types.rExtraLargeString;
var extraLargeString = types.extraLargeString;
var optionalArray = types.optionalArray;
var object = types.object.bind(types);
var any = types.any;

var schema = {
  userId: id.label('User Id'),
  reply:rString.label("Reply Content"),
  philosophyId: id.label('philosophy Id'),
  replyType: string.label("Reply Type"),
  notifyUsers: any,
  like:object({
    count: number.label('Like Count'),
    info: array(object({
      _id: id.label('User Id'),
      date: date.label('Date')
    }).label('Like Info'))
  }).label('Like Details'),
  dislike:object({
    count: number.label('Dislike Count'),
    info: array(object({
      _id: id.label('Id'),
      date: date.label('Date')
    }).label('Dislike Info'))
  }).label('Dislike Details'),
  objections:object({
    count: number.label('Objection Count'),
    info: array(object({
      _id: id.label('Id'),
      date: date.label('Date')
    }).label('Objectios Info'))
  }).label('Objectios Details'),
  isDeleted: bool.label('Is Deleted')
}

module.exports = schema;

module.exports = schema;
