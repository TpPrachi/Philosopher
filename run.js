'use strict';

(() => {
  const _ = require('lodash');

  const dns = require('dns');

  dns.resolve4('52.36.93.246', (err, addresses) => {
    if (err) throw err;

    console.log(`addresses: ${JSON.stringify(addresses)}`);

    addresses.forEach((a) => {
      dns.reverse(a, (err, hostnames) => {
        if (err) {
          throw err;
        }
        console.log(`reverse for ${a}: ${JSON.stringify(hostnames)}`);
      });
    });
  });


//   var email = "test@test.com";
//
// for(var i=0; i<500;i++) {
    // var object = {};
    // object['email'] = email + "" + i;
    // object['username'] = "Test Username";
    // object['fullname'] = "Test Fullname";
    // object['password'] = "Test@123";
    // object['profilePhoto'] = "";
    // object['communityCount'] = 0;
    // object['biolosophy'] = "Test for biolosophy";
    // object['location'] = "India";
//
//     db.users_copy.insert(object);
// }

//---------------------------------------------------------------------------

// var usersMappedInfo = [];
// db.users_copy.find({}).forEach(function(user){
//     var prepare = {};
//     prepare['email'] = user['email'];
//     prepare['username'] = user['username'];
//     prepare['fullname'] = user['fullname'];
//     prepare['profilePhoto'] = user['profilePhoto'];
//     prepare['communityCount'] = user['communityCount'];
//     prepare['biolosophy'] = user['biolosophy'];
//     prepare['location'] = user['location'];
//     prepare['userId'] = user['_id'];
//
//     usersMappedInfo.push(prepare);
// })
// db.usersmapped_copy.insertMany(usersMappedInfo);

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
