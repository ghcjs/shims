#include <ghcjs/rts.h>

#ifdef GHCJS_TRACE_ENV
function h$logEnv() { h$log.apply(h$log,arguments); }
#define TRACE_ENV(args...) h$logEnv(args)
#else
#define TRACE_ENV(args...)
#endif

// set up debug logging for the current JS environment/engine
// browser also logs to <div id="output"> if jquery is detected
// the various debug tracing options use h$log
#ifndef GHCJS_BROWSER
var h$glbl;
function h$getGlbl() { h$glbl = this; }
h$getGlbl();
#endif
#ifdef GHCJS_LOG_BUFFER
var h$logBufferSize = 6000;
var h$logBufferShrink = 1000;
var h$logBuffer = [];
#endif
function h$log() {
#ifdef GHCJS_LOG_BUFFER
  if(!h$logBuffer) return;
  var s = '';
  for(var i=0;i<arguments.length;i++) { s = s + arguments[i]; }
  h$logBuffer.push(s);
  if(h$logBuffer.length > h$logBufferSize) h$logBuffer = h$logBuffer.slice(h$logBufferShrink);
#else
#ifndef GHCJS_BROWSER
  if(h$glbl) {
    if(h$glbl.console && h$glbl.console.log) {
      h$glbl.console.log.apply(h$glbl.console,arguments);
    } else {
      h$glbl.print.apply(this,arguments);
    }
  } else {
    if(typeof console !== 'undefined') {
#endif
      console.log.apply(console, arguments);
#ifndef GHCJS_BROWSER
    } else if(typeof print !== 'undefined') {
      print.apply(null, arguments);
    }
  }
#endif
#endif
#ifdef GHCJS_LOG_JQUERY
  // if we have jquery, add to <div id='output'> element
  if(typeof(jQuery) !== 'undefined') {
    var x = '';
    for(var i=0;i<arguments.length;i++) { x = x + arguments[i]; }
    var xd = jQuery("<div></div>");
    xd.text(x);
    jQuery('#output').append(xd);
  }
#endif
}

function h$collectProps(o) {
  var props = [];
  for(var p in o) { props.push(p); }
  return("{"+props.join(",")+"}");
}



// load the command line arguments in h$programArgs
// the first element is the program name
var h$programArgs;
#ifdef GHCJS_BROWSER
h$programArgs = [ "a.js" ];
#else
if(h$isNode) {
    h$programArgs = process.argv.slice(1);
} else if(h$isJvm) {
    h$programArgs = h$getGlobal(this).arguments.slice(0);
    h$programArgs.unshift("a.js");
} else if(h$isJsShell && typeof h$getGlobal(this).scriptArgs !== 'undefined') {
    h$programArgs = h$getGlobal(this).scriptArgs.slice(0);
    h$programArgs.unshift("a.js");
} else if((h$isJsShell || h$isJsCore) && typeof h$getGlobal(this).arguments !== 'undefined') {
    h$programArgs = h$getGlobal(this).arguments.slice(0);
    h$programArgs.unshift("a.js");
} else {
    h$programArgs = [ "a.js" ];
}
#endif

function h$getProgArgv(argc_v,argc_off,argv_v,argv_off) {
  TRACE_ENV("getProgArgV");
  var c = h$programArgs.length;
  if(c === 0) {
    argc_v.dv.setInt32(argc_off, 0, true);
  } else {
    argc_v.dv.setInt32(argc_off, c, true);
    var argv = h$newByteArray(4*c);
    argv.arr = [];
    for(var i=0;i<h$programArgs.length;i++) {
      argv.arr[4*i] = [ h$encodeUtf8(h$programArgs[i]), 0 ];
    }
    if(!argv_v.arr) { argv_v.arr = []; }
    argv_v.arr[argv_off] = [argv, 0];
  }
}

function h$setProgArgv(n, ptr_d, ptr_o) {
  args = [];
  for(var i=0;i<n;i++) {
    var p = ptr_d.arr[ptr_o+4*i];
    var arg = h$decodeUtf8z(p[0], p[1]);
    args.push(arg);
  }
  h$programArgs = args;
}

function h$getpid() {
#ifndef GHCJS_BROWSER
  if(h$isNode) return process.id;
#endif
  return 0;
}

function h$__hscore_environ() {
    TRACE_ENV("hscore_environ");
#ifndef GHCJS_BROWSER
    if(h$isNode) {
        var env = [], i;
        for(i in process.env) env.push(i + '=' + process.env[i]);
        if(env.length === 0) return null;
        var p = h$newByteArray(4*env.length+1);
        p.arr = [];
        for(i=0;i<env.length;i++) p.arr[4*i] = [h$encodeUtf8(env[i]), 0];
        p.arr[4*env.length] = [null, 0];
        RETURN_UBX_TUP2(p, 0);
    }
#endif
    RETURN_UBX_TUP2(null, 0);
}

function h$getenv(name, name_off) {
    TRACE_ENV("getenv");
#ifndef GHCJS_BROWSER
    if(h$isNode) {
        var n = h$decodeUtf8z(name, name_off);
        if(typeof process.env[n] !== 'undefined')
            RETURN_UBX_TUP2(h$encodeUtf8(process.env[n]), 0);
    }
#endif
    RETURN_UBX_TUP2(null, 0);
}

function h$errorBelch() {
  h$log("### errorBelch: do we need to handle a vararg function here?");
}

function h$errorBelch2(buf1, buf_offset1, buf2, buf_offset2) {
//  log("### errorBelch2");
  h$errorMsg(h$decodeUtf8z(buf1, buf_offset1), h$decodeUtf8z(buf2, buf_offset2));
}

function h$debugBelch2(buf1, buf_offset1, buf2, buf_offset2) {
  h$errorMsg(h$decodeUtf8z(buf1, buf_offset1), h$decodeUtf8z(buf2, buf_offset2));
}

function h$errorMsg(pat) {
#ifndef GHCJS_BROWSER
  function stripTrailingNewline(xs) {
    return xs.replace(/\r?\n$/, "");
  }
#endif
  // poor man's vprintf
  var str = pat;
  for(var i=1;i<arguments.length;i++) {
    str = str.replace(/%s/, arguments[i]);
  }
#ifndef GHCJS_BROWSER
  if(h$isGHCJSi) {
    // ignore message
  } else if(h$isNode) {
    process.stderr.write(str);
  } else if (h$isJsShell && typeof printErr !== 'undefined') {
    if(str.length) printErr(stripTrailingNewline(str));
  } else if (h$isJsShell && typeof putstr !== 'undefined') {
    putstr(str);
  } else if (h$isJsCore) {
    if(str.length) {
	if(h$base_stderrLeftover.val !== null) {
	    debug(h$base_stderrLeftover.val + stripTrailingNewline(str));
	    h$base_stderrLeftover.val = null;
	} else {
	    debug(stripTrailingNewline(str));
	}
    }
  } else {
#endif
    if(typeof console !== 'undefined') {
      console.log(str);
    }
#ifndef GHCJS_BROWSER
  }
#endif
}

// this needs to be imported with foreign import ccall safe/interruptible
function h$performMajorGC() {
    // save current thread state so we can enter the GC
    var t = h$currentThread, err = null;
    t.sp = h$sp;
    h$currentThread = null;

    try {
        h$gc(t);
    } catch(e) {
        err = e;
    }

    // restore thread state
    h$currentThread = t;
    h$sp = t.sp;
    h$stack = t.stack;

    if(err) throw err;
}


function h$baseZCSystemziCPUTimeZCgetrusage() {
  return 0;
}

function h$getrusage() {
  return 0;
}


// fixme need to fix these struct locations

function h$gettimeofday(tv_v,tv_o,tz_v,tz_o) {
  var now = Date.now();
  tv_v.dv.setInt32(tv_o,     (now / 1000)|0, true);
  tv_v.dv.setInt32(tv_o + 4, ((now % 1000) * 1000)|0, true);
  if(tv_v.len >= tv_o + 12) {
    tv_v.dv.setInt32(tv_o + 8, ((now % 1000) * 1000)|0, true);
  }
  return 0;
}

function h$traceEvent(ev_v,ev_o) {
  h$errorMsg(h$decodeUtf8z(ev_v, ev_o));
}

function h$traceMarker(ev_v,ev_o) {
  h$errorMsg(h$decodeUtf8z(ev_v, ev_o));
}

var h$__hscore_gettimeofday = h$gettimeofday;

var h$myTimeZone = h$encodeUtf8("UTC");
function h$localtime_r(timep_v, timep_o, result_v, result_o) {
  var t = timep_v.i3[timep_o];
  var d = new Date(t * 1000);
  result_v.dv.setInt32(result_o     , d.getSeconds(), true);
  result_v.dv.setInt32(result_o + 4 , d.getMinutes(), true);
  result_v.dv.setInt32(result_o + 8 , d.getHours(), true);
  result_v.dv.setInt32(result_o + 12, d.getDate(), true);
  result_v.dv.setInt32(result_o + 16, d.getMonth(), true);
  result_v.dv.setInt32(result_o + 20, d.getFullYear()-1900, true);
  result_v.dv.setInt32(result_o + 24, d.getDay(), true);
  result_v.dv.setInt32(result_o + 28, 0, true); // fixme yday 1-365 (366?)
  result_v.dv.setInt32(result_o + 32, -1, true); // dst information unknown
  result_v.dv.setInt32(result_o + 40, 0, true); // gmtoff?
  if(!result_v.arr) result_v.arr = [];
  result_v.arr[result_o + 40] = [h$myTimeZone, 0];
  result_v.arr[result_o + 48] = [h$myTimeZone, 0];
  RETURN_UBX_TUP2(result_v, result_o);
}
var h$__hscore_localtime_r = h$localtime_r;
