var h$programArgs;
if(typeof scriptArgs !== 'undefined') {
  h$programArgs = scriptArgs.slice(0);
  h$programArgs.unshift("a.js");
} else if(typeof process !== 'undefined' && process.argv) {
  h$programArgs = process.argv.slice(1);
} else if(typeof arguments !== 'undefined') {
  h$programArgs = arguments.slice(0);
  h$programArgs.unshift("a.js");
} else {
  h$programArgs = [ "a.js" ];
}

function h$getProgArgv(argc_v,argc_off,argv_v,argv_off) {
  var c = h$programArgs.length;
  if(c === 0) {
    argc_v.setInt32(argc_off, 0);
  } else {
    argc_v.setInt32(argc_off, c);
    var argv = new DataView(new ArrayBuffer(4*c));
    argv.arr = [];
    for(var i=0;i<h$programArgs.length;i++) {
      argv.arr[4*i] = [ h$encodeUtf8(h$programArgs[i]), 0 ];
    }
    if(!argv_v.arr) { argv_v.arr = []; }
    argv_v.arr[argv_off] = [argv, 0];
  }
}

function h$errorBelch() {
  log("### errorBelch: do we need to handle a vararg function here?");
}

function h$errorBelch2(buf1, buf_offset1, buf2, buf_offset2) {
//  log("### errorBelch2");
  h$errorMsg(h$decodeUtf8z(buf1, buf_offset1), h$decodeUtf8z(buf2, buf_offset2));
}

function h$debugBelch2(buf1, buf_offset1, buf2, buf_offset2) {
  h$errorMsg(h$decodeUtf8z(buf1, buf_offset1), h$decodeUtf8z(buf2, buf_offset2));
}

function h$errorMsg(pat) {
  // poor man's vprintf
  var str = pat;
  for(var i=1;i<arguments.length;i++) {
    str = str.replace(/%s/, arguments[i]);
  }
  if(typeof process !== 'undefined' && process && process.stderr) {
    process.stderr.write(str+"\n");
  } else if (typeof printErr !== 'undefined') {
    printErr(str);
  } else if (typeof putstr !== 'undefined') {
    putstr(str+"\n");
  } else if(typeof(console) !== 'undefined') {
    console.log(str);
  }
}

function h$performMajorGC() {
  // fixme
}


function h$baseZCSystemziCPUTimeZCgetrusage() {
  return 0;
}

function h$gettimeofday(tv_v,tv_o,tz_v,tz_o) {
  var now = Date.now();
  tv_v.setUint32(tv_o,     now / 1000);
  tv_v.setUint32(tv_o + 4, (now % 1000) * 1000);
  return 0;
}
var h$__hscore_gettimeofday = h$gettimeofday;

function h$localtime_r(timep_v, timep_o, result_v, result_o) {
  var t = timep_v.getUint32(timep_o);
  var d = new Date(t * 1000);
  result_v.setInt32(result_o     , d.getSeconds());
  result_v.setInt32(result_o + 4 , d.getMinutes());
  result_v.setInt32(result_o + 8 , d.getHours());
  result_v.setInt32(result_o + 12, d.getDate());
  result_v.setInt32(result_o + 16, d.getMonth());
  result_v.setInt32(result_o + 24, d.getFullYear()-1900);
  result_v.setInt32(result_o + 28, d.getDay());
  result_v.setInt32(result_o + 32, 0); // fixme yday 1-365 (366?)
  result_v.setInt32(result_o + 36, -1); // dst information unknown
  h$ret1 = result_o;
  return result_v;
}
var h$__hscore_localtime_r = h$localtime_r;
