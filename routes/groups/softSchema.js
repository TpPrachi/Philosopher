var types = require('../../lib/validator/types');
var array = types.array;
var string =  types.string;
var any = types.any;

var schema = {
 groupName: string.label('Group Name'),
 addMembers: any.label('Array Of Add Members'),
 removeMembers: any.label('Array of Remove Members'),
 //Need to resolve here how to provide property for array() of elements -- Prachi
}

module.exports = schema;
