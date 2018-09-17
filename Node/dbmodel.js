var config = require(__dirname + '/config');
var MongoClient = require('mongodb').MongoClient;
var dbmodel = {
    mongoFind: function (collection, data, callback) {
        MongoClient.connect(config.mongo_conf.connection_string, function (err, db) {
            if (err) {
                console.log("Mongo Error ");
                console.log(err);
                process.exit();
            }
            db.collection(collection).find(data).toArray(function (err, result) {
                //db.collection(collection).find(data).skip(15000).limit(15000).toArray(function (err, result) {
                if (err) {
                    console.log("Mongo Error ");
                    console.log(err);
                    process.exit();
                }
                db.close();
                callback(result);
            });
        });
    },
    mongoFindLimit: function (collection, data, limit, callback) {
        MongoClient.connect(config.mongo_conf.connection_string, function (err, db) {
            if (err) {
                console.log("Mongo Error ");
                console.log(err);
                process.exit();
            }
            db.collection(collection).find(data).limit(limit).toArray(function (err, result) {
                //db.collection(collection).find(data).skip(15000).limit(15000).toArray(function (err, result) {
                if (err) {
                    console.log("Mongo Error ");
                    console.log(err);
                    process.exit();
                }
                db.close();
                callback(result);
            });
        });
    },
    mongoAggregate: function (collection, pipleline, callback) {
        MongoClient.connect(config.mongo_conf.connection_string, function (err, db) {
            if (err) {
                console.log("Mongo Error ");
                console.log(err);
                process.exit();
            }
            db.collection(collection).aggregate(pipleline).toArray(function (err, result) {
                if (err) {
                    console.log("Mongo Error ");
                    console.log(err);
                    process.exit();
                }
                db.close();
                callback(result);
            });
        });
    },
    mongoUpdate: function (collection, where, data, callback) {
        MongoClient.connect(config.mongo_conf.connection_string, function (err, db) {
            if (err) {
                console.log("Mongo Error ");
                console.log(err);
                process.exit();
            }
            db.collection(collection).updateOne(where, data, function (err, result) {
                if (err) {
                    console.log("Mongo Error ");
                    console.log(err);
                    console.log("where :" + where.toString());
                    console.log("data :" + data.toString());
                    process.exit();
                }
                db.close();
                callback(result);
            });
        });
    },
    mongoUpdateMany: function (collection, where, data, option, callback) {
        MongoClient.connect(config.mongo_conf.connection_string, function (err, db) {
            if (err) {
                console.log("Mongo Error ");
                console.log(err);
                process.exit();
            }
            db.collection(collection).updateMany(where, data, option, function (err, result) {
                if (err) {
                    console.log("Mongo Error ");
                    console.log(err);
                    console.log("where :" + where.toString());
                    console.log("data :" + data.toString());
                    process.exit();
                }
                db.close();
                callback(result);
            });
        });
    },
    mongoInsert: function (collection, data, callback) {
        MongoClient.connect(config.mongo_conf.connection_string, function (err, db) {
            if (err) {
                console.log("Mongo Error ");
                console.log(err);
                process.exit();
            }
            db.collection(collection).insertOne(data, function (err, res) {
                if (err) {
                    console.log("Mongo Error ");
                    console.log(err);
                    process.exit();
                }
                db.close();
                callback(res);
            });
        });
    },
    mongoInsertMany: function (collection, data, callback) {
        MongoClient.connect(config.mongo_conf.connection_string, function (err, db) {
            if (err) {
                console.log("Mongo Error ");
                console.log(err);
                process.exit();
            }
            db.collection(collection).insertMany(data, function (err, res) {
                if (err) {
                    console.log("Mongo Error ");
                    console.log(err);
                    process.exit();
                }
                db.close();
                callback(res);
            });
        });
    },
    mongoRemove: function (collection, data, callback) {
        MongoClient.connect(config.mongo_conf.connection_string, function (err, db) {
            if (err) {
                console.log("Mongo Error ");
                console.log(err);
                process.exit();
            }
            db.collection(collection).remove(data, function (err, res) {
                if (err) {
                    console.log("Mongo Error ");
                    console.log(err);
                    process.exit();
                }
                db.close();
                callback(res);
            });
        });
    },
}
module.exports = dbmodel;