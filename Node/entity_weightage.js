var config = require('../config');
var fs = require("fs");
var async = require("async");
var request = require('request');
var htmlToText = require('html-to-text');
var _ = require('underscore');
var winston = require('winston');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient;
var nodemailer = require('nodemailer');
var unix = Math.round(+new Date() / 1000);
var path = require('path').join(__dirname, "/logs/" + unix + ".log");
//eval(fs.readFileSync(__dirname + '/../functions.js') + '');

//var dt_id = new mongodb.ObjectID('59a90d4813c9c1dc09005048');
var dt_id = 0;


weightage = {
    init: function () {
        var searchdt = {};
        if (dt_id !== 0) {
            searchdt = {"dt_id": dt_id};
        }
        weightage.getConfig(searchdt, function (dts) {
            library.doSynchronousLoop(dts, weightage.getCompanies, function () {
                console.log("Weightage calculation completed.");
                //console.log(companies.length);
            });
        });
    },
    getCompanies: function (dt, i, getCompanies_callback) {
        dbconnect.mongoFindElm('inx_cms_company', 'inx_cms',
                {'source_dt.dt_id': dt.dt_id},
                {'source_dt': {$elemMatch: {dt_id: dt.dt_id}}},
                function (companies) {
                    console.log("> Got Companies");
                    library.doSynchronousLoop(companies, weightage.companyWeightage, function () {
                        getCompanies_callback();
                    });
                });
    },
    getConfig: function (searchdt, getConfig_callback) {
        dbconnect.mongoFind('inx_cms_dt_src_config', 'inx_cms', searchdt, function (dts) {
            console.log("> Got DTs");
            getConfig_callback(dts);
        });
    },
    companyWeightage: function (company, i, companyWeightage_callback) {
        if ('source_dt' in company) {
            if (company.source_dt[0].source.length > 0) {
                dbconnect.mongoFind('inx_cms_dt_src_config', 'inx_cms',
                        {"dt_id": company.source_dt[0].dt_id, "tier.sources.source_id": {$in: company.source_dt[0].source}},
                        function (sources) {
                            // Got sources from config collection
                            // Only getting source, weightage and keyword count from tiers
                            var allsources = [];
                            for (i = 0; i < sources[0].tier.length; i++) {
                                for (j = 0; j < sources[0].tier[i].sources.length; j++) {
                                    allsources.push({'source_id': sources[0].tier[i].sources[j].source_id, 'source_weightage': sources[0].tier[i].sources[j].source_weightage,
                                        'source_keyword_count': sources[0].tier[i].sources[j].source_details.keywords.length});
                                }
                            }

                            var cal = 0;
                            var comsource = company.source_dt[0].source;
                            var companyso = [];
                            for (m = 0; m < comsource.length; m++) {
                                companyso.push(comsource[m].toString());
                            }

                            // Getting weightage of matched sources
                            var k = allsources.length;
                            while (k--) {
                                if (_.contains(companyso, allsources[k].source_id.toString())) {
                                    console.log("Keyword length:" + allsources[k].source_keyword_count);
                                    cal = cal + (allsources[k].source_weightage * allsources[k].source_keyword_count);
                                }
                            }

                            console.log("> Weightage: " + cal);

                            dbconnect.mongoUpdate('inx_cms_company', 'inx_cms', {_id: company._id, 'source_dt.dt_id': company.source_dt[0].dt_id}, {$set: {'source_dt.$.company_weightage': cal}}, function () {
                                companyWeightage_callback();
                            });
                        });
            }else{
                companyWeightage_callback();
            }
        } else {
            companyWeightage_callback();
        }
    }
};

// Default functions
library = {
    doSynchronousLoop: function (data, processData, done) {
        if (data.length > 0) {
            var loop = function (data, i, processData, done) {
                processData(data[i], i, function () {
                    if (++i < data.length) {
                        loop(data, i, processData, done);
                    } else {
                        done();
                    }
                });
            };
            loop(data, 0, processData, done);
        } else {
            done();
        }
    }
};
// Connectin with Mongo DB
dbconnect = {
    mongoFind: function (collection, db, data, callback) {
        var con;
        if (db == 'inx_cms') {
            con = config.inx_cms.mongo_conf.connection_string;
        } else if (db == 'inx_data') {
            con = config.inx_data.mongo_conf.connection_string;
        }
        MongoClient.connect(con, function (err, db) {
            if (err) {
                console.log("Mongo Error ");
                console.log(err);
                process.exit();
            }
            db.collection(collection).find(data).toArray(function (err, result) {
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
    mongoFindElm: function (collection, db, data, elm, callback) {
        var con;
        if (db == 'inx_cms') {
            con = config.inx_cms.mongo_conf.connection_string;
        } else if (db == 'inx_data') {
            con = config.inx_data.mongo_conf.connection_string;
        }
        MongoClient.connect(con, function (err, db) {
            if (err) {
                console.log("Mongo Error ");
                console.log(err);
                process.exit();
            }
            db.collection(collection).find(data, elm).toArray(function (err, result) {
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
    mongoUpdate: function (collection, db, where, data, callback) {
        var con;
        if (db == 'inx_cms') {
            con = config.inx_cms.mongo_conf.connection_string;
        } else if (db == 'inx_data') {
            con = config.inx_data.mongo_conf.connection_string;
        }
        MongoClient.connect(con, function (err, db) {
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
    mongoInsert: function (collection, db, data, callback) {
        var con;
        if (db == 'inx_cms') {
            con = config.inx_cms.mongo_conf.connection_string;
        } else if (db == 'inx_data') {
            con = config.inx_data.mongo_conf.connection_string;
        }
        MongoClient.connect(con, function (err, db) {
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
    }
};

weightage.init();