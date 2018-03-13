'use strict'
/**
* @name db/index.js
* @author Prachi Thakkar <prachi281194@gmail.com>
*
* @version 0.0.1
*/

var db = require('./db');

/**
* Set of all entities that will be used throughout the system, with following
* format:
* {
*   collection: <Name Of The Collection>,
*   index : <Pass index in exactly same format as expected by mongodb>
*           REF: https://docs.mongodb.org/manual/reference/method/db.collection.createIndex/
* }
*
*
*/

var entities = [
  {
    collection: 'sample'
  },
  {
    collection: 'users',
    index: {
      fullname: 'text',
      username: 'text'
    },
    fieldIndex: {
      UpdatedDate: -1
    }
  },
  {
    // For mapping useranme and userId for later used
    collection: 'usersmapped',
    fieldIndex: {
      UpdatedDate: 1
    }
  },
  {
    // For mapping jwt token for valid users and send him GUID for request users
    collection: 'tokenmapped'
  },
  {
    // For geting report content
    collection: 'reportUser'
  },
  {
    collection: 'reports'
  },
  {
    collection: 'trends',
    index: {
      name: 'text'
    },
    fieldIndex: {
      UpdatedDate: 1
    }
  },
  {
    collection: 'follow',
    fieldIndex: {
      UpdatedDate: 1
    }
  },
  {
    collection: 'notification',
    fieldIndex: {
      UpdatedDate: 1
    }
  },
	{
    collection: 'philosophies',
    index: {
      philosophy: 'text'
    },
    fieldIndex: {
      UpdatedDate: 1
    }
  },
  {
    // Hold comment related information of philosophies
    collection: 'comments',
    fieldIndex: {
      UpdatedDate: 1
    }
  },
  {
    // Hold reply of comment related information of philosophies
    collection: 'reply',
    fieldIndex: {
      UpdatedDate: 1
    }
  },
  {
    // Hold poll answers with related philosophy with users information
    collection: 'polls',
    fieldIndex: {
      UpdatedDate: 1
    }
  },{
    collection: 'groups',
    index: {
      groupName: 'text'
    }
  },
  {
    // Hold information about blocked users
    collection: 'block'
  }
];

module.exports = db.configure.apply(this, entities);
