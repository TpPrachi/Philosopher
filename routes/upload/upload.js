(function(){
  'use strict'

var express = require('express');
var router = express.Router();
var fs = require('fs-extra');
var logger = require('../../lib/logger')(__filename);
var Jimp = require('jimp');
var db = require('../../lib/db');
//var multer  = require('multer')
//var upload = multer();

//Get API for uploaded items

//Mailer implementetion



router.post('/profilePhoto', function(req, res, next) {
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    logger.info("Uploading: " + filename);
    var filename = (new Date()).getTime() + '-' + filename;
    filename = decodeURI(filename);

    var dir = process.env.FILE_STORE + '/' + req.body.userId ;
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    var profilePhoto = dir + '/profilePhoto';
    if (!fs.existsSync(profilePhoto)){
      fs.mkdirSync(profilePhoto);
    }

    var path = '/public/images/profile' + req.body.userId + '/profilePhoto';

    var patch = {
      profilePhoto : path + '/' + filename
    }
    //Need to ssave path for profile photo
    db['users'].findOneAndUpdate({_id: db.ObjectID(req.body.userId)}, {$set: patch}, function(err, data) {
      db['usersmapped'].findOneAndUpdate({userId: db.ObjectID(req.body.userId)}, {$set: patch}, function(err, data) {
        if (err) {
          logger.error(err);
        }

        var resizedImage = profilePhoto + '/resizedImage';
        if (!fs.existsSync(resizedImage)){
          fs.mkdirSync(resizedImage);
        }
        var fstream = fs.createWriteStream(profilePhoto + '/' + filename);
        var fstream1 = fs.createWriteStream(resizedImage + '/' + filename);
        file.pipe(fstream);
        // file.pipe(fstream1);
        fstream.on('close', function () {
          // fstream1.on('close', function () {
          //   Jimp.read(resizedImage + '/' + filename, function (err, file) {
          //     logger.log("err :: " + err)
          //     if (err) throw err;
          //     file.resize(256, 256)
          //     .quality(50)
          //     .write(resizedImage + '/' + filename);
          //   });
          //   res.status(201).json({file: filename});
          // });
          res.status(201).json({file: filename});
        });
      });
    });
  });
});

router.post('/philosophyPhoto', function(req, res, next) {
  req.pipe(req.busboy);
  var arr = [];
  req.busboy.on('file', function (fieldname, file, filename) {
    logger.info("Uploading: " + filename);
    var filename = (new Date()).getTime() + '-' + filename;
    filename = decodeURI(filename);
    //Path where file will be uploaded

    var dir = process.env.FILE_STORE + '/' + req.body.userId ;
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    var philosophyPhoto = dir + '/philosophyPhoto';
    if (!fs.existsSync(philosophyPhoto)){
      fs.mkdirSync(philosophyPhoto);
    }

    var path = '/public/images/profile' + req.body.userId + '/philosophyPhoto';

    arr.push(path + '/' + filename);

    var patch = {
      philosophyPhoto : arr
    }
    db['philosophies'].findOneAndUpdate({UID: db.ObjectID(req.body.userId)}, {$set: patch}, function(err, data) {
      if (err) {
        logger.error(err);
      }

      // var resizedPhilosophyImage = philosophyPhoto + '/resizedPhilosophyImage';
      // if (!fs.existsSync(resizedPhilosophyImage)){
      //   fs.mkdirSync(resizedPhilosophyImage);
      // }
      var fstream = fs.createWriteStream(philosophyPhoto + '/' + filename);
      // var fstream1 = fs.createWriteStream(resizedPhilosophyImage + '/' + filename);
      file.pipe(fstream);
      // file.pipe(fstream1);
      fstream.on('close', function () {
        // fstream1.on('close', function () {
        //   Jimp.read(resizedPhilosophyImage + '/' + filename, function (err, file) {
        //     logger.log("err :: " + err)
        //     if (err) throw err;
        //     file.resize(256, 256)
        //     .quality(50)
        //     .write(resizedPhilosophyImage + '/' + filename);
        //   });
        // });
      });
    });
  });
  req.busboy.on('finish', function (fieldname, file, filename) {
    res.status(201).json({file: arr});
  });
});

//http://localhost:3009/upload/profilePhoto/1505755277674-IMG_1901.JPG
router.get('/profilePhoto/:file', function(req, res, next) {
  if(!req.params.file){
    res.status(422).json({'message' : 'file not provided'});
    return;
  }

  var filename = process.env.FILE_STORE  + '/' + req.body.userId + '/profilePhoto/'+ req.params.file;

  filename = decodeURI(filename);
  if (!fs.existsSync(filename)){
    res.status(404).json({'message' : 'file not found'})
    return;
  }
  var fileToShow = filename.substring(filename.lastIndexOf('/') + 15 , filename.length);
  res.download(filename , fileToShow)
});

router.get('/philosophyPhoto/:file', function(req, res, next) {
  if(!req.params.file){
    res.status(422).json({'message' : 'file not provided'})
    return;
  }

  var filename = process.env.FILE_STORE  + '/' + req.body.userId + '/philosophyPhoto/'+ req.params.file;

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
