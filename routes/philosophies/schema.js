var types = require('../../lib/validator/types');
var rString =  types.rString;
var array = types.array;
var rNumber =  types.rNumber;
var number =  types.number;
var date = types.date;
var bool = types.bool;
var rId = types.rId;
var id = types.id;
var rExtraLargeString = types.rExtraLargeString;
var object = types.object.bind(types);


var schema = {
  userId: id.label('User Id'),
  philosophy: rExtraLargeString.label('Philosophy'),
  philosophyType: rString.label('Philosophy Type'),
  // trends: array().label('Questions array of object')
  like:object({
    count: rNumber.label('Like Count').default(0),
    info: array(object({
      _id: rId.label('Id'),
      date: date.label('Date')
    }).label('Like Info'))
  }).label('Like Details'),
  dislike:object({
    count: rNumber.label('Dislike Count').default(0),
    info: array(object({
      _id: rId.label('Id'),
      date: date.label('Date')
    }).label('Dislike Info'))
  }).label('Dislike Details'),
  objections:object({
    count: rNumber.label('Objection Count').default(0),
    info: array(object({
      _id: rId.label('Id'),
      date: date.label('Date')
    }).label('Objectios Info'))
  }).label('Objectios Details'),
  commentCount: number.label('Comment Count'),
  isDeleted: bool.label('Is Deleted')
}

module.exports = schema;


// comments
//
// comment
// commentBy
// philosophyId
// isDeleted
// llike
// dislike
// objections
