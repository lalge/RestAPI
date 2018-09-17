config = {
    'mongo_conf': {
        host: 'localhost',
        connection_string: 'mongodb://localhost:27017/inx_cms'
    },
    'inx_cms': {
        'mongo_conf': {
            host: 'localhost',
            connection_string: 'mongodb://localhost:27017/inx_cms'
        },
        'smtp_conf': {
            host: 'mail01.cheersin.com',
            port: 587,
            user: 'suraj.varane@cheersin.com',
            pass: 'cheers@123',
            sendto: 'suraj.varane@cheersin.com'
        },
        'SiteUrl': 'https://localhost/inx_cms/public/',
        'mdbApi': {
            url: 'http://185.156.67.170:8080/',
            username: 'abhishek',
            password: 'secret'

        },
        ADDNOTIFICAION: 1,
        EMAILNOTIFICAION: 1,
        APPLICATION_ENV:'development'

    },
    'inx': {
        'mongo_conf': {
            host: 'localhost',
            connection_string: 'mongodb://localhost:27017/inx'
        },
        'base_folder': 'inx'
    },

    'inx_data': {
        'mongo_conf': {
            host: 'localhost',
            connection_string: 'mongodb://localhost:27017/inx_data'
        },
        'smtp_conf': {
            host: 'mail01.cheersin.com',
            port: 587,
            user: 'suraj.varane@cheersin.com',
            pass: 'cheers@123',
            sendto: 'suraj.varane@cheersin.com'
        }
    },
    proxy_details: {
        // for local 
        proxy: 'http://108.59.14.203:13010',
//        proxy: 'http://us1.proxies.online:8182',
//        netnut Open on LIVE
//        username : 'cheersint', //Could be between a1 to a256
//        password : 'ITGe7rHs',
//        port : 33128,
//        proxy : 'http://cheersint:ITGe7rHs@any-s20.netnut.io:33128'
    },
    patent_source_api: {
        'espacenet': {
            'api_auth_url': 'https://ops.epo.org/3.2/auth/accesstoken',
            'consumer_key': 'c69tk5F1fc5vV4E7ICkdMB3ITLX4fmFP',
            'consumer_secret': '2HmDsvA5VfV4YGER',
        }

    },
    escapeRegExp: function (str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    },
    cleanString: function (input) {
        if (typeof input != 'undefined' && input != null && input != '') {
            return input.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "");
        }
    }

};
module.exports = config;
