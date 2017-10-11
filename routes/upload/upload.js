(function(){
  'use strict'

var express = require('express');
var router = express.Router();
var fs = require('fs-extra');
var logger = require('../../lib/logger')(__filename);
var Jimp = require('jimp');
var db = require('../../lib/db');

//Upload Profile Photo
router.post('/profile', function(req, res, next) {
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    logger.info("Uploading: " + filename);
    var filename = (new Date()).getTime() + '-' + filename;
    filename = decodeURI(filename);
    var dir = process.env.FILE_STORE + '/profilePhoto' ;
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    //Need to ssave path for profile photo
    db['users'].findOneAndUpdate({_id: db.ObjectID(req.body.userId)}, {$set: {profilePhoto : filename}}, function(err, data) {
      db['usersmapped'].findOneAndUpdate({userId: db.ObjectID(req.body.userId)}, {$set:  {profilePhoto : filename}}, function(err, data) {
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
router.post('/philosophy/:type', function(req, res, next) {
  req.pipe(req.busboy);
  var temp = [];
  req.busboy.on('file', function (fieldname, file, filename) {
    logger.info("Uploading: " + filename);
    var filename = (new Date()).getTime() + '-' + filename;
    filename = decodeURI(filename);
    //Path where file will be uploaded
    //type = photo , video , recording
    if (req.params.type == 'photo') {
      var dir = process.env.FILE_STORE + '/philosophyPhoto';
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
      }
      temp.push(filename);
    }
    if (req.params.type == 'video') {
      var dir = process.env.FILE_STORE + '/philosophyVideo';
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
      }
      temp.push(filename);
    }
    if (req.params.type == 'recording') {
      var dir = process.env.FILE_STORE + '/philosophyRecording';
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
      }
      temp.push(filename);
    }
    var fstream = fs.createWriteStream(dir + '/' + filename);
    file.pipe(fstream);
    fstream.on('close', function () {
      logger.info('Close fstream')
    });
  });
  req.busboy.on('finish', function (fieldname, file, filename) {
    res.status(201).json({file: temp});
  });
});

//Upload Group Photo
//http://localhost:3009/upload/group?id=59c63d2d869912283cdb7e6c
router.post('/group', function(req, res, next) {
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    logger.info("Uploading: " + filename);
    var filename = (new Date()).getTime() + '-' + filename;
    filename = decodeURI(filename);
    var dir = process.env.FILE_STORE + '/groupPhoto' ;
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    if (req.query.id) {
      if (req.query.id.length == 24 && db.ObjectID.isValid(req.query.id)) {
        db['groups'].findOneAndUpdate({_id: db.ObjectID(req.query.id)}, {$set: {groupPhoto : filename}}, function(err, data) {
          if (err) {
            logger.error(err);
          }
          if(data.value == null) {
            res.status(500).send({"success":false, message : "Please provide valid group information."});
          } else {
            var resizedImage = dir + '/resizedImage';
            if (!fs.existsSync(resizedImage)){
              fs.mkdirSync(resizedImage);
            }
            var fstream = fs.createWriteStream(dir + '/' + filename);
            file.pipe(fstream);
            fstream.on('close', function () {
              res.status(201).send({"success":true, file : filename, message : "Successfully uploaded group picture."});
            });
          }
        });
      }else {
        res.status(500).send({"success":false, "message":"Invalid query string parameter."});
      }
    }else {
      var resizedImage = dir + '/resizedImage';
      if (!fs.existsSync(resizedImage)){
        fs.mkdirSync(resizedImage);
      }
      var fstream = fs.createWriteStream(dir + '/' + filename);
      file.pipe(fstream);
      fstream.on('close', function () {
        res.status(201).send({"success":true, file : filename});
      });
    }
  });
});

//Get Profile Photo
router.get('/profile/:file', function(req, res, next) {
  if(!req.params.file){
    res.status(422).json({'message' : 'file not provided'});
    return;
  }

  var filename = process.env.FILE_STORE  + '/profilePhoto/' + req.params.file;

  filename = decodeURI(filename);
  if (!fs.existsSync(filename)){
    res.status(404).json({'message' : 'file not found'})
    return;
  }
  var fileToShow = filename.substring(filename.lastIndexOf('/') + 15 , filename.length);
  res.download(filename , fileToShow)
});

//Get Philosophy Photo
router.get('/philosophy/:type/:file', function(req, res, next) {
  if(!req.params.file){
    res.status(422).json({'message' : 'file not provided'})
    return;
  }

  //type = photo , video , recording
  if (req.params.type == 'photo') {
    var filename = process.env.FILE_STORE  + '/philosophyPhoto/'+ req.params.file;
  }
  if (req.params.type == 'video') {
    var filename = process.env.FILE_STORE  + '/philosophyVideo/'+ req.params.file;
  }
  if (req.params.type == 'recording') {
    var filename = process.env.FILE_STORE  + '/philosophyRecording/'+ req.params.file;
  }

  filename = decodeURI(filename);
  if (!fs.existsSync(filename)){
    res.status(404).json({'message' : 'file not found'})
    return;
  }
  var fileToShow = filename.substring(filename.lastIndexOf('/') + 15 , filename.length);
  res.download(filename , fileToShow)
});

//Get Group Photo
router.get('/group/:file', function(req, res, next) {
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
