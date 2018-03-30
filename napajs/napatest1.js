// Napa.js is a multi-threaded JavaScript runtime built on V8,
// which was originally designed to develop highly iterative services
// with non-compromised performance in Bing. As it evolves, we find it useful
// to complement Node.js in CPU-bound tasks, with the capability of executing
// JavaScript in multiple V8 isolates and communicating between them.
// Napa.js is exposed as a Node.js module, while it can also be embedded in a host process without Node.js dependency.

// In Napa.js, all works related to multi-threading are around the concept of Zone,
// which is the basic unit to define policies and execute JavaScript code.
// A process may contain multiple zones, each consists of multiple JavaScript Workers.

// Within a zone, all workers are symmetrical: they load the same code, serve broadcast and execute requests in
// an indistinguishable manner. Basically, you cannot ask a zone to execute code on a specific worker.
// Workers across different zones are asymmetrical: they may load different code,
// or load the same code but reinforce different policies, like heap size, security settings,
//  etc. Applications may need multiple zones for work loads of different purposes or different policies.

// Problems
// When you keep increasing the matrix size (say for an example 10000x10000)
// you will run out of memory pretty soon. The reason for this is, when you
// share data across each worker data is copied over to each worker’s heap space.
// This makes Napa.js consume a lot of memory. As I mentioned above, in future,
// different memory sharing patterns will be used to improve the performance of Napa.js

const napa = require('napajs');
const NUMBER_OF_WORKERS = 10;

const zone = napa.zone.create('zone', { workers: NUMBER_OF_WORKERS} );

var size = 1000;

const matrix = [];
const vector = [];

for (let i = 0; i < size; i++) {
  matrix.push([]);
  for (let j = 0; j < size; j++) {
    matrix[i].push(getRandomInt(0,100));
  }
}

for (let i = 0; i < size; i++) {
  vector.push([getRandomInt(0,100)]);
}

console.log('Matrix:');
console.log(matrix);
console.log('Vector:');
console.log(vector);

function multiply (row, vector) {
  let result = 0;
  for (let i = 0; i < row.length; i++) {
    result += row[i] * vector[i][0];
  }

  for (const currentTime  = new Date().getTime() + 5; new Date().getTime() < currentTime;);  //looping to simulate some work

  return result;
}

var promises = [];

const start = Date.now();

for(var i = 0; i < size; i++)
promises[i] = zone.execute(multiply, [matrix[i], vector]);
console.log('-----------------------Inside Promises-------------------');
Promise.all(promises).then((results) => {
  const end = Date.now();
  console.log('Result:');
  console.log(results.map(result => [parseInt(result._payload)]));
  console.log('Runtime: ' + (end - start) + 'ms');
});

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
