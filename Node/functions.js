var after = function _after(count, f) {
    var c = 0, results = [];
    return function _callback() {
        switch (arguments.length) {
            case 0:
                results.push(null);
                break;
            case 1:
                results.push(arguments[0]);
                break;
            default:
                results.push(Array.prototype.slice.call(arguments));
                break;
        }
        if (++c === count) {
            f.apply(this, results);
        }
    };
};


var plogger = function (err) {
    if (err) {
        console.log(err);
        logger.info(String(err));
        var mail_content = '\nSearch_id : ' + search_id;
        mail_content += '\nSearch_string_id : ' + search_string_id;
        mail_content += '\nError content : ' + err;
    }
};

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename: path,
            handleExceptions: true,
            humanReadableUnhandledException: true,
            timestamp: function () {
                var currentdate = new Date();
                var datetime = currentdate.getDate() + "-"
                        + (currentdate.getMonth() + 1) + "-"
                        + currentdate.getFullYear() + " "
                        + currentdate.getHours() + ":"
                        + currentdate.getMinutes() + ":"
                        + currentdate.getSeconds() + "."
                        + currentdate.getMilliseconds();
                return datetime;
            }
        })
    ],
    exitOnError: false
});

// queryStringToJSON function
var SaveHtmlFile = function (body, type, filename) {
    if (type == 'contact')
    {
        var file_path = html_path + "contact/" + filename + ".html";
    } else
    {
        var file_path = html_path + "company/" + filename + ".html";
    }

    fs.writeFile(file_path, body, {flag: "w"}, function (err) {
        if (err) {
            SaveHtmlFile(body, type, filename);
        }

    });

};
var doSynchronousLoop = function (data, processData, done) {
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
};

var domainRefine = function (website) {
    if (website != '' && typeof website != 'undefined') {
        website = website.replace(/^((http|https){0,1}(\:)(\/){1,})*((www)[0-9]*(\.)){0,1}/im, "");
        website = website.replace(/(jobs|career|careers)\./i, "");
        website = website.replace(/[\.](jhtml|html|php|aspx|jsp|htm)$/i, "");
        website = website.replace(/(\/|\?)(.)*/i, "");
        website = website.trim();
        return website;
    }
}
var cleanString = function (inputStr) {
    return inputStr.replace(/\s\s+/g, ' ').trim();
};
var removeComma = function (inputStr) {
    return inputStr.replace(/,\s*$/, '').trim();
};
var isDirecotryExists = function (path, isDirecotryExists_cb) {
    fs.stat(path, function (err, stats) {
//        console.log('stats');
//        console.log(stats);
//        console.log('err');
//        console.log(err);
//            process.exit();
        //Check if error defined and the error code is "not exists"
        if (err && err.code === 'ENOENT') {
            //Create the directory, call the callback.
            fs.mkdir(path, isDirecotryExists_cb);
        } else {
            //just in case there was a different error:
            isDirecotryExists_cb();
        }
    });
};
var cleanLegalStatusFromName = function (name) {
    var legalStatus = ['Pty Ltd', 'Sp Zoo', 'Pty Limited', 'Bv', 'Corp', 'Gmbh', 'Inc', 'Llc', 'Llp', 'Ltd', 'Plc', 'Sa', 'Sarl', 'Ag', 'Spa', 'Srl', 'Pvt', 'Limited', 'Corporation', 'Pte', 'Private', 'Co', 'Ab', 'As'];
    for (var i = 0; i < legalStatus.length; i++) {
        var pattern = new RegExp("[.]*\\b" + legalStatus[i] + "\\b$", "gi");
        if (name.match(pattern)) {
            name = name.replace(pattern, '').trim();
            return cleanLegalStatusFromName(name);
        }
    }
    return name;
};
var escapeRegExp = function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
/**
 * 
 * Deemap for trim
 * @param {type} data
 * @param {type} map
 * @param {type} key
 */
var deepMapTrim = function deepMapTrim(data, map, key) {
    if (_.isArray(data)) {
        for (var i = 0; i < data.length; ++i) {
            data[i] = deepMapTrim(data[i], map, void 0);
        }
    } else if (_.isObject(data)) {
        for (datum in data) {
            if (data.hasOwnProperty(datum)) {
                data[datum] = deepMapTrim(data[datum], map, datum);
            }
        }
    } else {
        data = map(data, ((key) ? key : void 0));
        if (typeof data == 'string') {
            data = data.trim();
        }
    }
    return data;
}
var dataIntelligency = {
    peopleExperienceSplit: function (str) {
        //          
        //          Apr '17 - Present (11 months) 
        //Sep '92 - Apr '01 (8 years 7 months) 
        //Mar '13 
        //Oct '13 - Apr '16 (2 years 6 months) 
        ////Gust
        //2012 - Present
        //2005 - 2012
        ////angel
        //2017 - Present (about 1 year) 
        //2016 - 2017 (6 months) 
        //2014 - Present (over 3 years)
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var from_month_number;
        var from_date_year;
        var to_month_number;
        var to_date_year;
        str = str.replace(/\s*\(.*?\)\s*/g, '').trim();
        str = str.split("-");
        if (str.length == 2) {
            //from section
            var from_date = str[0].split("'");
            if (from_date.length == 2) {
                //  from month
                var from_month = from_date[0].trim();
                from_month_number = months.indexOf(from_month) + 1;
                //  from year
                //console.log(from_date[1]);
                if (from_date[1].trim().length == 2) {
                    if (Number(from_date[1].trim()) > 70) {
                        from_date_year = 1900 + Number(from_date[1].trim());
                    } else {
                        from_date_year = 2000 + Number(from_date[1].trim());
                    }
                } else {
                    from_date_year = from_date[1].trim();
                }

            } else {
                //  from year

                from_date_year = from_date[0].trim();
            }
            // to section
            var to_date = str[1].split("'");
            if (to_date.length == 2) {
                //  to month
                var to_month = to_date[0].trim();
                to_month_number = months.indexOf(to_month) + 1;
                if (to_date[1].trim().length == 2) {
                    if (Number(to_date[1].trim()) > 70) {
                        to_date_year = 1900 + Number(to_date[1].trim());
                    } else {
                        to_date_year = 2000 + Number(to_date[1].trim());
                    }
                } else {
                    to_date_year = to_date[0].trim();
                }
            } else {
                //  to year

                if (to_date[0] == 'Present') {
                    to_date_year = 'Present';
                } else if (to_date[0].trim().length == 2) {
                    if (Number(to_date[0].trim()) > 70) {
                        to_date_year = 1900 + Number(to_date[0].trim());
                    } else {
                        to_date_year = 2000 + Number(to_date[0].trim());
                    }
                } else {
                    to_date_year = to_date[0].trim();
                }

            }
        } else {
            var from_date = str[0].split("'");
            if (from_date.length == 2) {
                //  from month
                var from_month = from_date[0].trim();
                from_month_number = months.indexOf(from_month) + 1;
                //  from year
                if (from_date[1].trim().length == 2) {
                    if (Number(from_date[1].trim()) > 70) {
                        from_date_year = 1900 + Number(from_date[1].trim());
                    } else {
                        from_date_year = 2000 + Number(from_date[1].trim());
                    }
                } else {
                    from_date_year = from_date[1].trim();
                }

            } else {
                //  from year
                from_date_year = from_date[0].trim();
            }
        }

        var from_date = '';
        var to_date = '';
        if (typeof from_month_number != 'undefined') {
            from_date = from_date_year + "-" + from_month_number;
        } else {
            from_date = from_date_year;
        }
        var to_date = '';
        if (typeof to_date_year != 'undefined') {
            if (to_date_year == 'Present') {
                to_date = 'PRESENT';
            } else {
                if (typeof to_month_number != 'undefined') {

                    to_date = to_date_year + "-" + to_month_number;

                } else {
                    to_date = to_date_year;
                }

            }

        }
        var exp = {};
        exp.from_date = from_date;
        exp.to_date = to_date;
        return exp;
    },
    extractYearFromString: function (string) {
//      source format
//        Angel : June 2013
//        f6s  : 2012-05-01
//        gust :  March 2011 
//        startuphb : 1999-01-01
        var match = string.match(/\b([0-9]{4})\b/i);
        if (match != null) {
            return  match[0];
        } else {
            return '';
        }
    },
    extractCountryFromString: function (string, countrName) {
        var pattern = new RegExp("\\b" + countrName + "\\b", "gi");
        var match = string.match(pattern);
        if (match != null) {
            return  match[0];
        } else {
            return '';
        }

    }
}