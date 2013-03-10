// fixme node argv
function h$getProgArgv(pid,pio,psd,pso) {
/*  if( ) {
    pid.setInt32(pio, 0);
  } else if {
    pid.setInt32(pio, 0);
  } */
  pid.setInt32(pio, 0);
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

function h$gettimeofday() {
  log("### gettimeofday: " + arguments[0]);
  log("### gettimeofday: " + arguments[1]);
  log("### gettimeofday: " + arguments[2]);
  log("### gettimeofday: " + arguments[3]);
  return 0;
}
