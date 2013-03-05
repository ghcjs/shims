// keep these values the same as "include/HsBaseConfig.h"
var h$E2BIG = 7;
var h$EACCES = 13;
var h$EINVAL = 22;
var h$EILSEQ = 92;

var h$errno = 0;

function __hscore_get_errno() {
//  log("### __hscore_get_errno: " + h$errno);
  return h$errno;
}

function strerror(err) {
  ret1 = 0;
  if(err === h$E2BIG) {
    return encodeUtf8("too big");
  } else if(err === h$EACCES) {
    return encodeUtf8("no access");
  } else if(err === h$EINVAL) {
    return encodeUtf8("invalid");
  } else {
    return encodeUtf8("unknown error");
  }
}


