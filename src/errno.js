#ifdef GHCJS_TRACE_ERRNO
function h$logErrno() { h$log.apply(h$log,arguments); }
#define TRACE_ERRNO(args...) h$logErrno(args)
#else
#define TRACE_ERRNO(args...)
#endif

// keep these values the same as "include/HsBaseConfig.h"
var h$ENOENT = 2;
var h$E2BIG = 7;
var h$EBADF = 9;
var h$EACCES = 13;
var h$ENOTDIR = 20;
var h$EINVAL = 22;
var h$EILSEQ = 92;

var h$errno = 0;

function h$__hscore_get_errno() {
  TRACE_ERRNO("hscore_get_errno: " + h$errno);
  return h$errno;
}

function h$strerror(err) {
  h$ret1 = 0;
  if(err === h$E2BIG) {
    return h$encodeUtf8("too big");
  } else if(err === h$EACCES) {
    return h$encodeUtf8("no access");
  } else if(err === h$EINVAL) {
    return h$encodeUtf8("invalid");
  } else if(err === h$EBADF) {
    return h$encodeUtf8("invalid file descriptor");
  } else if(err === h$ENOTDIR) {
    return h$encodeUtf8("not a directory");
  } else if(err === h$ENOENT) {
    return h$encodeUtf8("no such file or directory");
  } else {
    return h$encodeUtf8("unknown error");
  }
}

