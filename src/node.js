/* node.js support for GHCJS */

// node.js global objects don't work as Closure Library expects
var goog = {};
goog.global = this;
goog.global.goog = goog;

/* SpiderMonkey support */

// we don't have console, but we do have print
if(this['console'] === undefined) {
  this['console'] = { log: this['print'] };
}

// jsbn checks this
if(this['navigator'] === undefined) {
  this['navigator'] = { appName: 'none' };
}
var navigator = { appName: 'none' };

