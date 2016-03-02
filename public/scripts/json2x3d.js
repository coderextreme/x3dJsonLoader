"use strict";

// 'http://www.web3d.org/specifications/x3d-namespace'

// Convert X3D JSON to XML

// For X3D Browser functions
if (typeof Browser === 'undefined') {
	var Browser = {
		print : function(string) { if (typeof console !== 'undefined' && typeof string !== 'undefined') console.error(string); },
		println : function(string) { if (typeof console !== 'undefined' && typeof string !== 'undefined') console.error(string); },
		stringToArray : function(obj) {
			if (typeof obj === 'object') {
				return obj;
			} else {
				return JSON.parse('['+obj+']');
			}
		},
		appendTo : function(element, json) {
			 return ConvertToX3DOM(json, "", element, 'foo.json');
		}
	}
}

var xmldom = require('xmldom');
var DOMImplementation = new xmldom.DOMImplementation();
var XMLSerializer = xmldom.XMLSerializer;

var docType = DOMImplementation.createDocumentType("X3D", 'ISO//Web3D//DTD X3D 3.3//EN" "http://www.web3d.org/specifications/x3d-3.3.dtd', null);
var document = DOMImplementation.createDocument(null, "X3D", docType);
document.insertBefore(document.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"'), document.doctype);
var element = document.getElementsByTagNameNS(null, "X3D")[0];
element.setAttribute("xmlns:xsd", 'http://www.w3.org/2001/XMLSchema-instance');

var x3djsonNS;

function elementSetAttribute(element, key, value) {
	element.setAttribute(key, value);
}

function ConvertChildren(parentkey, object, element, path) {
	var key;
	for (key in object) {
		if (typeof object[key] === 'object') {
			if (isNaN(parseInt(key))) {
				ConvertObject(key, object, element, path);
			} else {
				ConvertToX3DOM(object[key], key, element, path);
			}
		}
	}
}

function CreateElement(key, x3djsonNS) {
	if (typeof x3djsonNS === 'undefined') {
		return document.createElement(key);
	} else {
		var child = document.createElementNS(x3djsonNS, key);
		if (child == null || typeof child === 'undefined') {
			console.log('Trouble creating element for', key);
			child = document.createElement(key);
		}
		return child;
	}
}
function ConvertObject(key, object, element, path) {
	if (object !== null && typeof object[key] === 'object') {
		if (key.substr(0,1) === '@') {
			ConvertToX3DOM(object[key], key, element, path);
		} else if (key.substr(0,1) === '-') {
			ConvertChildren(key, object[key], element, path);
		} else if (key === '#comment') {
			for (var c in object[key]) {
				var child = document.createComment(object[key][c]);
				element.appendChild(child);
			}
		} else if (key === '#sourceText') {
			var child = document.createTextNode(object[key].join("\n"));
//			if (typeof x3djsonNS !== 'undefined' && x3djsonNS !== "http://www.w3.org/1999/xhtml") {
//				var child = document.createCDATASection(object[key].join("\n").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
//			}
			element.appendChild(child);
		} else {
			if (key === 'connect' || key === 'fieldValue' || key === 'field' || key === 'meta') {
				for (var childkey in object[key]) {  // for each field
					if (typeof object[key][childkey] === 'object') {
						var child = CreateElement(key, x3djsonNS);
						ConvertToX3DOM(object[key][childkey], childkey, child, path);
						element.appendChild(child);
						element.appendChild(document.createTextNode("\n"));
					}
				}
			} else {
				var child = CreateElement(key, x3djsonNS);
				ConvertToX3DOM(object[key], key, child, path);
				element.appendChild(child);
				element.appendChild(document.createTextNode("\n"));
			}
		}
	}
}

function ConvertToX3DOM(object, parentkey, element, path) {
	var key;
	var localArray = [];
	var isArray = false;
	var arrayOfStrings = false;
	for (key in object) {
		if (isNaN(parseInt(key))) {
			isArray = false;
		} else {
			isArray = true;
		}
		if (isArray) {
			if (typeof object[key] === 'number') {
				localArray.push(object[key]);
			} else if (typeof object[key] === 'string') {
				localArray.push(object[key]);
				arrayOfStrings = true;
			} else if (typeof object[key] === 'boolean') {
				localArray.push(object[key]);
			} else if (typeof object[key] === 'object') {
				if (object[key] != null && typeof object[key].join === 'function') {
					localArray.push(object[key].join(" "));
				}
				ConvertToX3DOM(object[key], key, element, path);
			} else {
				console.error("Unknown type found in array "+typeof object[key]);
			}
		} else if (typeof object[key] === 'object') {
			// This is where the whole thing starts
			if (key === 'X3D') {
				ConvertToX3DOM(object[key], key, element, path);
				elementSetAttribute(element, "id", "x3dele");
				elementSetAttribute(element, "xmlns:xsd", 'http://www.w3.org/2001/XMLSchema-instance');
			} else {
				ConvertObject(key, object, element, path);
			}
		} else if (typeof object[key] === 'number') {
			elementSetAttribute(element, key.substr(1),object[key]);
		} else if (typeof object[key] === 'string') {
			if (key !== '#comment') {
				elementSetAttribute(element, key.substr(1),object[key]);
			} else {
				var child = document.createComment(object[key]);
				element.appendChild(child);
			}
		} else if (typeof object[key] === 'boolean') {
			elementSetAttribute(element, key.substr(1),object[key]);
		} else {
			console.error("Unknown type found in object "+typeof object[key]);
		}
	}
	if (isArray) {
		if (parentkey.substr(0,1) === '@') {
			if (arrayOfStrings) {
				arrayOfStrings = false;
                                if (parentkey === '@url' || parentkey.indexOf("Url") === parentkey.length - 3) {
					var url;
					// No longer need to split
					// localArray = localArray[0].split(/" "/);
					for (url in localArray) {
						// localArray[url].replace(/"/g, '');
						if (localArray[url].indexOf("http://") === 0
						 || localArray[url].indexOf("https://") === 0) {
						} else if (localArray[url].indexOf("urn:web3d:media:textures/panoramas/") === 0) {
							var ls = localArray[url].lastIndexOf("/");
							if (ls > 0) {
								localArray[url] = 'examples/Basic/UniversalMediaPanoramas/'+localArray[url].substring(ls+1);
							}

						} else {
							var pe = path.lastIndexOf('/');
							var pc = path.substring(0, pe);
							localArray[url] = pc+'/'+localArray[url];
						        if (localArray[url].indexOf('/') === 0) {
								// no webroot absolute paths.  No /'s for cobweb shaders
								localArray[url] = localArray[url].substring(1);
							}
						}
							
                                       }
					// if URL
					console.error("Loading URL",'"'+localArray.join('" "')+'"');
					elementSetAttribute(element, parentkey.substr(1),'"'+localArray.join('" "')+'"');
                                } else {
					// if string array
					elementSetAttribute(element, parentkey.substr(1),'"'+localArray.join('" "')+'"');
				}
			} else {
				// if non string array
				elementSetAttribute(element, parentkey.substr(1),localArray.join(" "));
			}
		}
		isArray = false;
	}
	return element;
}

function loadX3DJS(json, path, xml) {
	ConvertToX3DOM(json, "", element, path);
	console.error(XMLSerializer);
	var serializer = new XMLSerializer();
	if (typeof xml !== 'undefined' && typeof xml.push === 'function') {
		xml.push('<?xml version="1.0" encoding="UTF-8"?>');
		xml.push('<!DOCTYPE X3D PUBLIC "ISO//Web3D//DTD X3D 3.3//EN" "http://www.web3d.org/specifications/x3d-3.3.dtd">');
		// for Cobweb
		var serializer = new XMLSerializer();
		xml.push(serializer.serializeToString(element));
	}
}

if (typeof module === 'object')  {
	module.exports = loadX3DJS;
}


var content = '';

// read content into buffer
process.stdin.resume();
process.stdin.on('data', function(buf) { content += buf.toString(); });

process.stdin.on('end', function() {
	var json = JSON.parse(content);
	var xml = loadX3DJS(json, 'pp3s.json', xml);
	console.error(xml);
});

if (typeof module === 'object')  {
	module.exports = {
		loadX3DJS : loadX3DJS,
		Browser : Browser
	}
}
