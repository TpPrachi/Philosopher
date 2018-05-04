var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var logger = require('./lib/logger')(__filename);

if (cluster.isMaster) {

  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Object.keys(cluster.workers).forEach(function(id) {
  //   console.log("I am running with ID : "+cluster.workers[id].process.pid);
  // });
  //Using above code - create worker id (because numCPUs == 4)
  // I am running with ID : 2007
  // I am running with ID : 2015
  // I am running with ID : 2016
  // I am running with ID : 2021

  logger.info(numCPUs);
  cluster.on('exit', function(worker, code, signal) {
    logger.info('worker ' + worker.process.pid + ' died');
  });
} else {
  //change this line to Your Node.js app entry point.
  require("./app.js");
}
