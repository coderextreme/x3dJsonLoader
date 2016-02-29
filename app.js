/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var fs = require("fs");

var config = require("./config");
var externPrototypeExpander = require("./ServerPrototypeExpander");

var app = express();
var router = express.Router();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/cobwebframe', function(req, res){
  res.render('cobwebframe', { title: 'Cobweb Frame' });
});

app.get('/users', user.list);



fs.symlink(
path.resolve(config.examples),
path.resolve(__dirname + "/examples"),
'junction',
 function (err) {
        if (err) {
                console.log( err.code === 'EEXIST' ? "Go to the link above!\n" : err);
        }
  }
);

/*
function magic(path, type) {
    app.get(path, function(req, res, next) {
	var url = req._parsedUrl.pathname.substr(1);
	console.log(url);
	fs.readFile(url, function(err, data) {
		if (err) {
			console.error(err);
		} else {
			res.header("Content-Type", type);
			res.send(data);
		}
		next();
	});
    });
}

magic("*.vs", "text/plain");//"x-shader/x-vertex");
magic("*.fs", "text/plain");//"x-shader/x-fragment");
magic("*.x3d", "model/x3d+xml");
magic("*.html", "text/html");
magic("*.xslt", "text/xsl");
magic("*.xhtml", "application/xhtml+xml");
magic("*.js", "text/javascript");
magic("*.gif", "image/gif");
magic("*.jpg", "image/jpeg");
magic("*.jpeg", "image/jpeg");
magic("*.png", "image/png");
*/

app.get("*.json", function(req, res, next) {
	var url = req._parsedUrl.pathname.substr(1);
	console.log(url);
	fs.readFile(path.resolve(__dirname, "public", url), function(err, data) {
		if (err) {
			console.error(err);
		} else {
			try {
				var json = JSON.parse(data.toString());
				console.log("Calling expander");
				externPrototypeExpander(url, json);
				res.header("Content-Type", "text/json");
				res.send(json);
			} catch (e) {
				console.log(e);
			}
		}
		// next();
	});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

