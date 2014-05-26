#include "HsBaseConfig.h"

#ifdef GHCJS_TRACE_ERRNO
function h$logErrno() { h$log.apply(h$log,arguments); }
#define TRACE_ERRNO(args...) h$logErrno(args)
#else
#define TRACE_ERRNO(args...)
#endif

var h$errno = 0;

function h$__hscore_get_errno() {
  TRACE_ERRNO("hscore_get_errno: " + h$errno);
  return h$errno;
}

var h$errorStrs =  { CONST_E2BIG:   "too big"
                   , CONST_EACCESS: "no access"
                   , CONST_EINVAL:  "invalid"
                   , CONST_EBADF:   "bad file descriptor"
                   , CONST_ENOTDIR: "not a directory"
                   , CONST_ENOENT:  "no such file or directory"
                   , CONST_EPERM:   "operation not permitted"
                   , CONST_EEXIST:  "file exists"
                   }

function h$strerror(err) {
    TRACE_ERRNO("strerror: " + err);
    h$ret1 = 0;
    return h$encodeUtf8(h$errorStrs[err] || "unknown error");
}


