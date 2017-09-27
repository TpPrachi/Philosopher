var types = require('../../lib/validator/types');
var array = types.array;
var string =  types.string;
var any = types.any;
var anyArray = types.anyArray;

var schema = {
 groupName: string.label('Group Name'),
 addMembers: anyArray.label('Array Of Add Members'),
 removeMembers: anyArray.label('Array of Remove Members'),
 profilePhoto: string.label('Profile Photo of Group')
}

module.exports = schema;
