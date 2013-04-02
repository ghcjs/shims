/* node.js support for GHCJS */
if(typeof require !== 'undefined') {
  var h$nodeFs = require('fs');
}

// node.js global objects don't work as Closure Library expects
var goog = {};
goog.global = this;
goog.global.goog = goog;
goog.global.CLOSURE_NO_DEPS = true;

// SpiderMonkey support

// we don't have console, but we do have print
if(this['console'] === undefined) {
  this['console'] = { log: this['print'] };
}

// jsbn checks this
if(this['navigator'] === undefined) {
  navigator = { appName: 'none' };
}

