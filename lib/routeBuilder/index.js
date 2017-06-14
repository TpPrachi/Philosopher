'use strict'
/**
* @name routeBuilder/index.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
*
* @version 0.0.0
*/
var q = require('q');
var db = require('../db');

var _getAll = function(resource, options) {
  var deffered = q.defer();
  db[resource].find({}).toArray(function(err, data) {
    if(err) {
      deffered.reject(err);
    }
    deffered.resolve(data);
  });
  return deffered.promise;
};

var _getOne = function(resource, options) {
  var deffered = q.defer();

  return deffered.promise;
};

var _post = function(resource, values) {
  var deffered = q.defer();

  return deffered.promise;
};

var _patch = function(resource, options, values) {
  var deffered = q.defer();

  return deffered.promise;
};

var _delete = function(resource, options) {
  var deffered = q.defer();

  return deffered.promise;
};

module.exports = {
  getAll : _getAll,
  getOne : _getOne,
  post : _post,
  patch : _patch,
  delete : _delete
};
