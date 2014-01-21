#!/usr/bin/env node

var watchify = require('../');
var through = require('through');
var fs = require('fs');
var path = require('path');
var fromArgs = require('browserify/bin/args');

var w, outfile, verbose, dotfile;
var prevErr, first = true;

(function retry () {
    w = watchify(fromArgs(process.argv.slice(2)));
    outfile = w.argv.o || w.argv.outfile;
    verbose = w.argv.v || w.argv.verbose;
    
    if (!outfile) {
        console.error('You MUST specify an outfile with -o.');
        process.exit(1);
    }
    dotfile = path.join(path.dirname(outfile), '.' + path.basename(outfile));
    
    w.on('update', bundle);
    w.once('error', function (err) {
        if (String(err) !== String(prevErr)) {
            console.error(err);
        }
        prevErr = err;
        retry();
    });
    bundle();
})();

function bundle () {
    var wb = w.bundle();
    var caught = false;
    wb.on('error', function (err) {
        console.error(String(err));
    });
    wb.pipe(fs.createWriteStream(dotfile));
    var bytes = 0;
    wb.pipe(through(write, end));
    
    function write (buf) { bytes += buf.length }
    
    function end () {
        prevErr = undefined;
        first = false;
        fs.rename(dotfile, outfile, function (err) {
            if (err) return console.error(err);
            if (verbose) {
                console.error(bytes + ' bytes written to ' + outfile);
            }
        });
    }
}
