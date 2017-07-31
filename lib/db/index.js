'use strict'
/**
* @name db/index.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
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
    collection: 'sample',
    index:{
      title: ''
    }
  },
  {
    collection: 'users',
    index:{
      username: ''
    }
  },
  {
    // For mapping useranme and userId for later used
    collection: 'usersmapped',
    index:{
      username: ''
    }
  },
  {
    // For mapping jwt token for valid users and send him GUID for request users
    collection: 'tokenmapped'
  },
  {
    collection: 'trends'
  },
  {
    collection: 'follow'
  },
  {
    collection: 'notification'
  },
	{
    collection: 'philosophies'
  },
  {
    // Hold comment related information of philosophies
    collection: 'comments'
  },
  {
    // Hold reply of comment related information of philosophies
    collection: 'reply'
  }
];

module.exports = db.configure.apply(this, entities);
