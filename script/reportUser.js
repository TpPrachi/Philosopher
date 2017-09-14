var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var url = (process.env.DB_PORT ? process.env.DB_PORT.replace('tcp://','mongodb://') : 'mongodb://localhost:27017') + ('/' + (process.env.DB_NAME || '/web'));

MongoClient.connect(url, function (err, db)
{
  if (err){
    console.log('Unable to connect to the mongoDB server. Error:', err);
  }else{

    console.log('Connection established to', url);

    var collection = db.collection('reportUser');
    var type1 = {
      "title": "Sexual Content"
    };
    var type2 = {
      "title": "Violent or repulsive content"
    };
    var type3 =  {
      "title": "Harmful Dangerous Acts"
    };
    var type4 =   {
      "title": "Child Abuse"
    };
    var type5 = {
      "title": "Rasist Content"
    };

    collection.insert([type1, type2, type3, type4, type5],
      function (err, result) {
        if (err) {
          console.log(err);
        }
        else {
          console.log('Inserted %d documents into the "report issue" collection. The documents inserted with "_id" are:', result.length, result);
        }
        db.close();
      });
    }
  });
