function getProgArgv(pid,pio,psd,pso) {
  pid.setInt32(pio, 0);
}


function errorBelch() {
  log("### errorBelch: do we need to handle a vararg function here?");
}

function errorBelch2(buf1, buf_offset1, buf2, buf_offset2) {
//  log("### errorBelch2");
  errorMsg(decodeUtf8z(buf1, buf_offset1), decodeUtf8z(buf2, buf_offset2));
}

function errorMsg(pat) {
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
