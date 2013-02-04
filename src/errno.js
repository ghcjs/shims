// keep these values the same as "include/HsBaseConfig.h"
var $hs_E2BIG = 7;
var $hs_EACCES = 13;
var $hs_EINVAL = 22;
var $hs_EILSEQ = 92;

var $hs_errno = 0;

function __hscore_get_errno() {
//  log("### __hscore_get_errno: " + $hs_errno);
  return $hs_errno;
}

function strerror(err) {
  ret1 = 0;
  if(err == $hs_E2BIG) {
    return encodeUtf8("too big");
  } else if(err == $hs_EACCES) {
    return encodeUtf8("no access");
  } else {
    return encodeUtf8("unknown error");
  }
}


