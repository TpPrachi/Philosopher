(function(){
  'use strict'

var express = require('express');
var router = express.Router();
var fs = require('fs-extra');
var logger = require('../../lib/logger')(__filename);
var Jimp = require('jimp');
var db = require('../../lib/db');

//Upload Profile Photo
router.post('/profilePhoto', function(req, res, next) {
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    logger.info("Uploading: " + filename);
    var filename = (new Date()).getTime() + '-' + filename;
    filename = decodeURI(filename);
    var dir = process.env.FILE_STORE + '/profilePhoto' ;
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    var patch = {
      profilePhoto : '/public/images/profile/profilePhoto/' + filename
    }
    //Need to ssave path for profile photo
    db['users'].findOneAndUpdate({_id: db.ObjectID(req.body.userId)}, {$set: patch}, function(err, data) {
      db['usersmapped'].findOneAndUpdate({userId: db.ObjectID(req.body.userId)}, {$set: patch}, function(err, data) {
        if (err) {
          logger.error(err);
        }

        var resizedImage = dir + '/resizedImage';
        if (!fs.existsSync(resizedImage)){
          fs.mkdirSync(resizedImage);
        }
        var fstream = fs.createWriteStream(dir + '/' + filename);
        var fstream1 = fs.createWriteStream(resizedImage + '/' + filename);
        file.pipe(fstream);
        fstream.on('close', function () {
          res.status(201).json({file: filename});
        });
      });
    });
  });
});

//Upload Philosophy Photo
router.post('/philosophyPhoto', function(req, res, next) {
  req.pipe(req.busboy);
  var philosophyPhotoStore = [];
  req.busboy.on('file', function (fieldname, file, filename) {
    logger.info("Uploading: " + filename);
    var filename = (new Date()).getTime() + '-' + filename;
    filename = decodeURI(filename);
    //Path where file will be uploaded
    var dir = process.env.FILE_STORE + '/philosophyPhoto';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    philosophyPhotoStore.push('/public/images/profile/philosophyPhoto/' + filename);
    var patch = {
      philosophyPhoto : philosophyPhotoStore
    }
    db['philosophies'].findOneAndUpdate({UID: db.ObjectID(req.body.userId)}, {$set: patch}, function(err, data) {
      if (err) {
        logger.error(err);
      }
      var fstream = fs.createWriteStream(dir + '/' + filename);
      file.pipe(fstream);
      fstream.on('close', function () {
        logger.info('Close fstream')
      });
    });
  });
  req.busboy.on('finish', function (fieldname, file, filename) {
    res.status(201).json({file: philosophyPhotoStore});
  });
});

//Upload Group Photo
router.post('/groupPhoto', function(req, res, next) {
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    logger.info("Uploading: " + filename);
    var filename = (new Date()).getTime() + '-' + filename;
    filename = decodeURI(filename);

    var dir = process.env.FILE_STORE + '/groupPhoto' ;
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    var patch = {
      profilePhoto : '/public/images/profile/groupPhoto/' + filename
    }
    //Need to ssave path for profile photo
    db['groups'].findOneAndUpdate({_id: db.ObjectID(req.body.userId)}, {$set: patch}, function(err, data) {
      if (err) {
        logger.error(err);
      }
      var resizedImage = dir + '/resizedImage';
      if (!fs.existsSync(resizedImage)){
        fs.mkdirSync(resizedImage);
      }
      var fstream = fs.createWriteStream(dir + '/' + filename);
      var fstream1 = fs.createWriteStream(resizedImage + '/' + filename);
      file.pipe(fstream);
      fstream.on('close', function () {
        res.status(201).json({file: filename});
      });
    });
  });
});

//Get Profile Photo
router.get('/profilePhoto/:file', function(req, res, next) {
  if(!req.params.file){
    res.status(422).json({'message' : 'file not provided'});
    return;
  }

  var filename = process.env.FILE_STORE  + '/profilePhoto' + req.params.file;

  filename = decodeURI(filename);
  if (!fs.existsSync(filename)){
    res.status(404).json({'message' : 'file not found'})
    return;
  }
  var fileToShow = filename.substring(filename.lastIndexOf('/') + 15 , filename.length);
  res.download(filename , fileToShow)
});

//Get Philosophy Photo
router.get('/philosophyPhoto/:file', function(req, res, next) {
  if(!req.params.file){
    res.status(422).json({'message' : 'file not provided'})
    return;
  }
  var filename = process.env.FILE_STORE  + '/philosophyPhoto/'+ req.params.file;

  filename = decodeURI(filename);
  if (!fs.existsSync(filename)){
    res.status(404).json({'message' : 'file not found'})
    return;
  }
  var fileToShow = filename.substring(filename.lastIndexOf('/') + 15 , filename.length);
  res.download(filename , fileToShow)
});

//Get Group Photo
router.get('/groupPhoto/:file', function(req, res, next) {
  if(!req.params.file){
    res.status(422).json({'message' : 'file not provided'})
    return;
  }
  var filename = process.env.FILE_STORE  + '/groupPhoto/'+ req.params.file;

  filename = decodeURI(filename);
  if (!fs.existsSync(filename)){
    res.status(404).json({'message' : 'file not found'})
    return;
  }
  var fileToShow = filename.substring(filename.lastIndexOf('/') + 15 , filename.length);
  res.download(filename , fileToShow)
});

module.exports = router;

})();
