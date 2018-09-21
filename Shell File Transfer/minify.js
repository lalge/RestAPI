/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var source_dir = process.argv[2];

// JS
// 1. read files
// 2. 
var file_data = require(source_dir + '/data/templates/files_js.json');

//var obj = JSON.parse(js_file_data);

var cmd = 'uglifyjs --convert-urls ' + source_dir + '/public ';
for (var i = 0; i < file_data.length; i++) {
    cmd += ' ' + source_dir + '/public/' + file_data[i].path + ' ';
}
cmd += ' -o ' + source_dir + '/public/prod.min.js';

var exec = require('child_process').exec;

console.log(cmd);

exec(cmd, function (error, stdout, stderr) {
    console.log(error);
    // command output is in stdout
});


//// CSS
var file_data = require(source_dir + '/data/templates/files_css.json');

var cmd = 'uglifycss --convert-urls ' + source_dir + '/public ';
for (var i = 0; i < file_data.length; i++) {
    cmd += ' ' + source_dir + '/public/' + file_data[i].path + ' ';
}
cmd += ' > ' + source_dir + '/public/prod.min.css';
var exec = require('child_process').exec;
console.log(cmd);
exec(cmd, function (error, stdout, stderr) {
    console.log(error);
    // command output is in stdout
});


// for INX Partners


// JS
// 1. read files
// 2. 
try {
    var file_data = require(source_dir + '/data/templates/files_js_partner.json');

    //var obj = JSON.parse(js_file_data);

    var cmd = 'uglifyjs --convert-urls ' + source_dir + '/public/partner-assets ';
    for (var i = 0; i < file_data.length; i++) {
        cmd += ' ' + source_dir + '/public/partner-assets/' + file_data[i].path + ' ';
    }
    cmd += ' -o ' + source_dir + '/public/partner-assets/prod.min.js';

    var exec = require('child_process').exec;

    console.log(cmd);

    exec(cmd, function (error, stdout, stderr) {
        console.log(error);
        // command output is in stdout
    });


//// CSS
    var file_data = require(source_dir + '/data/templates/files_css_partner.json');

    var cmd = 'uglifycss --convert-urls ' + source_dir + '/public/partner-assets ';
    for (var i = 0; i < file_data.length; i++) {
        cmd += ' ' + source_dir + '/public/partner-assets/' + file_data[i].path + ' ';
    }
    cmd += ' > ' + source_dir + '/public/partner-assets/prod.min.css';
    var exec = require('child_process').exec;
    console.log(cmd);
    exec(cmd, function (error, stdout, stderr) {
        console.log(error);
        // command output is in stdout
    });
} catch (e) {
}


