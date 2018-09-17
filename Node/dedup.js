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
eval(fs.readFileSync(__dirname + '/../functions.js') + '');

// Selection Process
var batchid = "20180420";
var dt_id = new mongodb.ObjectID('59a90d4513c9c1dc09004e30');
var include_sources = [];
//var include_sources = [{source_id: '5a0c409b65e54d1664be063f'}, {source_id: '5a0c402e65e54d1664be063c'}];

// === Signature ===
// > Process: 
// >> Success:
// >>>> Error:
// - Message/Note
// === Signature ===
var merge_count = 0;
var add_count = 0;
var merge_people = 0;
var add_people = 0;
var add_product = 0;



// Deduplication script
dedupe = {
    counryMaster: [],
    preInit: function () {
//        fetch country master
        dbconnect.mongoFind('inx_country', 'inx_cms', {}, function (result) {
            dedupe.counryMaster = result;
            dedupe.init();
        });
    },
    init: function () {
        dbconnect.mongoFind('inx_cms_dt_src_config', 'inx_cms', {"dt_id": dt_id}, function (result) {
            dedupe.sourceSort(result, include_sources, function (sources) {
                // Loop for Sources
                library.doSynchronousLoop(sources, dedupe.sourceDedupe, function () {
                    // Done source loop & finish
                    console.log("=========== Done Deduplication =================");
                    console.log("Merge entity count:" + merge_count);
                    console.log("Add entity count:" + add_count);
                    console.log("Merge people count:" + merge_people);
                    console.log("Add people count:" + add_people);
                    console.log("Add product count:" + add_product);

                });
            });
        });
    },
    sourceSort: function (result, include_sources, sourceSort_callback) {
        var tier = result[0].tier;
        var dt_keywords = result[0].dt_keywords;
        var srcs = [];
        for (i = 0; i < tier.length; i++) {
            var source = tier[i].sources;
            for (x = 0; x < source.length; x++) {
                srcs.push({
                    'tier_name': tier[i].tier_name,
                    'source_id': source[x].source_id,
                    'source_collection': source[x].source_collection,
                    'source_weightage': source[x].source_weightage,
                    'dt_keywords': dt_keywords
                });
            }
        }
        srcs.sort(function (a, b) {
            return (a.source_weightage < b.source_weightage) ? 1 : -1;
        });
        if (include_sources.length > 0) {
            var ret = [];
            for (i = 0; i < srcs.length; i++) {
                for (x = 0; x < include_sources.length; x++) {
                    if (include_sources[x].source_id == srcs[i].source_id) {
                        ret.push(srcs[i]);
                    }
                }
            }
            sourceSort_callback(ret);
        } else {
            sourceSort_callback(srcs);
        }
    },
    sourceDedupe: function (sources, i, sourceDedupe_callback) {
        console.log("====== Source Start :" + sources.source_collection + " ==============");
        dbconnect.mongoFind(sources.source_collection, 'inx_cms', {
            "dt": {$elemMatch: {"dt_id": dt_id, "duplicate_check": 0}}

        }, function (source_data) {
            if (source_data.length > 0) {
                // Adding source_id to every source entity.
                source_data = _.map(source_data, function (num) {
                    return _.extend(num, {source_id: sources.source_id, dt_keyword: sources.dt_keywords, source_collection: sources.source_collection})
                });

                // Loop for Entity
                library.doSynchronousLoop(source_data, dedupe.dedupeEntity, function () {
                    // Done entity loop & go for next source
                    console.log("====== Source End :" + sources.source_collection + " ==============");
                    sourceDedupe_callback();

                });
            } else {
                console.log("> No Data in source collection:" + sources.source_collection);
                // Next source
                sourceDedupe_callback();
            }
        });
    },
    dedupeEntity: function (entity_data, i, dedupeEntity_callback) {
        ///////////////// Search Website /////////////////
        console.log("============ Entity Dedupe Start =======================================");
        console.log(" Entity URL :" + entity_data.company_source_url + " Entity Name :" + entity_data.company_name);

        console.log('=== before entity_data ====');
        console.log(entity_data);
//         trim all fields
        entity_data = deepMapTrim(entity_data, function (val, key) {
            return (val == 'undefined' || val == 'null' || val == null || val == undefined) ? '' : val;
        });


        /**
         * Data Intelligency
         */

//      company location
        if (entity_data.company_location != null && entity_data.company_location != '') {
            var company_location = [];
            _.each(entity_data.company_location, function (locationItem) {
                if (typeof locationItem != 'undefined') {
                    if (locationItem.address1 != null) {
//                  Extact country from address if no direct country found
                        if (typeof locationItem.country_name == 'undefined') {

                            var countrName = _.find(dedupe.counryMaster, function (countryItem) {
                                var cn = dataIntelligency.extractCountryFromString(locationItem.address1, countryItem.country_name)
                                if (cn != '' && cn != null) {
                                    return countryItem;
                                }

                            });
                            if (!_.isEmpty(countrName)) {
                                locationItem.country_name = countrName.country_name;
                            }
                        }
                        company_location.push(locationItem);

                    }
                }
            });
            entity_data.company_location = company_location;
        }
//      company social links
        if (entity_data.company_social != null && entity_data.company_social != '') {
            function _sanitizeSocial(url, domain) {
                if (typeof url != 'undefined' && url != null) {
                    if (url.indexOf(domain) == -1) {
                        url = '';
                    }
                }
                return url;
            }
            entity_data.company_social.linkedIn = _sanitizeSocial(entity_data.company_social.linkedIn, 'linkedin.com');
            entity_data.company_social.facebook = _sanitizeSocial(entity_data.company_social.facebook, 'facebook.com');
            entity_data.company_social.twitter = _sanitizeSocial(entity_data.company_social.twitter, 'twitter.com');
        }
//      company founded year
        if (entity_data.company_founded_year != null && entity_data.company_founded_year != '') {
            entity_data.company_founded_year = dataIntelligency.extractYearFromString(entity_data.company_founded_year);
        }


        if ((entity_data.company_source_url == '' || typeof entity_data.company_source_url == 'undefined' || entity_data.company_source_url == null) && (entity_data.company_id == '' || typeof entity_data.company_id == 'undefined' || entity_data.company_id == null)) {
            /// No company_source_url and company_id
            dedupe.mergeWithWebNCompany(entity_data, function (webncompanycheck) {
                if (webncompanycheck === 'true') {
                    merge_count++;
                    dedupeEntity_callback();
                } else {
                    ///////////////// Search Social website /////////////////
                    dedupe.mergeWithSocial(entity_data, function (socialcheck) {
                        if (socialcheck === 'true') {
                            merge_count++;
                            dedupeEntity_callback();
                        } else {
                            add_count++;
                            ///////////////// Add new entity /////////////////
                            dedupe.addEntity(entity_data, function (entity_id) {
                                dedupe.dedupePeople(entity_data, entity_id, function () {
                                    dedupe.addProduct(entity_data, entity_id, function () {
                                        dedupe.doneEntityDedupe(entity_data.source_collection, entity_data._id, function () {
                                            dedupeEntity_callback();
                                        });
                                    });
                                });
                            });
                        }
                    });
                }
            });
        } else {
            /// With company_source_url, batch id or company_id, batch id
            var serchforwebcond = [];
            if (entity_data.company_source_url != "" && typeof entity_data.company_source_url != 'undefined') {
                serchforwebcond.push({'source_ref.company_source_url': entity_data.company_source_url, 'source_ref.batch_id': batchid});
            }
            if (entity_data.company_id != "" && typeof entity_data.company_id != 'undefined') {
                serchforwebcond.push({'source_ref.source_company_unique_id': entity_data.company_id, 'source_ref.batch_id': batchid});
            }
            var searchforweb = {
                'source_ref.source_id': entity_data.source_id,
                $or: serchforwebcond
            };
            console.log('=== searchforweb ===');
            console.log(searchforweb);
            dedupe.dedupwithCMS(searchforweb, function (entity_data_filter) {
                if (entity_data_filter.length > 0) {
                    dedupe.doneEntityDedupe(entity_data.source_collection, entity_data._id, function () {
                        dedupeEntity_callback();
                    });
                } else {
                    dedupe.mergeWithWebNCompany(entity_data, function (webncompanycheck) {
                        if (webncompanycheck === 'true') {
                            merge_count++;
                            dedupe.doneEntityDedupe(entity_data.source_collection, entity_data._id, function () {
                                dedupeEntity_callback();
                            });
                        } else {
                            ///////////////// Search Social website /////////////////
                            dedupe.mergeWithSocial(entity_data, function (socialcheck) {
                                if (socialcheck === 'true') {
                                    merge_count++;
                                    dedupe.doneEntityDedupe(entity_data.source_collection, entity_data._id, function () {
                                        dedupeEntity_callback();
                                    });
                                } else {
                                    add_count++;
                                    ///////////////// Add new entity /////////////////
                                    dedupe.addEntity(entity_data, function (entity_id) {
                                        dedupe.dedupePeople(entity_data, entity_id, function () {
                                            dedupe.addProduct(entity_data, entity_id, function () {
                                                dedupe.doneEntityDedupe(entity_data.source_collection, entity_data._id, function () {
                                                    dedupeEntity_callback();
                                                });
                                            });
                                        });
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    },
    mergeWithWebNCompany: function (entity_data, mergeWithWebNCompany_callback) {
        var searchforweb = [];
        if (typeof entity_data.company_website != 'undefined' && entity_data.company_website != null && entity_data.company_website != '') {
            if (_.isArray(entity_data.company_website)) {
                var c_website = _.map(entity_data.company_website, function (num) {
//                    return num.replace(/(^\w+:|^)\/\//, '');
                    return num.trim();
                });
                searchforweb = {$or: [
                        {'company_website.value': {$in: c_website}},
                        {'company_website.source.$.value': {$in: c_website}}
                    ]};

            } else if (entity_data.company_website != null && entity_data.company_website != '') {
                searchforweb = {$or: [
                        {'company_website.value': entity_data.company_website.trim()}, //entity_data.company_website.replace(/(^\w+:|^)\/\//, '')
                        {'company_website.source.$.value': entity_data.company_website.trim()}
                    ]};
            }
        }
        dedupe.dedupwithCMS(searchforweb, function (entity_data_filter) {
            if (entity_data_filter.length > 0) {
                entity_data_filter = entity_data_filter[0];
                var live_comp_name = entity_data_filter.company_name.value.trim();
                var source_comp_name = entity_data.company_name.trim();
                var entity_id = entity_data_filter._id;
                var match_one = new RegExp("^" + source_comp_name + "");
                var match_two = new RegExp("^" + live_comp_name + "");
                if (live_comp_name.match(match_one) || source_comp_name.match(match_two)) {
                    console.log("> Got Web:" + entity_id + "===" + entity_data.company_name + "===");
                    dedupe.mergeEntity(entity_id, entity_data, entity_data_filter, function () {
                        dedupe.dedupePeople(entity_data, entity_id, function () {
                            dedupe.addProduct(entity_data, entity_id, function () {
                                dedupe.doneEntityDedupe(entity_data.source_collection, entity_data._id, function () {
                                    mergeWithWebNCompany_callback('true');
                                });
                            });
                        });
                    });
                } else {
                    console.log("> company name match failed Got Web:" + entity_id + "===" + entity_data.company_name + "===");
                    mergeWithWebNCompany_callback('false');
                }
            } else {
                mergeWithWebNCompany_callback('false');
            }
        });
    },
    mergeWithSocial: function (entity_data, mergeWithSocial_callback) {
        ///////////////// Search Social website /////////////////
        var searchforsocial = [];
        if ('company_social' in entity_data) {
            if (typeof entity_data.company_social.linkedIn != 'undefined' && entity_data.company_social.linkedIn != null) {
                if (entity_data.company_social.linkedIn.trim() != '') {
                    searchforsocial.push(
                            {'company_social.value.linkedIn': entity_data.company_social.linkedIn},
                            {'company_social.source.$.value.linkedIn': entity_data.company_social.linkedIn}
                    );
                }
            }
            if (typeof entity_data.company_social.facebook != 'undefined' && entity_data.company_social.facebook != null) {
                if (entity_data.company_social.facebook.trim() != '') {
                    searchforsocial.push(
                            {'company_social.value.facebook': entity_data.company_social.facebook},
                            {'company_social.source.$.value.facebook': entity_data.company_social.facebook}
                    );
                }
            }
            if (typeof entity_data.company_social.twitter != 'undefined' && entity_data.company_social.twitter != null) {
                if (entity_data.company_social.twitter.trim() != '') {
                    searchforsocial.push(
                            {'company_social.value.twitter': entity_data.company_social.twitter},
                            {'company_social.source.$.value.twitter': entity_data.company_social.twitter}
                    );
                }
            }
        }
        var where = [];
        if (searchforsocial.length > 0) {
            where = {$or: searchforsocial};
        }

        dedupe.dedupwithCMS(where, function (entity_data_filter) {
            if (entity_data_filter.length > 0) {
                var entity_id = entity_data_filter[0]._id;
                entity_data_filter = entity_data_filter[0];
                console.log("> Got Social:" + entity_id + "===" + entity_data.company_name);
                dedupe.mergeEntity(entity_id, entity_data, entity_data_filter, function () {
                    dedupe.dedupePeople(entity_data, entity_id, function () {
                        dedupe.addProduct(entity_data, entity_id, function () {
                            dedupe.doneEntityDedupe(entity_data.source_collection, entity_data._id, function () {
                                mergeWithSocial_callback('true');
                            });
                        });
                    });
                });
            } else {
                mergeWithSocial_callback('false');
            }
        });
    },
    doneEntityDedupe: function (collection_name, entity_id, doneEntityDedupe_callback) {
        dbconnect.mongoUpdate(collection_name, 'inx_cms', {_id: entity_id, 'dt.dt_id': dt_id}, {$set: {'dt.$.duplicate_check': 1}}, function () {
            doneEntityDedupe_callback();
        });
    },
    dedupwithCMS: function (searchfor, dedupwithCMS_callback) {
        if (searchfor != '') {
            dbconnect.mongoFind('inx_cms_company', 'inx_cms', searchfor, function (entity_data_filter) {
                dedupwithCMS_callback(entity_data_filter);
            });
        } else {
            dedupwithCMS_callback({});
        }
    },
    mergeEntity: function (exist_entity_id, entity_data, entity_data_filter, mergeEntity_callback) {
        console.log("============ Merge Entity =======================================");
        console.log(" Entity URL :" + entity_data.company_source_url + " Entity Name :" + entity_data.company_name);
        /// Update main value if it is blank
        var fieldToUpdate = ['company_name', 'company_whats_unique', 'company_social', 'company_website', 'company_founded_year',
            'company_emp_size', 'company_about', 'company_location'];
        var updateDataFields = {};
        entity_data_filter = deepMapTrim(entity_data_filter, function (val, key) {
            return (val == 'undefined' || val == 'null' || val == null || val == undefined) ? '' : val;
        });
        _.each(fieldToUpdate, function (field) {
            if (typeof entity_data_filter[field] != 'undefined' && entity_data[field] != null && entity_data[field] != '') {
                if (typeof entity_data_filter[field].value != 'undefined') {
                    if (entity_data_filter[field].value == '') {
                        updateDataFields[field + '.value'] = entity_data[field];
                    }
                } else {
                    updateDataFields[field + '.value'] = entity_data[field];
                }
            }
        });

        /// Company root DT 
        var company_root_dt = [];
        if (entity_data_filter['company_dt'].length > 0) {
            for (i = 0; i < entity_data_filter['company_dt'].length; i++) {
                if (entity_data_filter['company_dt'][i]['dt_root'] == 0) {
                    company_root_dt.push(entity_data_filter['company_dt'][i]['dt_id'].toString());
                }
            }
        }

//      Merge Location in Main value if not exits
        var company_new_location = [];
        if (entity_data.company_location != null && entity_data.company_location != ''
                && typeof updateDataFields['company_location.value'] == 'undefined'
                && entity_data_filter.company_location != ''
                && entity_data_filter.company_location != null) {
            _.each(entity_data.company_location, function (locationItem) {
                var sourceLocation = JSON.stringify(locationItem);
                var exists = _.find(entity_data_filter.company_location.value, function (location) {
                    var dbLocation = JSON.stringify(location);
                    return (dbLocation == sourceLocation);
                });
                if (_.isEmpty(exists)) {
                    company_new_location.push(locationItem);
                }
            });
        }


        var updatedt;
        var source_id = entity_data.source_id;
        var where = {_id: exist_entity_id};
        var wheredt;
        var ifexist = {$pull: {
                'company_name.source': {source_id: source_id},
                'company_whats_unique.source': {source_id: source_id},
                'company_founded_year.source': {source_id: source_id},
                'company_social.source': {source_id: source_id},
                'company_website.source': {source_id: source_id},
                'company_location.source': {source_id: source_id},
                'company_emp_size.source': {source_id: source_id},
                'company_about.source': {source_id: source_id},
                'company_profile_videos.source': {source_id: source_id},
                'company_logo.source': {source_id: source_id}
            }};

        dedupe.checkDtExits({_id: exist_entity_id, 'source_dt.dt_id': dt_id}, function (isexist) {
            var keywordMatched = [];
            for (x = 0; x < entity_data.dt.length; x++) {
                if (entity_data.dt[x].dt_id.toString() == dt_id.toString()) {
                    keywordMatched = entity_data.dt[x].keyword_match;
                }
            }
            if (isexist == true) {
//              for same DT
                wheredt = {_id: exist_entity_id, 'source_dt.dt_id': dt_id};
                updatedt = {
                    $addToSet: {
                        'source_ref': {
                            'source_id': source_id,
                            'company_source_url': entity_data.company_source_url,
                            'source_company_unique_id': entity_data.company_id,
                            'source_company_id': entity_data._id,
                            'batch_id': batchid,
                            'date': new Date()
                        },
                        'company_name.source': {
                            'source_id': source_id,
                            'value': entity_data.company_name,
                            'date_captured': new Date()
                        },
                        'company_whats_unique.source': {
                            'source_id': source_id,
                            'value': entity_data.company_whats_unique,
                            'date_captured': new Date()
                        },
                        'company_social.source': {
                            'source_id': source_id,
                            'value': {
                                'twitter': (typeof entity_data.company_social != 'undefined') ? entity_data.company_social.twitter : "",
                                'facebook': (typeof entity_data.company_social != 'undefined') ? entity_data.company_social.facebook : "",
                                'linkedIn': (typeof entity_data.company_social != 'undefined') ? entity_data.company_social.linkedIn : ""
                            },
                            'date_captured': new Date()
                        },
                        'company_website.source': {
                            'source_id': source_id,
                            'value': entity_data.company_website,
                            'date_captured': new Date()
                        },
                        'company_founded_year.source': {
                            'source_id': source_id,
                            'value': entity_data.company_founded_year,
                            'date_captured': new Date()
                        },
                        'company_emp_size.source': {
                            'source_id': source_id,
                            'value': entity_data.company_emp_size,
                            'date_captured': new Date()
                        },
                        'company_about.source': {
                            'source_id': source_id,
                            'value': entity_data.company_about,
                            'date_captured': new Date()
                        },
                        'company_location.source': {
                            'source_id': source_id,
                            'value': entity_data.company_location,
                            'date_captured': new Date()
                        },
                        'company_profile_videos.source': {
                            'source_id': source_id,
                            'value': entity_data.company_profile_videos,
                            'date_captured': new Date()
                        },
                        'company_logo.source': {
                            'source_id': source_id,
                            'value': {'company_logo': entity_data.company_logo, 'company_logo_local': entity_data.company_logo_local},
                            'date_captured': new Date()
                        },
                        'source_dt.$.keyword_matched': {$each: keywordMatched},
                        'source_dt.$.source': source_id
                    }

                };

                /// If dt is present in company_dt it will send for Processing otherwise it will send for Screening
                if (_.contains(company_root_dt, dt_id.toString())) {
                    updatedt['$set'] = {
                        'source_dt.$.company_in_queue': 3,
                        'source_dt.$.screening_mode': 1,
                        'source_dt.$.tab_updated.basic_info': 0,
                        'source_dt.$.tab_updated.funding_mna': 0,
                        'source_dt.$.tab_updated.competitors': 0,
                        'source_dt.$.tab_updated.ipr': 0,
                        'source_dt.$.tab_updated.people': 0,
                        'source_dt.$.tab_updated.product': 0,
                        'source_dt.$.tab_updated.company_taxonomy': 0,
                        'source_dt.$.tab_updated.advanced': 0,
                        'source_dt.$.dt_keyword': entity_data.dt_keyword
                    };
                } else {
                    updatedt['$set'] = {
                        'source_dt.$.company_in_queue': 2,
                        'source_dt.$.screening_mode': 0,
                        'source_dt.$.tab_updated.basic_info': 0,
                        'source_dt.$.tab_updated.funding_mna': 0,
                        'source_dt.$.tab_updated.competitors': 0,
                        'source_dt.$.tab_updated.ipr': 0,
                        'source_dt.$.tab_updated.people': 0,
                        'source_dt.$.tab_updated.product': 0,
                        'source_dt.$.tab_updated.company_taxonomy': 0,
                        'source_dt.$.tab_updated.advanced': 0,
                        'source_dt.$.dt_keyword': entity_data.dt_keyword
                    };
                }

            } else {
                wheredt = {_id: exist_entity_id};
                updatedt = {
                    $addToSet: {
                        'source_ref': {
                            'source_id': source_id,
                            'company_source_url': entity_data.company_source_url,
                            'source_company_unique_id': entity_data.company_id,
                            'source_company_id': entity_data._id,
                            'batch_id': batchid,
                            'date': new Date()
                        },
                        'company_name.source': {
                            'source_id': source_id,
                            'value': entity_data.company_name,
                            'date_captured': new Date()
                        },
                        'company_whats_unique.source': {
                            'source_id': source_id,
                            'value': entity_data.company_whats_unique,
                            'date_captured': new Date()
                        },
                        'company_social.source': {
                            'source_id': source_id,
                            'value': {
                                'twitter': (typeof entity_data.company_social != 'undefined') ? entity_data.company_social.twitter : "",
                                'facebook': (typeof entity_data.company_social != 'undefined') ? entity_data.company_social.facebook : "",
                                'linkedIn': (typeof entity_data.company_social != 'undefined') ? entity_data.company_social.linkedIn : ""
                            },
                            'date_captured': new Date()
                        },
                        'company_website.source': {
                            'source_id': source_id,
                            'value': entity_data.company_website,
                            'date_captured': new Date()
                        },
                        'company_founded_year.source': {
                            'source_id': source_id,
                            'value': entity_data.company_founded_year,
                            'date_captured': new Date()
                        },
                        'company_emp_size.source': {
                            'source_id': source_id,
                            'value': entity_data.company_emp_size,
                            'date_captured': new Date()
                        },
                        'company_about.source': {
                            'source_id': source_id,
                            'value': entity_data.company_about,
                            'date_captured': new Date()
                        },
                        'company_location.source': {
                            'source_id': source_id,
                            'value': entity_data.company_location,
                            'date_captured': new Date()
                        },

                        'company_profile_videos.source': {
                            'source_id': source_id,
                            'value': entity_data.company_profile_videos,
                            'date_captured': new Date()
                        },
                        'company_logo.source': {
                            'source_id': source_id,
                            'value': {'company_logo': entity_data.company_logo, 'company_logo_local': entity_data.company_logo_local},
                            'date_captured': new Date()
                        },
                        'source_dt': {
                            'dt_id': dt_id,
                            'dt_keyword': entity_data.dt_keyword,
                            'keyword_matched': keywordMatched,
                            'source': [
                                source_id
                            ],
                            'company_in_queue': 2,
                            'screening_mode': 0,
                            'publisher_remark': {
                                'remark': '',
                                'date_time': new Date()
                            },
                            'company_is_send_back': 0,
                            'tab_updated': {
                                'basic_info': 0,
                                'funding_mna': 0,
                                'competitors': 0,
                                'ipr': 0,
                                'people': 0,
                                'product': 0,
                                'company_taxonomy': 0
                            },
                            'last_update_date': new Date()
                        }
                    },
                };
            }
            if (!_.isEmpty(company_new_location)) {
                console.log('company_new_location ');
                console.log(company_new_location);
                updatedt['$addToSet']['company_location.value'] = {$each: company_new_location};
            }
            if (!_.isEmpty(updateDataFields)) {
                console.log('=== updateDataFields ==');
                console.log(updateDataFields);
                updatedt['$set'] = updateDataFields;
            }
//            dbconnect.mongoUpdate('inx_cms_company', 'inx_cms', where, ifexist, function () {
            dbconnect.mongoUpdate('inx_cms_company', 'inx_cms', wheredt, updatedt, function (result) {
                console.log(">> Entity merge successfully:");
//                    console.log(result);
                mergeEntity_callback();
            });
//            });
        });
        //mergeEntity_callback();
    },
    addEntity: function (entity_data, addEntity_callback) {
        console.log("============ Add new =======================================");
        console.log(" Entity URL :" + entity_data.company_source_url + " Entity Name :" + entity_data.company_name);
        var keywordMatched = [];
        for (x = 0; x < entity_data.dt.length; x++) {
            if (entity_data.dt[x].dt_id.toString() == dt_id.toString()) {
                keywordMatched = entity_data.dt[x].keyword_match;
            }
        }
        var source_id = entity_data.source_id;
        var data = {
            'company_live_ref_id': '',
            'source_ref': [{
                    'source_id': source_id,
                    'company_source_url': entity_data.company_source_url,
                    'source_company_unique_id': entity_data.company_id,
                    'source_company_id': entity_data._id,
                    'batch_id': batchid,
                    'date': new Date()
                }],
            'company_create_date': new Date(),
            'company_dt': [],
            'company_product': [],
            'company_industry': [],
            'source_dt': [{
                    'dt_id': dt_id,
                    'dt_keyword': entity_data.dt_keyword,
                    'keyword_matched': keywordMatched,
                    'source': [
                        source_id
                    ],
                    'company_in_queue': 2,
                    'screening_mode': 0,
                    'publisher_remark': {
                        'remark': '',
                        'date_time': new Date()
                    },
                    'company_is_send_back': 0,
                    'tab_updated': {
                        'basic_info': 0,
                        'funding_mna': 0,
                        'competitors': 0,
                        'ipr': 0,
                        'people': 0,
                        'product': 0,
                        'company_taxonomy': 0
                    },
                    'last_update_date': new Date()
                }],
            'company_name': {
                'value': entity_data.company_name,
                'source': [{
                        'source_id': entity_data.source_id,
                        'value': entity_data.company_name,
                        'date_captured': new Date()
                    }]
            },
            'company_whats_unique': {
                'value': entity_data.company_whats_unique,
                'source': [{
                        'source_id': entity_data.source_id,
                        'value': entity_data.company_whats_unique,
                        'date_captured': new Date()
                    }]
            },
            'company_social': {
                'value': {
                    'twitter': (typeof entity_data.company_social != 'undefined') ? entity_data.company_social.twitter : "",
                    'facebook': (typeof entity_data.company_social != 'undefined') ? entity_data.company_social.facebook : "",
                    'linkedIn': (typeof entity_data.company_social != 'undefined') ? entity_data.company_social.linkedIn : ""
                },
                'source': [{
                        'source_id': entity_data.source_id,
                        'value': {
                            'twitter': (typeof entity_data.company_social != 'undefined') ? entity_data.company_social.twitter : "",
                            'facebook': (typeof entity_data.company_social != 'undefined') ? entity_data.company_social.facebook : "",
                            'linkedIn': (typeof entity_data.company_social != 'undefined') ? entity_data.company_social.linkedIn : ""
                        },
                        'date_captured': new Date()
                    }]
            },
            'company_website': {
                'value': (_.isArray(entity_data.company_website)) ? entity_data.company_website[0] : (entity_data.company_website != null) ? entity_data.company_website.trim() : '',
                'source': [{
                        'source_id': entity_data.source_id,
                        'value': entity_data.company_website,
                        'date_captured': new Date()
                    }]
            },
            'company_founded_year': {
                'value': entity_data.company_founded_year,
                'source': [{
                        'source_id': entity_data.source_id,
                        'value': entity_data.company_founded_year,
                        'date_captured': new Date()
                    }]
            },
            'company_emp_size': {
                'value': entity_data.company_emp_size,
                'source': [{
                        'source_id': entity_data.source_id,
                        'value': entity_data.company_emp_size,
                        'date_captured': new Date()
                    }]
            },
            'company_about': {
                'value': entity_data.company_about,
                'source': [{
                        'source_id': entity_data.source_id,
                        'value': entity_data.company_about,
                        'date_captured': new Date()
                    }]
            },
            'company_location': {
                'value': entity_data.company_location,
                'source': [{
                        'source_id': entity_data.source_id,
                        'value': entity_data.company_location,
                        'date_captured': new Date()
                    }]
            },
            'company_profile_videos': {
                'value': entity_data.company_profile_videos,
                'source': [{
                        'source_id': entity_data.source_id,
                        'value': entity_data.company_profile_videos,
                        'date_captured': new Date()
                    }]
            },
            'company_logo': {
                'value': entity_data.company_logo_local,
                'source': [{
                        'source_id': entity_data.source_id,
                        'value': {'company_logo': entity_data.company_logo, 'company_logo_local': entity_data.company_logo_local},
                        'date_captured': new Date()
                    }]
            },
            company_people_source: [],
            company_funding: [],
            company_competitors: [],
            company_owner: [],
            company_bod: [],
            company_management: [],
            company_inventor: [],
        };

        dbconnect.mongoInsert('inx_cms_company', 'inx_cms', data, function (insertAck) {
            console.log(">> Entity added successfully:" + entity_data.company_name);
            addEntity_callback(insertAck.insertedId);
        });
    },
    updateEntity: function (where, entity_data, updateEntity_callback) {

        dbconnect.mongoUpdate('inx_cms_company', 'inx_cms', where, entity_data, function () {
            console.log(">> entity updated successfully");
            updateEntity_callback();
        });
    },
    dedupPeopleWithCMS: function (searchfor, dedupPeopleWithCMS_callback) {
        dbconnect.mongoFind('inx_cms_people', 'inx_cms', searchfor, function (peopleFound) {
            dedupPeopleWithCMS_callback(peopleFound);
        });
    },
    mergePeople: function (people_id, people_data, people_category, mainCompanyId, entity_data, peopleFound, mergePeople_callback) {

        console.log("============ Merge People =======================================");
        console.log(" people_category: " + people_category + "  People Id :" + people_id + " People Name :" + people_data.people_fname + " Entity Name :" + entity_data.company_name);

        var fieldToUpdate = ['people_fname', 'people_lname',
            'people_description', 'people_contact_address', 'people_social',
            'people_education', 'people_work_experience'];
        var updateDataFields = {};

        _.each(fieldToUpdate, function (field) {
            if (typeof peopleFound[field] != 'undefined' && entity_data[field] != null && entity_data[field] != '') {
                if (typeof peopleFound[field].value != 'undefined') {
                    if (peopleFound[field].value == '') {
                        updateDataFields[field + '.value'] = entity_data[field];
                    }
                } else {
                    updateDataFields[field + '.value'] = entity_data[field];
                }
            }
        });

        var source_id = entity_data.source_id;
        var where = {_id: people_id};
        var ifexist = {$pull: {
                'people_fname.source': {source_id: source_id},
                'people_lname.source': {source_id: source_id},
                'people_designation.source': {source_id: source_id},
                'people_contact_address.source': {source_id: source_id},
                'people_social.source': {source_id: source_id},
                'people_education.source': {source_id: source_id},
                'people_work_experience.source': {source_id: source_id},
                'people_profile_pic_url.source': {source_id: source_id},
                'people_headline.source': {source_id: source_id},
                'people_connection.source': {source_id: source_id}
            }};
        function _geArrItem(val) {
            return {
                "source_id": source_id,
                "value": val,
                "date_captured": new Date()
            };
        }

        /// Adding people type in work experience
        if (typeof people_data.people_experience != 'undefined') {
            for (var i = 0; i > people_data.people_experience.length; i++) {
                if (people_data.people_experience[i].company_name == entity_data.company_name) {
                    people_data.people_experience[i].people_type = [people_category];
                    people_data.people_experience[i].company_id = mainCompanyId;
                } else {
                    people_data.people_experience[i].people_type = [];
                }
            }
        } else {
            people_data.people_experience[0].people_type = [people_category];
        }

        var updatedt = {
            $addToSet: {
                'source_ref': {
                    'source_id': source_id,
                    'people_source_url': people_data.people_source_url,
                    'source_company_id': entity_data._id,
                    'batch_id': batchid,
                    'date': new Date()
                },
                "people_fname.source": _geArrItem(people_data.people_fname),
                "people_lname.source": _geArrItem(people_data.people_lname),
                "people_description.source": _geArrItem(people_data.people_description),
                "people_contact_address.source": _geArrItem(people_data.people_contact_address),
                "people_social.source": _geArrItem(people_data.people_social),
                "people_education.source": _geArrItem(people_data.people_education),
                "people_education.value": people_data.people_education,
                "people_work_experience.source": _geArrItem(people_data.people_experience),
                "people_work_experience.value": people_data.people_experience,
                'people_profile_pic_url.source': {
                    'source_id': source_id,
                    'value': {'people_profile_pic_url': people_data.people_profile_pic_url, 'people_profile_pic_url_local': people_data.people_profile_pic_url_local},
                    'date_captured': new Date()
                },
                "people_headline.source": _geArrItem(people_data.people_headline),
                "people_connection.source": _geArrItem(people_data.people_connection)
            }
        };
        if (!_.isEmpty(updateDataFields)) {
            console.log('=== updateDataFields people ==');
            console.log(updateDataFields);
            updatedt['$set'] = updateDataFields;
        }
        dbconnect.mongoUpdate('inx_cms_people', 'inx_cms', where, ifexist, function () {

            dbconnect.mongoUpdate('inx_cms_people', 'inx_cms', where, updatedt, function () {

                dedupe.updateEntity({_id: mainCompanyId},
                        {
                            $addToSet: {
                                company_people_source:
                                        {
                                            people_id: people_id,
                                            people_fname: people_data.people_fname,
                                            people_lname: people_data.people_lname,
                                            people_type: [people_category]
                                        }
                            }
                        },
                        function () {
                            mergePeople_callback();
                        });
            });

        });





    },
    addPeople: function (people_data, people_category, mainCompanyId, people_company, addPeople_callback) {
        console.log("============ Add People =======================================");
        console.log(" people_category: " + people_category + "  People Name :" + people_data.people_fname + " Entity Name :" + people_company.company_name);

        if ((people_data.people_fname != null && people_data.people_fname != '')
                ||
                (people_data.people_lname != null && people_data.people_lname != '')) {

            var source_id = people_company.source_id;
            /// Adding people type in work experience
            var currentCompanyFoundInExp = false;
            if (typeof people_data.people_experience != 'undefined') {
                for (i = 0; i < people_data.people_experience.length; i++) {
                    if (typeof people_data.people_experience[i].company_name != 'undefined') {
                        if (people_data.people_experience[i].company_name.trim() == people_company.company_name.trim()) {
                            people_data.people_experience[i].people_type = [people_category];
                            people_data.people_experience[i].company_id = mainCompanyId;
                            people_data.people_experience[i].is_current_exp = 'YES';
                            currentCompanyFoundInExp = true;
                        } else {
                            people_data.people_experience[i].people_type = [];
                        }
                    }
                }
            }
            if (!currentCompanyFoundInExp) {
                people_data.people_experience = [{company_name: people_company.company_name,
                        company_id: mainCompanyId, people_type: [people_category], is_current_exp: 'YES'}];
            }
            var data = {
                "source_ref": [{
                        'source_id': source_id,
                        'people_source_url': people_data.people_source_url,
                        'source_company_id': people_company._id,
                        'batch_id': batchid,
                        'date_captured': new Date()
                    }],
                "people_live_ref_id": '',
                "people_total_experience": "",
                "people_is_owner": "",
                "people_is_bod": "",
                "people_is_management": "",
                "people_is_inventor": "",
                "people_is_expert": "",
                "people_rating": "",
                "people_areas_expertise": "",
                "people_last_modified": new Date(),
                "people_profile_pic": "",
                "people_dt": [],
                "people_fname": {
                    "value": people_data.people_fname,
                    "source": [{
                            "source_id": source_id,
                            "value": people_data.people_fname,
                            "date_captured": new Date()
                        }]
                },
                "people_lname": {
                    "value": people_data.people_lname,
                    "source": [{
                            "source_id": source_id,
                            "value": people_data.people_lname,
                            "date_captured": new Date()
                        }]
                },
                "people_description": {
                    "value": people_data.people_description,
                    "source": [{
                            "source_id": source_id,
                            "value": people_data.people_description,
                            "date_captured": new Date()
                        }]
                },
                "people_contact_address": {
                    "value": people_data.people_contact_address,
                    "source": [{
                            "source_id": source_id,
                            "value": people_data.people_contact_address,
                            "date_captured": new Date()
                        }]
                },
                "people_social": {
                    "value": people_data.people_social,
                    "source": [{
                            "source_id": source_id,
                            "value": people_data.people_social,
                            "date_captured": new Date()
                        }]
                },
                "people_education": {
                    "value": people_data.people_education,
                    "source": [{
                            "source_id": source_id,
                            "value": people_data.people_education,
                            "date_captured": new Date()
                        }]
                },
                "people_work_experience": {
                    "value": people_data.people_experience,
                    "source": [{
                            "source_id": source_id,
                            "value": people_data.people_experience,
                            "date_captured": new Date()
                        }]
                },
                "people_profile_pic_url": {
                    "value": people_data.people_profile_pic_url_local,
                    "source": [{
                            "source_id": source_id,
                            "value": {'people_profile_pic_url': people_data.people_profile_pic_url, 'people_profile_pic_url_local': people_data.people_profile_pic_url_local},
                            "date_captured": new Date()
                        }]
                },
                "people_headline": {
                    "value": people_data.people_headline,
                    "source": [{
                            "source_id": source_id,
                            "value": people_data.people_headline,
                            "date_captured": new Date()
                        }]
                },
                "people_connection": {
                    "value": people_data.people_connection,
                    "source": [{
                            "source_id": source_id,
                            "value": people_data.people_connection,
                            "date_captured": new Date()
                        }]
                }


            };

            dbconnect.mongoInsert('inx_cms_people', 'inx_cms', data, function (insertAck) {
                console.log(" people_category: " + people_category + "  People Name :" + people_data.people_fname + " Entity Name :" + people_company.company_name);
                console.log(" Above People Added ID :" + insertAck.insertedId);
//           update company
                dedupe.updateEntity({_id: mainCompanyId},
                        {
                            $addToSet: {
                                company_people_source:
                                        {
                                            people_id: insertAck.insertedId,
                                            people_fname: people_data.people_fname,
                                            people_lname: people_data.people_lname,
                                            people_type: [people_category]
                                        }
                            }
                        },
                        function () {
                            addPeople_callback(insertAck.insertedId);
                        });
            });
        } else {
            console.log(" people first name last name is null, people_source_url:" + people_data.people_source_url)
            addPeople_callback(0);
        }
    },
    /**
     * 
     * @param function dedupePeople_callback
     * @param array 
     * @returns {undefined}
     */
    dedupePeople: function (source_company, mainCompanyId, dedupePeople_callback) {
        var peoplecat = [];
        var people_cat = [
            'company_owner',
            'company_bod',
            'company_investors',
            'company_incubators',
            'company_current_emp',
            'company_past_emp',
            'company_advisors',
            'company_attorneys',
            'company_service_providers'];

        for (var i = 0; i < people_cat.length; i++) {
            if (people_cat[i] in source_company) {
                peoplecat.push({category: people_cat[i], data: source_company});
            }
        }


        library.doSynchronousLoop(peoplecat,
                function (data, i, callback) {
                    var people_category = data.category;
                    var people_company = data.data;
                    // Done search loop & go for next entity            
                    library.doSynchronousLoop(
                            people_company[people_category],
                            function (people, i, callback) {
                                console.log("=========== dedupePeople ==========");

                                //      sanitize fields

                                if (people.people_contact_address != null && people.people_contact_address != '') {
                                    if (typeof people.people_contact_address.country_name == 'undefined') {
                                        var countrName = _.find(dedupe.counryMaster, function (countryItem) {
                                            var cn = dataIntelligency.extractCountryFromString(people.people_contact_address.people_address_line1, countryItem.country_name)
                                            if (cn != '' && cn != null) {
                                                return countryItem;
                                            }

                                        });
                                        if (!_.isEmpty(countrName)) {
                                            people.people_contact_address.country_name = countrName.country_name;
                                        }
                                    }
                                }
                                console.log(' == people.people_contact_address == ');
                                console.log(people.people_contact_address);

                                /**
                                 *  Data Intelligency
                                 * 
                                 */

//                              people expereince period split
                                if (typeof people.people_experience != 'undefined') {
                                    _.each(people.people_experience, function (experience) {
                                        if (typeof experience.people_exp_duration != 'undefined') {
                                            if (experience.people_exp_duration != '') {
                                                var expPeriod = dataIntelligency.peopleExperienceSplit(experience.people_exp_duration);
                                                experience.date_from = expPeriod.from_date;
                                                experience.date_to = expPeriod.to_date;
                                            }
                                        }
                                    });
                                }

                                var processWithPeople = false;
                                if (typeof people.data_type != 'undefined') {
                                    if (people.data_type == 'User') {
                                        processWithPeople = true;
                                    } else {
                                        processWithPeople = false;
                                    }
                                } else {
                                    processWithPeople = true;
                                }
                                /// people Duplicate check start
                                var searchforweb = {'source_ref.people_source_url': 'no_people_url'};
                                if (typeof people.people_source_url != 'undefined') {
                                    if (people.people_source_url != null && people.people_source_url != '') {
                                        searchforweb = {'source_ref.people_source_url': people.people_source_url, 'source_ref.batch_id': batchid};
                                    }
                                }
                                dedupe.dedupPeopleWithCMS(searchforweb, function (entity_data_filter) {
                                    if (entity_data_filter.length > 0) {

                                        /// Adding people type in work experience in people collection
                                        if (typeof people.people_experience != 'undefined') {
                                            for (i = 0; i < people.people_experience.length; i++) {
                                                if (people.people_experience[i].company_name == people_company.company_name) {
                                                    var where = {'_id': entity_data_filter[0]._id, 'people_work_experience.value.company_name': people_company.company_name};
                                                    var data = {
                                                        $addToSet: {
                                                            'people_work_experience.value.$.people_type': people_category
                                                        }
                                                    }
                                                    dbconnect.mongoUpdate('inx_cms_people', 'inx_cms', where, data, function () {
                                                        /// Do not add following updateEntity here
                                                    });
                                                }
                                            }
                                        }

                                        /// Adding people in company collection
                                        dedupe.updateEntity({_id: mainCompanyId},
                                                {
                                                    $addToSet: {
                                                        company_people_source:
                                                                {
                                                                    people_id: entity_data_filter[0]._id,
                                                                    people_fname: people.people_fname,
                                                                    people_lname: people.people_lname,
                                                                    people_type: [people_category]
                                                                }
                                                    }
                                                },
                                                function () {
                                                    callback();
                                                });
                                    } else {
                                        if (processWithPeople) {
                                            if (typeof people.people_social != 'undefined') {
                                                var people_social = [];
                                                if (typeof people.people_social.linkedIn != 'undefined' && people.people_social.linkedIn != null) {
                                                    if (people.people_social.linkedIn.trim() != '') {
                                                        people_social.push({'people_social.value.linkedIn': people.people_social.linkedIn});
                                                        people_social.push({'people_social.source.$.value.linkedIn': people.people_social.linkedIn});
                                                    }
                                                }
                                                if (typeof people.people_social.facebook != 'undefined' && people.people_social.facebook != null) {
                                                    if (people.people_social.facebook.trim() != '') {
                                                        people_social.push({'people_social.value.facebook': people.people_social.facebook});
                                                        people_social.push({'people_social.source.$.value.facebook': people.people_social.facebook});
                                                    }
                                                }
                                                if (typeof people.people_social.twitter != 'undefined' && people.people_social.twitter != null) {
                                                    if (people.people_social.twitter.trim() != '') {
                                                        people_social.push({'people_social.value.twitter': people.people_social.twitter});
                                                        people_social.push({'people_social.source.$.value.twitter': people.people_social.twitter});
                                                    }
                                                }
                                                if (people_social.length > 0) {
                                                    var where = {$or: people_social};
                                                    dedupe.dedupPeopleWithCMS(where, function (peopleFound) {
                                                        if (peopleFound.length > 0) {
                                                            merge_people++;
                                                            // People is duplicate,  Merge 
                                                            dedupe.mergePeople(peopleFound[0]._id, people, people_category, mainCompanyId, people_company, peopleFound[0], function () {

//                                                    update people into company collection
                                                                callback();
                                                            });
                                                        } else {
                                                            add_people++;
                                                            // People is new, Add
                                                            dedupe.addPeople(people, people_category, mainCompanyId, people_company, function (insertedId) {
//                                                    add people into company collection
                                                                callback();
                                                            });
                                                        }
                                                    });
                                                } else {
                                                    add_people++;
                                                    // People is new, Add
                                                    dedupe.addPeople(people, people_category, mainCompanyId, people_company, function (insertedId) {
//                                                    add people into company collection
                                                        callback();
                                                    });
                                                }

                                            } else {
                                                add_people++;
                                                // People is new, Add
                                                dedupe.addPeople(people, people_category, mainCompanyId, people_company, function (insertedId) {
//                                                    add people into company collection
                                                    callback();
                                                });
                                            }
                                        } else {
                                            callback();
                                        }

                                    }
                                });

                            },
                            function () {
                                console.log('> People dedupe completed : ' + people_category);
                                callback();
                            });
                },
                function () {
                    dedupePeople_callback();
                });
    },
    checkDtExits: function (dtid, checkDtExits_callback) {
        dbconnect.mongoFind('inx_cms_company', 'inx_cms', dtid, function (result) {
            if (result.length > 0) {
                checkDtExits_callback(true);
            } else {
                checkDtExits_callback(false);
            }
        });
    },
    addProduct: function (entity_data, entity_id, addProduct_callback) {
        console.log("============ addProduct  =======================================");
        console.log(" Entity URL :" + entity_data.company_source_url + " Entity Name :" + entity_data.company_name);
        if (typeof entity_data.company_product != 'undefined') {
            if (entity_data.company_product.length > 0) {
                library.doSynchronousLoop(entity_data.company_product,
                        function (product, i, callback) {
                            var pdata = {};
                            for (item in product) {
                                pdata[item] = {
                                    value: product[item],
                                    source: [{source_id: entity_data.source_id, value: product[item], date_captured: new Date()}]
                                };
                            }
                            pdata.source_ref = [{
                                    'source_id': entity_data.source_id,
                                    'source_company_id': entity_data._id,
                                    'batch_id': batchid,
                                    'date_captured': new Date()
                                }];
                            dbconnect.mongoInsert('inx_cms_product', 'inx_cms', pdata, function (insertAck) {
                                console.log("> Product added successfully  product_id : " + insertAck.insertedId);
                                add_product++;
                                dedupe.updateEntity({_id: entity_id},
                                        {
                                            $addToSet: {
                                                company_product_source:
                                                        {
                                                            product_id: insertAck.insertedId,
                                                            product_name: product.product_name

                                                        }
                                            }
                                        },
                                        function () {
                                            callback();
                                        });
                            });
                        },
                        function () {
                            // Done source loop & finish
                            addProduct_callback();

                        });
            } else {
                addProduct_callback();
            }
        } else {
            addProduct_callback();
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
};
dedupe.preInit();