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
var assets_location = require('path').join(__dirname, "/../../../public/assets-cms/");
var inx_folder_location = require('path').join(__dirname, "/../../../../" + config.inx.base_folder + "/public/");
//CMS DB Connection
var dbmodel = require(__dirname + '/../dbmodel');
//LIVE INX DB Connection
var dbmodelInx = require(__dirname + '/../dbmodelInx');

eval(fs.readFileSync(__dirname + '/../functions.js') + '');

/**
 * Input param
 */
//5b66ae8d65e54d12c811b160
var company_search_id = ObjectID(process.argv[2]);
var for_project = process.argv[3];
for_project = (typeof for_project == 'undefined') ? '' : for_project;
companySearch = {
    company_search_id: company_search_id,
    /**
     * Method to load config masters if any
     * Which need in migration
     * @param {type} preInit_cb
     * @returns {undefined}
     */
    preInit: function (preInit_cb) {
//        update search status to INPROGRESS
        console.log('=== in preInit  ===');
        dbmodelInx.mongoFind('inx_company_search', {_id: company_search_id}, function (result) {
            if (!_.isEmpty(result)) {
                companySearch.companySearchRecord = result[0];
                companySearch.init(function () {
                    console.log('== in init callback  ==');
                    preInit_cb();
                });
            } else {
                console.log('== No Search found  ==');
                preInit_cb();
            }
        });


    },
    init: function (init_cb) {
        console.log('  search record  ');
        console.log(companySearch.companySearchRecord);
        console.log(' ! search record  ');

        console.log('=== in init  ===');
        console.log('=== Search Starts  ===');


        /**
         *  1. INX With current DT
         */
        companySearch.searchInINX(
                {withdt: 1},
                function (companies) {
                    companySearch.companyDeDuplication(companies, function () {

                        var searchCalls = [];

                        /**
                         *  1. INX Without current DT
                         */
                        searchCalls.push(function (parallelCalls_cb) {
                            companySearch.searchInINX(
                                    {withdt: 0},
                                    function (companies) {
                                        companySearch.companyDeDuplication(companies, function () {
                                            parallelCalls_cb();
                                        });
                                    });
                        });
                        /**
                         * 2. CMS
                         */
                        searchCalls.push(function (parallelCalls_cb) {
                            companySearch.searchInCMS(
                                    {},
                                    function (companies) {
                                        companySearch.companyDeDuplication(companies, function () {
                                            parallelCalls_cb();
                                        });
                                    });
                        });
                        /* for start up do not add linkedin call */
                        if (typeof companySearch.companySearchRecord.search_params.company_is_startup == 'undefined' || companySearch.companySearchRecord.search_params.company_is_startup == '') {
                            /**
                             * 3. MDB
                             */
                            searchCalls.push(function (parallelCalls_cb) {
                                companySearch.searchInMDB(
                                        {},
                                        function (companies) {
                                            companySearch.companyDeDuplication(companies, function () {
                                                parallelCalls_cb();
                                            });
                                        });
                            });

                            /**
                             * 4. Linkedin
                             */
                            searchCalls.push(function (parallelCalls_cb) {
                                companySearch.searchInLinkedin(
                                        {},
                                        function (companies) {
                                            companySearch.companyDeDuplication(companies, function () {
                                                parallelCalls_cb();
                                            });
                                        });
                            });
                        }
                        async.parallel(searchCalls, function (err, results) {
                            if (err) {
                                console.log(err);
                                process.exit();
                            }
                            dbmodelInx.mongoUpdate("inx_company_search",
                                    {_id: company_search_id},
                                    {$set: {status: 'COMPLETED'}},
                                    function () {
                                        console.log('=== Search Complete  ===');
                                        init_cb();
                                    });
                        });
                    });
                });






    },
    saveSearchLog: function (inputParam, saveSearchLog_cb) {
        console.log('=== in saveSearchLog  ===');

        if (inputParam.log_id == '') {
            dbmodel.mongoInsert("inx_cms_log_api_company_search", inputParam.data, function (insertAck) {
                saveSearchLog_cb(insertAck.insertedId);
            });
        } else {
            dbmodel.mongoUpdate("inx_cms_log_api_company_search",
                    {_id: inputParam.log_id},
                    {$set: inputParam.data},
                    function (insertAck) {
                        saveSearchLog_cb(inputParam.log_id);
                    });
        }
    },
    searchInINX: function (inputParam, searchInINX_cb) {
        console.log('=== in searchInINX  ===');
        var searchParam = companySearch.companySearchRecord['search_params'];
        var startTime = new Date();
        var logData = {log_id: '', data:
                    {
                        company_search_id: company_search_id,
                        inx_user_id: companySearch.companySearchRecord['inx_user_id'],
                        search_param: searchParam,
                        start_datetime: startTime,
                        end_datetime: '',
                        time_diff: '',
                        source: (inputParam.withdt == 1)?'INX':'INX_WITHOUT_DT'
                    }
        };
        companySearch.saveSearchLog(
                logData,
                function (logId) {

                    var where = {'company_dt.dt_id': {$exists: true}};
					
                    if (inputParam.withdt == 1) {
						if (for_project != 'industry_prespective') {
							where['company_dt.dt_id'] = {$in: companySearch.companySearchRecord.search_params.dt_id};
						}
                    } else {
						if (for_project != 'industry_prespective') {
							where['company_dt.dt_id'] = {$nin: companySearch.companySearchRecord.search_params.dt_id};
						}
                    }
                    if (searchParam['search_name'] != '') {
                        where['$or'] = [
                            {company_name: new RegExp('\\b' + escapeRegExp(searchParam['search_name']) + '\\b', 'i')},
                            {company_whats_unique: new RegExp('\\b' + escapeRegExp(searchParam['search_name']) + '\\b', 'i')},
                            {company_about: new RegExp('\\b' + escapeRegExp(searchParam['search_name']) + '\\b', 'i')},
                        ];

                    }
                    dbmodelInx.mongoFind('inx_company', where, function (result) {

                        console.log('=== INX Resp ==');
                        console.log(result);
                        var companies = [];
                        _.each(result, function (company) {
                            var company_website = (typeof company.company_website !== 'undefined') ? company.company_website : '';
                            if (_.isArray(company_website)) {
                                company_website = company_website[0];
                            }
                            var headquarters = _.filter(company.company_location, function (location) {
                                return (location.type === 'Headquarter');
                            });
                            headquarters = headquarters[0];


                            console.log('company :' + company['company_name']);
                            if (for_project == 'industry_prespective') {
                                var appnode = [];
                                var appnodes = _.filter(company.company_dt, function (dt) {
                                    return dt['dt_name'] == 'Applications'
                                });
                                appnode = _.map(appnodes, function (dt) {
                                    return dt['dt_id'].toString();
                                });

                                var root_dts = [];
                                if (!_.isEmpty(company.company_dt)) {
                                    var rootdts = _.filter(company.company_dt, function (dt) {
                                        if (typeof dt.dt_sub_root !== 'undefined') {
                                            return appnode.indexOf(dt.dt_sub_root.toString()) == 0;
                                        }
                                    });
                                    _.each(rootdts, function (rootdt) {
                                        root_dts.push(rootdt);
                                    });
                                }
                            } else {
                                var root_dts = [];
                                if (!_.isEmpty(company.company_dt)) {
                                    var rootdts = _.filter(company.company_dt, function (dt) {
                                        return (dt.dt_parent_id == 0)
                                    });
                                    _.each(rootdts, function (rootdt) {
                                        root_dts.push(rootdt);
                                    });
                                }
                                console.log('root_dts');
                                console.log(root_dts);
                            }


                            companies.push({
                                'company_logo': (typeof company['company_logo'] !== 'undefined') ? company['company_logo'] : '',
                                'company_patent_count': (typeof company['company_patent_count'] !== 'undefined') ? company['company_patent_count'] : '',
                                'company_value_chain_player_type': (typeof company['company_value_chain_player_type'] !== 'undefined') ? company['company_value_chain_player_type'] : '',
                                'company_industry': (typeof company['company_industry'] !== 'undefined') ? company['company_industry'] : '',
                                'company_is_startup': (typeof company['company_is_startup'] !== 'undefined') ? company['company_is_startup'] : '',
                                'company_whats_unique': (typeof company['company_whats_unique'] !== 'undefined') ? company['company_whats_unique'] : '',
                                'company_about': (typeof company['company_about'] !== 'undefined') ? company['company_about'] : '',
                                'company_name': (typeof company['company_name'] !== 'undefined') ? company['company_name'] : '',
                                'company_website': company_website,
                                'country_name': (typeof headquarters !== 'undefined') ? headquarters['country_name'] : '',
                                'company_inx_mongo_id': (typeof company['_id'] !== 'undefined') ? company['_id'] : '',
                                'root_dts': root_dts,
                                'company_dt': company.company_dt,
                                'company_followers': (typeof company.company_followers !== 'undefined') ? company.company_followers : ''
                            });
                        });
                        var endTime = new Date();
                        var time_diff = (endTime.getTime() - startTime.getTime()) / 1000;
                        var logData = {log_id: logId, data: {time_diff: time_diff, end_datetime: endTime,
                                companies_found: result}};
//                        update log 
                        companySearch.saveSearchLog(
                                logData,
                                function () {
                                    searchInINX_cb(companies);
                                });


                    });
                });


    },
    searchInPerspective: function (inputParam, searchInPerspective_cb) {
        console.log('=== in searchInPerspective  ===');
        var searchParam = companySearch.companySearchRecord['search_params'];
        var startTime = new Date();
        var logData = {log_id: '', data:
                    {
                        company_search_id: company_search_id,
                        inx_user_id: companySearch.companySearchRecord['inx_user_id'],
                        search_param: searchParam,
                        start_datetime: startTime,
                        end_datetime: '',
                        time_diff: '',
                        source: 'INX'
                    }
        };
        companySearch.saveSearchLog(
                logData,
                function (logId) {

                    var where = {'company_dt.dt_id': {$exists: true}};
                    if (searchParam['search_name'] != '') {
                        where.company_name = new RegExp('\\b' + escapeRegExp(searchParam['search_name']) + '\\b', 'i');
                    }
                    dbmodelInx.mongoFind('inx_company', where, function (result) {

                        console.log('=== INX Resp ==');
                        console.log(result);
                        var companies = [];
                        _.each(result, function (company) {
                            var company_website = (typeof company.company_website !== 'undefined') ? company.company_website : '';
                            if (_.isArray(company_website)) {
                                company_website = company_website[0];
                            }
                            var headquarters = _.filter(company.company_location, function (location) {
                                return (location.type === 'Headquarter');
                            });
                            headquarters = headquarters[0];

                            var appnode = [];
                            var appnodes = _.filter(company.company_dt, function (dt) {
                                return dt['dt_name'] == 'Applications'
                            });
                            appnode = _.map(appnodes, function (dt) {
                                return dt['dt_id'].toString();
                            });

                            var root_dts = [];
                            if (!_.isEmpty(company.company_dt)) {
                                root_dts = _.filter(company.company_dt, function (dt) {
                                    return appnode.indexOf(dt.dt_sub_root.toString()) == 0;
                                });
                            }

                            companies.push({
                                'company_logo': (typeof company['company_logo'] !== 'undefined') ? company['company_logo'] : '',
                                'company_patent_count': (typeof company['company_patent_count'] !== 'undefined') ? company['company_patent_count'] : '',
                                'company_value_chain_player_type': (typeof company['company_value_chain_player_type'] !== 'undefined') ? company['company_value_chain_player_type'] : '',
                                'company_industry': (typeof company['company_industry'] !== 'undefined') ? company['company_industry'] : '',
                                'company_is_startup': (typeof company['company_is_startup'] !== 'undefined') ? company['company_is_startup'] : '',
                                'company_whats_unique': (typeof company['company_whats_unique'] !== 'undefined') ? company['company_whats_unique'] : '',
                                'company_about': (typeof company['company_about'] !== 'undefined') ? company['company_about'] : '',
                                'company_name': (typeof company['company_name'] !== 'undefined') ? company['company_name'] : '',
                                'company_website': company_website,
                                'country_name': (typeof headquarters !== 'undefined') ? headquarters['country_name'] : '',
                                'company_inx_mongo_id': (typeof company['_id'] !== 'undefined') ? company['_id'] : '',
                                'root_dts': root_dts,
                                'company_followers': (typeof company.company_followers !== 'undefined') ? company.company_followers : ''
                            });
                        });
                        var endTime = new Date();
                        var time_diff = (endTime.getTime() - startTime.getTime()) / 1000;
                        var logData = {log_id: logId, data: {time_diff: time_diff, end_datetime: endTime,
                                companies_found: result}};
//                        update log 
                        companySearch.saveSearchLog(
                                logData,
                                function () {
                                    searchInPerspective_cb(companies);
                                });


                    });
                });


    },
    searchInCMS: function (inputParam, searchInCMS_cb) {
        console.log('=== in searchInCMS  ===');
        var searchParam = companySearch.companySearchRecord['search_params'];
        var startTime = new Date();
        var logData = {log_id: '', data:
                    {
                        company_search_id: company_search_id,
                        inx_user_id: companySearch.companySearchRecord['inx_user_id'],
                        search_param: searchParam,
                        start_datetime: startTime,
                        end_datetime: '',
                        time_diff: '',
                        source: 'CMS'
                    }
        };
        companySearch.saveSearchLog(
                logData,
                function (logId) {

                    var where = {'company_live_ref_id': {$exists: false}};
                    if (searchParam['search_name'] != '') {
                        where['$or'] = [
                            {'company_name.value': new RegExp('\\b' + escapeRegExp(searchParam['search_name']) + '\\b', 'i')},
                            {'company_whats_unique.value': new RegExp('\\b' + escapeRegExp(searchParam['search_name']) + '\\b', 'i')},
                            {'company_about.value': new RegExp('\\b' + escapeRegExp(searchParam['search_name']) + '\\b', 'i')},
                        ];
                    }
                    dbmodel.mongoFind('inx_cms_company', where, function (result) {

                        console.log('=== CMS Resp ==');
                        console.log(result);
                        var companies = [];
                        _.each(result, function (company) {
                            var company_website = company.company_website.value;
                            if (_.isArray(company_website)) {
                                company_website = company_website[0];
                            }
                            var headquarters = _.filter(company.company_location.value, function (location) {
                                return (location.type === 'Headquarter');
                            });
                            headquarters = headquarters[0];

                            if (for_project == 'industry_prespective') {
                                var appnode = [];
                                var appnodes = _.filter(company.company_dt, function (dt) {
                                    return dt['dt_name'] == 'Applications'
                                });
                                appnode = _.map(appnodes, function (dt) {
                                    return dt['dt_id'].toString();
                                });

                                var root_dts = [];
                                if (!_.isEmpty(company.company_dt)) {
                                    var rootdts = _.filter(company.company_dt, function (dt) {
                                        if (typeof dt.dt_sub_root !== 'undefined') {
                                            return appnode.indexOf(dt.dt_sub_root.toString()) == 0;
                                        }
                                    });
                                    _.each(rootdts, function (rootdt) {
                                        root_dts.push(rootdt);
                                    });
                                }
                            } else {
                                var root_dts = [];
                                if (!_.isEmpty(company.company_dt)) {
                                    var rootdts = _.filter(company.company_dt, function (dt) {
                                        return (dt.dt_parent_id == 0)
                                    });
                                    _.each(rootdts, function (rootdt) {
                                        root_dts.push(rootdt);
                                    });
                                }
                            }

                            companies.push({
                                'company_about': company['company_about']['value'],
                                'company_name': company['company_name']['value'],
                                'company_value_chain_player_type': company['company_value_chain_player_type'],
                                'company_industry': company['company_industry'],
                                'company_is_startup': company['company_is_startup']['value'],
                                'company_whats_unique': company['company_whats_unique']['value'],
                                'company_website': company_website,
                                'country_name': (typeof headquarters != 'undefined') ? headquarters['country_name'] : '',
                                'company_hq_location': (typeof headquarters != 'undefined') ? headquarters : '',
                                'company_cms_mongo_id': company['_id'],
                                'root_dts': root_dts,
                                'company_search_from_inx': (typeof company['company_search_from_inx'] !== 'undefined') ? company['company_search_from_inx'] : []
                            });
                        });
                        var endTime = new Date();
                        var time_diff = (endTime.getTime() - startTime.getTime()) / 1000;
                        var logData = {log_id: logId, data: {time_diff: time_diff, end_datetime: endTime,
                                companies_found: result}};
//                        update log 
                        companySearch.saveSearchLog(
                                logData,
                                function () {
                                    searchInCMS_cb(companies);
                                });


                    });
                });


    },
    searchInMDB: function (inputParam, searchInMDB_cb) {
        console.log('=== in searchInMDB  ===');
        var searchParam = companySearch.companySearchRecord['search_params'];
        var startTime = new Date();
        var logData = {log_id: '', data:
                    {
                        company_search_id: company_search_id,
                        inx_user_id: companySearch.companySearchRecord['inx_user_id'],
                        search_param: searchParam,
                        start_datetime: startTime,
                        end_datetime: '',
                        time_diff: '',
                        source: 'MDB'
                    }
        };
        companySearch.saveSearchLog(
                logData,
                function (logId) {

                    var apiUrl = config.inx_cms.mdbApi.url + 'SearchCompany/' + searchParam['search_name'] + '/',
                            username = config.inx_cms.mdbApi.username,
                            password = config.inx_cms.mdbApi.password,
                            auth = "Basic " + new Buffer(username + ":" + password).toString("base64");

                    console.log(' = apiUrl :' + apiUrl + '  username:' + username + ' password:' + password)
                    request(
                            {
                                url: apiUrl,
                                headers: {
                                    "Authorization": auth
                                },
                                timeout: 35000
                            },
                            function (error, response, body) {
                                if (error) {
                                    console.log('=============== MDB API Erro =================');
                                    console.log('== apiUrl ==' + apiUrl);
                                    console.log(error);
                                }
                                console.log('== body of apiUrl ==' + apiUrl);
                                console.log(body);
                                var result = [];

                                if (typeof body !== 'undefined') {
                                    if (body.trim() !== '') {
                                        result = JSON.parse(body);
                                    }

                                }
                                console.log('=== MDB Resp ==');
                                console.log(result);
                                var companies = [];
                                _.each(result, function (company) {
                                    if (typeof company['company_name'] !== 'undefined') {
                                        if (typeof company['company_name'] !== '') {
                                            companies.push({
                                                'company_mbd_mogno_id': (typeof company['_id'] !== 'undefined') ? company['_id'] : '',
                                                'company_about': (typeof company['company_summary'] !== 'undefined') ? company['company_summary'] : '',
                                                'company_name': (typeof company['company_name'] !== 'undefined') ? company['company_name'] : '',
                                                'company_website': (typeof company['company_website'] !== 'undefined') ? company['company_website'] : '',
                                                'country_name': (typeof company['country_name'] !== '') ? company['country_name'] : '',
                                                'company_size': (typeof company['company_emp_size'] !== '') ? company['company_emp_size'] : '',
                                                'company_founded_year': (typeof company['company_year_founded'] !== '') ? company['company_year_founded'] : ''
                                            });
                                        }
                                    }
                                });

                                var endTime = new Date();
                                var time_diff = (endTime.getTime() - startTime.getTime()) / 1000;
                                var logData = {log_id: logId, data: {time_diff: time_diff, end_datetime: endTime,
                                        companies_found: result}};
//                        update log 
                                companySearch.saveSearchLog(
                                        logData,
                                        function () {
                                            searchInMDB_cb(companies);
                                        });

                            }
                    );



                });

    },
    searchInLinkedin: function (inputParam, searchInLinkedin_cb) {
        console.log('=== in searchInLinkedin  ===');
        var searchParam = companySearch.companySearchRecord['search_params'];
        var startTime = new Date();
        var logData = {log_id: '', data:
                    {
                        company_search_id: company_search_id,
                        inx_user_id: companySearch.companySearchRecord['inx_user_id'],
                        search_param: searchParam,
                        start_datetime: startTime,
                        end_datetime: '',
                        time_diff: '',
                        source: 'MDB-LinkedIn'
                    }
        };
        companySearch.saveSearchLog(
                logData,
                function (logId) {

                    var apiUrl = config.inx_cms.mdbApi.url + 'RealTimeCompanySearch/' + searchParam['search_name'] + '/',
                            username = config.inx_cms.mdbApi.username,
                            password = config.inx_cms.mdbApi.password,
                            auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
                    request(
                            {
                                url: apiUrl,
                                headers: {
                                    "Authorization": auth
                                },
                                timeout: 30000
                            },
                            function (error, response, body) {
                                if (error) {
                                    console.log('=============== MDB API Erro =================');
                                    console.log('== apiUrl ==' + apiUrl);
                                    console.log(error);
                                }
                                console.log('== body of apiUrl ==' + apiUrl);
                                console.log(body);
                                var result = [];

                                if (typeof body !== 'undefined') {
                                    if (body.trim() !== '') {
                                        result = JSON.parse(body);
                                    }

                                }
                                if (!_.isArray(result)) {
                                    result = [result];
                                }
                                console.log('=== MDB Linkedin ==');
                                console.log(result);

                                var companies = [];
                                _.each(result, function (company) {
                                    if (typeof company['company_name'] !== 'undefined') {
                                        if (typeof company['company_name'] !== '') {
                                            companies.push({
                                                'company_name': (typeof company['company_name'] !== 'undefined') ? company['company_name'] : '',
                                                'company_about': (typeof company['company_summary'] !== 'undefined') ? company['company_summary'] : '',
                                                'company_website': (typeof company['company_website'] !== 'undefined') ? company['company_website'] : '',
                                                'country_name': (typeof company['company_country'] !== '') ? company['company_country'] : '',
                                                'company_mbd_linkedin_url': (typeof company['company_url'] !== 'undefined') ? company['company_url'] : '',
                                                'company_size': (typeof company['company_size'] !== '') ? company['company_size'] : '',
                                                'company_founded_year': (typeof company['company_founded'] !== '') ? company['company_founded'] : ''

                                            });
                                        }
                                    }
                                });

                                var endTime = new Date();
                                var time_diff = (endTime.getTime() - startTime.getTime()) / 1000;
                                var logData = {log_id: logId, data: {time_diff: time_diff, end_datetime: endTime,
                                        companies_found: result}};
//                        update log 
                                companySearch.saveSearchLog(
                                        logData,
                                        function () {
                                            searchInLinkedin_cb(companies);
                                        });

                            }
                    );
                });
    },
    companyDeDuplication: function (companies, companyDeDuplication_cb) {
        console.log('=== in companyDeDuplication  ===');
        console.log(companies);

        if (!_.isEmpty(companies)) {
            dbmodelInx.mongoFind('inx_company_search_result', {company_search_id: company_search_id}, function (result) {
                var existingCompanies = result;
                console.log('=  == existingCompanies == ');
                console.log(existingCompanies);
                var newCompanies = [];
                _.each(companies, function (compNew) {
                    var compNewWebsiteDomain = domainRefine(compNew.company_website);

                    var alreadyExists = _.find(existingCompanies, function (compExists) {

//                  
//                  2. Website(Domain) Valdiation

//                    1. name validation
                        var companyNameMatch = false;
                        if (compExists.company_name !== "" && compNew.company_name !== "") {
                            var regExpToMatch = new RegExp("^" + escapeRegExp(compNew.company_name) + "$", "gi");
                            if (compExists.company_name.match(regExpToMatch)) {
                                companyNameMatch = true;
                            }

                        }

                        var companyWebsiteMatch = false;
                        if (!companyNameMatch) {
                            if (compExists.company_website !== "" && compNew.company_website !== "") {

                                var compExistsWebsiteDomain = domainRefine(compExists.company_website);

                                if (compExistsWebsiteDomain != "" && compNewWebsiteDomain != "") {
                                    var regExpToMatch = new RegExp("^" + escapeRegExp(compNewWebsiteDomain) + "$", "gi");
                                    if (compExistsWebsiteDomain.match(regExpToMatch)) {
                                        companyWebsiteMatch = true;
                                    }
                                }
                            }
                        }
                        console.log('=== companyNameMatch :' + companyNameMatch + ' == companyWebsiteMatch:' + companyWebsiteMatch + '===');


                        if (companyNameMatch || companyWebsiteMatch) {
                            return compExists;
                        }
                    });
                    if (!_.isEmpty(alreadyExists)) {
                        console.log('== is duplicate ==');
                        compNew.duplicate_of = alreadyExists;
                    }
                    compNew.company_website_domain = (typeof compNewWebsiteDomain !== 'undefined') ? compNewWebsiteDomain : '';
                    compNew.company_search_id = company_search_id;
                    newCompanies.push(compNew);
                });
                console.log('newCompanies');
                console.log(newCompanies);
                if (!_.isEmpty(newCompanies)) {
                    dbmodelInx.mongoInsertMany("inx_company_search_result",
                            newCompanies,
                            function () {
                                companyDeDuplication_cb();
                            });
                } else {
                    companyDeDuplication_cb();
                }

            });
        } else {
            companyDeDuplication_cb();
        }

    }



}

companySearch.preInit(function () {

});
