'use strict';

(() => {
  const _ = require('lodash');

  //
})();

// function Trempoline_With_Factorial(){
//   function findFactorial(n, cb) {
//     var op = rec(n, n-1, cb);
//     while (op != null && typeof op === 'function') {
//       op = op();
//     }
//   }
//
//   function rec(n,k, cb) {
//       if(k === 0) {
//         cb(n);
//       } else {
//         n += k
//         return rec.bind(this, n, k-1, cb);
//       }
//   }
//
//   const findFact = 500000;
//   findFactorial(findFact, function(vv) {
//     console.log("VV :: " + vv);
//   });
// }
