/* node.js support for GHCJS */

// node.js global objects don't work as Closure Library expects
var goog = {};
goog.global = this;
goog.global.goog = goog;

