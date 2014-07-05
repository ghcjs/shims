#include "HsBaseConfig.h"

#ifdef GHCJS_TRACE_IO
function h$logIO() { h$log.apply(h$log, arguments); }
#define TRACE_IO(args...) h$logIO(args)
#else
#define TRACE_IO(args...)
#endif

function h$stdFd(n,readReady,writeReady,buf) {
  // fixme isATTY should check
  return new h$Fd(buf, readReady, writeReady, true, n);
}

var h$stdinBuf = { write: function() { throw "can't write to stdin"; } };
var h$stdoutBuf = { read: function() { throw "can't read from stdout"; } };
var h$stderrBuf = { read: function () { throw "can't read from stderr"; } };

function h$initStdioBufs() {
  if(typeof process !== 'undefined' && process && process.stdin) { // node.js
    TRACE_IO("setting up node.js stdio");
    h$stdinBuf.isATTY  = process.stdin.isTTY;
    h$stdoutBuf.isATTY = process.stdout.isTTY;
    h$stderrBuf.isATTY = process.stderr.isTTY;

    // stdin
    h$stdinBuf.chunks = new h$Queue();
    h$stdinBuf.chunkOff = 0;
    h$stdinBuf.eof = false;
    h$stdinBuf.readReady = false;
    h$stdinBuf.writeReady = false;
    setTimeout(function() {
    process.stdin.on('readable', function() {
      TRACE_IO("stdin readable:");
      h$stdin.readReady = true;
      h$notifyRead(h$stdin);
    });
    process.stdin.on('end', function() {
      TRACE_IO("stdin eof");
      h$stdinBuf.eof = true;
      h$stdin.readReady = true; // for eof, the fd is ready but read returns 0 bytes
      h$notifyRead(h$stdin);
    });
  },1);
    h$stdinBuf.read = function(fd, buf, buf_offset, n) {
      TRACE_IO("stdin read: " + n);
      if(fd.buf.chunks.length() === 0) {
        var ch = process.stdin.read();
        if(ch) {
          fd.buf.chunks.enqueue(ch);
        } else {
          h$stdin.readReady = false;
          return 0;
        }
      }
      var h = fd.buf.chunks.peek();
      var o = fd.buf.chunkOff;
      var left = h.length - o;
      var u8 = buf.u8;
      if(left > n) {
        for(var i=0;i<n;i++) {
          u8[buf_offset+i] = h[o+i];
        }
        fd.buf.chunkOff += n;
        TRACE_IO("stdin read " + n + " bytes");
        return n;
      } else {
        for(var i=0;i<left;i++) {
          u8[buf_offset+i] = h[o+i];
        }
        fd.buf.chunkOff = 0;
        fd.buf.chunks.dequeue();
        if(fd.buf.chunks.length() === 0 && !fd.buf.eof) {
          h$stdin.readReady = false;
        }
        TRACE_IO("stdin read " + left + " bytes (remainder of chunk)");
        return left;
      }
    }

    // stdout, stderr
    h$stdoutBuf.write  = function(fd, buf, buf_offset, n) {
      process.stdout.write(h$decodeUtf8(buf, n, buf_offset));
      return n;
    };
    h$stderrBuf.write  = function(fd, buf, buf_offset, n) {
      process.stderr.write(h$decodeUtf8(buf, n, buf_offset));
      return n;
    };
  } else if(typeof putstr !== 'undefined') { // SpiderMonkey
    h$stdoutBuf.isATTY = true;
    h$stderrBuf.isATTY = true;
    h$stdinBuf.isATTY = false;
    h$stdinBuf.readReady = true;
    h$stdinBuf.read = function() { return 0; } // eof
    h$stdoutBuf.write = function(fd, buf, buf_offset, n) {
      putstr(h$decodeUtf8(buf, n, buf_offset));
      return n;
    }
    h$stderrBuf.write = function(fd, buf, buf_offset, n) {
      printErr(h$decodeUtf8(buf, n, buf_offset)); // prints too many newlines
      return n;
    }
  } else { // browser or fallback
    h$stdoutBuf.isATTY = true;
    h$stderrBuf.isATTY = true;
    h$stdinBuf.isATTY = false;
    h$stdinBuf.readReady = true;
    h$stdinBuf.read = function() { return 0; } // eof
    var writeConsole = function(fd, buf, buf_offset, n) {
      if(typeof console !== 'undefined' && console && console.log) {
        console.log(h$decodeUtf8(buf, n, buf_offset));
      }
      return n;
    }
    h$stdoutBuf.write = writeConsole;
    h$stderrBuf.write = writeConsole;
  }
}
h$initStdioBufs();

var h$stdin  = h$stdFd(0, false, false, h$stdinBuf);
var h$stdout = h$stdFd(1, false, true, h$stdoutBuf);
var h$stderr = h$stdFd(2, false, true, h$stderrBuf);

TRACE_IO("std buffers set up");

var h$fdN = 3;
var h$fds = { '0': h$stdin
            , '1': h$stdout
            , '2': h$stderr
            };

var h$filesMap = {}; // new Map(); // path -> file

// fixme remove file from h$filesMap?
function h$close(fd) {
  TRACE_IO("close: " + fd);
  var f = h$fds[fd];
  if(f) {
    for(var i=0;i<f.waitRead.length;i++) {
      TRACE_IO("killing reader thread: " + h$threadString(f.waitRead[i]));
      // h$throwTo(f.waitRead[i], h$IOException);
    }
    for(var i=0;i<f.waitWrite.length;i++) {
      TRACE_IO("killing writer thread: " + h$threadString(f.waitWrite[i]));
      // h$throwTo(f.waitWrite[i], h$IOException);
    }
    if(f.buf.close) f.buf.close();
    delete h$fds[fd];
    return 0;
  } else {
    h$errno = CONST_EBADF;
    return -1;
  }
}

function h$Fd(buf, readReady, writeReady, isATTY, n) {
  if(n !== undefined) {
    this.fd = n;
  } else {
    this.fd  = h$fdN++;
  }
  TRACE_IO("created fd: " + this.fd + " ("  + readReady + "," + writeReady + ")");
  this.pos = 0;
  this.buf = buf;
  this.waitRead = [];
  this.waitWrite = [];
  this.readReady = readReady;
  this.writeReady = writeReady;
  this.isATTY = isATTY;
}

function h$newFd(file) {
  var fd = new h$Fd(file, true, true, false);
  TRACE_IO("creating file fd: " + file);
  h$fds[fd.fd] = fd;
  return fd;
}

function h$newFile(path, data) {
  var f = { path: path
          , data: data
          , len: data.len // number of bytes in the file (might be smaller than data.len later)
          , read: h$readFile
          , write: h$writeFile
          , isATTY: false
          };
  h$filesMap[path] = f;
  return f;
}

// notify threads waiting, call after new data for fd comes in
function h$notifyRead(fd) {
  TRACE_IO("notify read fd: " + fd.fd);
  var a = fd.waitRead;
  for(var i=0;i<a.length;i++) {
    h$wakeupThread(a[i]);
  }
  a.length = 0;
}

// notify threads waiting, call when we can write more
function h$notifyWrite(fd) {
  TRACE_IO("notify write fd: " + fd.fd);
  var a = fd.waitWrite;
  for(var i=0;i<a.length;i++) {
    h$wakeupThread(a[i]);
  }
  fd.waitRead.length = 0;
}

// use the system specific way to load the file (either AJAX or directly)
// return a buffer with the contents
function h$loadFileData(path) {
  TRACE_IO("loading file data: " + path);
  if(path.charCodeAt(path.length-1) === 0) {
    path = path.substring(0,path.length-1);
  }
  if(typeof h$nodeFs !== 'undefined' && h$nodeFs.readFileSync) { // node.js
    return h$fromNodeBuffer(h$nodeFs.readFileSync(path));
  } else if(typeof snarf !== 'undefined') { // SpiderMonkey
    return new h$wrapBuffer(snarf(path, "binary").buffer, false);
  } else {
    var url = h$pathUrl(path);
    var transport = new XMLHttpRequest();
    transport.open("GET", url, false);
    transport.responseType = "arraybuffer";
    transport.send();
    if(transport.status == 200 || transport.status == 0) {
      return h$wrapBuffer(transport.response, false);
    } else {
      return null; // fixme proper error
    }
  }
}

// node buffer to GHCJS buffer
function h$fromNodeBuffer(buf) {
  var l = buf.length;
  var buf2 = new ArrayBuffer(l);
  var u8 = new Uint8Array(buf2);
  for(var i=0;i<l;i++) {
    u8[i] = buf[i];
  }
  return h$wrapBuffer(buf2, false);
}

function h$pathUrl(path) {
  return("://" + path);
}

function h$findFile(path) {
  return h$filesMap[path];
}

function h$isatty(d) {
  TRACE_IO("isatty: " + d);
  return h$fds[d].buf.isATTY?1:0;
}

function h$__hscore_ftruncate(fd, where1, where2) {
    TRACE_IO("ftruncate: " + fd + " " + where1 + " " + where2);
    var where = goog.math.Long.fromBits(where2, where1).toNumber();
    TRACE_IO("truncating file to length: " + where);
    var f = h$fds[fd];
    var buf = f.buf;
    var nfd = buf.fd;
    buf.filePos = 0;
    h$fs.ftruncateSync(nfd, where);
    return 0;
}

function h$__hscore_bufsiz() { return 4096; }
function h$__hscore_seek_set() { return 0; }
function h$__hscore_seek_cur() { return 1; }
function h$__hscore_seek_end() { return 2; }

function h$__hscore_o_binary() { return 0; }
function h$__hscore_o_rdonly() { return 0; }
function h$__hscore_o_wronly() { return 0x0001; }
function h$__hscore_o_rdwr() { return 0x0002; }
function h$__hscore_o_append() { return 0x0008; }
function h$__hscore_o_creat() { return 0x0200; }
function h$__hscore_o_excl() { return 0x0800; }
function h$__hscore_o_trunc() { return 0x0400; }
function h$__hscore_o_noctty() { return 0x20000; }
function h$__hscore_o_nonblock() { return 0x0004; }
function h$__hscore_s_isdir() { return 0; }
function h$__hscore_s_isfifo() { return 0; }
function h$__hscore_s_isblk() { return 0; }
function h$__hscore_s_ischr() { return 0; }
function h$__hscore_s_issock() { return 0; }
function h$__hscore_s_isreg() { return 1; }

// fixme support some actual mode bits?
function h$S_ISDIR(mode) { return 0; }
function h$S_ISFIFO(mode) { return 0; }
function h$S_ISBLK(mode) { return 0; }
function h$S_ISCHR(mode) { return 0; }
function h$S_ISSOCK(mode) { return 0; }
function h$S_ISREG(mode) { return 1; }

function h$getFileSize(nfd) {
    var s = h$fs.fstatSync(nfd);
    return s.size;
}

/*
 partial fstat emulation, only set the size
 */
function h$__hscore_sizeof_stat() { return 4; }
function h$__hscore_fstat(fd, buf, off) {
    var f = h$fds[fd];
    var s = h$fs.fstatSync(f.buf.fd);
    TRACE_IO('__hscore_fstat: ' + fd + ' size: ' + s.size);
    buf.dv.setUint32(off, s.size, true);
    return 0;
}
function h$__hscore_stat(path_d, path_off, buf_d, buf_off) {
  var p = h$decodeUtf8z(path_d, path_off);
  TRACE_IO('__hscore_stat: ' + p);
  buf_d.dv.setUint32(buf_off, 1, true); // fixme
  return 0;
}
function h$__hscore_st_mode(st) { return 0; }
function h$__hscore_st_dev() { return 0; }
function h$__hscore_st_ino() { h$ret1 = 0; return 0; }
function h$__hscore_st_size(st, off) {
    // return 64 bit
    h$ret1 = st.dv.getInt32(off, true);
    return 0;
}


var h$O_RDONLY  = 0;
var h$O_WRONLY  = 1;
var h$O_RDWR    = 2;
var h$O_ACCMODE = 3;
var h$O_CREAT   = 0x200;
var h$O_TRUNC   = 0x400;
var h$O_EXCL    = 0x800;

function h$__hscore_open(filename, filename_off, how, mode) {
    function errorFn(txt) { return function() { throw txt; } }
    var p = h$decodeUtf8z(filename, filename_off);
    TRACE_IO('__hscore_open ' + p + ' ' + how + ' ' + mode);
    var flagStr;
    var read = false, write = false;
    var acc = how & h$O_ACCMODE;
    var excl = (how & h$O_EXCL) ? 'x' : '';
    var off;
    if(acc === h$O_RDONLY) {
        read = true;
        flagStr = 'r' + excl;
        off = 0;
    } else if(acc === h$O_WRONLY) {
        write = true;
        flagStr = (how & h$O_TRUNC ? 'w' : 'a') + excl;
        off = -1;
    } else { // r+w
        off = 0; // -1; // is this ok?
        read = true;
        write = true;
        if(how & h$O_CREAT) {
            flagStr = ((how & h$O_TRUNC) ? 'w' : 'a') + excl + '+';
        } else {
            flagStr = 'r+';
        }
    }
    TRACE_IO("opening file: " + p + " mode: " + flagStr + " read: " + read + " write: " + write + " mode: " + mode);
    try {
        var node_fd = h$fs.openSync(p, flagStr, mode);
        var buf = { fd: node_fd
                    , read: read ? h$readFile : errorFn("file has not been opened for reading")
                    , write: write ? h$writeFile : errorFn("file has not been opened for writing")
                    , filePos: (off === -1) ? h$getFileSize(node_fd) : off
                    , chunk: null
                    , chunkPos: undefined
                    , chunkLen: undefined
                    , inProgress: false
                  };
        var fd = new h$Fd(buf, false, false, false);
        h$fds[fd.fd] = fd;
        return fd.fd;
    } catch(e) {
        h$directory_setErrno(e);
        return -1;
    }
}

function h$readFile(fd, buf, buf_offset, n) {
    TRACE_IO("readFile fd: " + fd.fd + " n: " + n + " buf offset: " + buf_offset);
    var fdbuf = fd.buf;
    var f = fdbuf.fd;
    var u8 = buf.u8;
    // fixme:
    var nbuf = new Buffer(500000000);
    if(!fdbuf.eof && !fdbuf.chunk) {
        TRACE_IO("read sync");
        fdbuf.chunkLen = h$fs.readSync(f, nbuf, 0, 500000000, 0); // fdbuf.filePos) //,  function(err, bytesRead, nbuf2) {
        fdbuf.chunkPos = fdbuf.filePos;
        fdbuf.chunk = nbuf;
    }
    // if(!fdbuf.chunk && !fdbuf.eof) {
    //  fdbuf. 
    // }
    // data available
    if(fdbuf.eof) {
        return 0;
    } if(fdbuf.chunk && fdbuf.chunkPos < fdbuf.chunkLen) {
        var n1 = Math.min(n, fdbuf.chunkLen - fdbuf.chunkPos);
        TRACE_IO("readFile, chunk available (chunkPos: " + fdbuf.chunkPos + " copying bytes: " + n1 + " chunk len: " + fdbuf.chunkLen);
        for(var i=0;i<n1;i++) {
            u8[buf_offset+i] = fdbuf.chunk[fdbuf.chunkPos+i];
        }
        fdbuf.chunkPos += n1;
        if(fdbuf.chunkPos >= fdbuf.chunkLen) { // whole chunk consumed
            TRACE_IO("readFile, whole chunk consumed: " + fdbuf.chunkPos + " " + fdbuf.chunkLen);
            fdbuf.chunk = null;
            fdbuf.chunkPos = undefined; // -1; // fixme
            fdbuf.chunkLen = undefined; // -1; // fixme
            // debug:
            fdbuf.eof = true;
        }
        return n1;
    // no data
    } else {
        throw "unpossible";
        TRACE_IO("readFile, no data available: " + n + " reading from pos: " + fdbuf.filePos);
        var nbuf = new Buffer(100000000); // (n);
        if(fd.eof) {
            TRACE_IO("readFile, eof");
            return 0;
        } else if(fdbuf.inProgress) {
            TRACE_IO("readFile, operation in progress");
            h$errno = CONST_EWOULDBLOCK;
            return -1;
        }
        fd.readReady = false;
        fdbuf.inProgress = true;
        h$fs.read(f, nbuf, 0, 100000000, fdbuf.filePos,  function(err, bytesRead, nbuf2) {
            TRACE_IO("readFile, new chunk read, bytes: " + bytesRead);
            fdbuf.inProgress = false;
            if(bytesRead === 0) {
                fdbuf.eof = true;
                fd.readReady = true;
                h$notifyRead(fd);
            } else {
                TRACE_IO("old file pos: " + fdbuf.filePos + ", bytes read: " + bytesRead);
                fdbuf.filePos += bytesRead;
                fdbuf.chunk = nbuf2;
                fdbuf.chunkPos = 0;
                fdbuf.chunkLen = bytesRead;
                TRACE_IO("new file pos: " + fdbuf.filePos);
                fd.readReady = true;
                h$notifyRead(fd);
            }
        });
        h$errno = CONST_EWOULDBLOCK;
        return -1;
    }
}

function h$writeFile(fd, buf, buf_offset, n) {
    var fdbuf = fd.buf;
    var f = fdbuf.fd;
    if(fdbuf.inProgress) {
        h$errno = CONST_EWOULDBLOCK;
        return -1;
    }
    var nbuf = new Buffer(buf.u8.slice(buf_offset, buf_offset + n));
    fd.writeReady = false;
    fdbuf.inProgress = true;
    h$fs.write(f, nbuf, 0, n, fdbuf.filePos, function() {
        TRACE_IO("writeFile " + fd + " done, written: " + n);
        fdbuf.filePos += n;
        fdbuf.inProgress = false;
        fd.writeReady = true;
        h$notifyWrite(fd);
    });
    return n;
}

    /*    var f = h$findFile(p);
    if(!f) {
      try {
        var d = h$loadFileData(p);
        var file = h$newFile(p,d);
          return h$newFd(file).fd;
      } catch(e) {
          h$errno = CONST_ENOENT;
          return -1;
      }
    } else {
      return h$newFd(f).fd;
    } */

function h$lseek(fd, offset1, offset2, whence) {
    var offset = goog.math.Long.fromBits(offset2,offset1).toNumber();
    TRACE_IO("lseek: " + fd + ", " + offset + ", " + whence);
    var f = h$fds[fd];
    if(!f) {
        h$errno = CONST_EBADF;
        h$ret1 = -1;
        return -1;
    }
    f.buf.chunk = null; // fixme
    var newOff;
    var newOffPending = -1;
    if(whence === 0) { // seek_set
        if(fd.inProgress) {
            newOffPending = offset;
        } else {
            newOff = offset;
        }
//        f.buf.offset = offset;
    } else if(whence === 1) { // seek_cur
        newOff = f.buf.filePos + offset;
//        f.buf.offset += offset // f.pos + offset;
    } else if(whence === 2) { // seek_end
        throw "seek_end not implemented"
        // newOff = f.buf.len + offset;
    } else {
        h$errno = h$EINVAL;
        h$ret1 = -1;
        return -1;
    }
    if(newOff < 0) {
        h$errno = h$EINVAL;
        h$ret1 = -1;
        return -1;
    } else {
        if(newOffPending !== -1) {
            f.buf.filePosPending = newOffPending;
        }
        f.buf.filePos = newOff;
        var no = goog.math.Long.fromNumber(newOff);
        h$ret1 = no.getLowBits();
        return no.getHighBits();
    }
}

/*
function h$lseek(fd, offset1, offset2, whence) {
  var offset = goog.math.Long.fromBits(offset2,offset1).toNumber();
  TRACE_IO("lseek: " + fd + ", " + offset + ", " + whence);
  var f = h$fds[fd];
  if(!f) {
    h$errno = CONST_EBADF;
    return -1;
  }
  var newOff;
  if(whence === 0) { // seek_set
    newOff = offset;
  } else if(whence === 1) { // seek_cur
    newOff = f.pos + offset;
  } else if(whence === 2) { // seek_end
    newOff = f.buf.len + offset;
  } else {
    h$errno = h$EINVAL;
    return -1;
  }
  if(newOff < 0) {
    h$errno = h$EINVAL;
    return -1;
  } else {
    f.pos = newOff;
    var no = goog.math.Long.fromNumber(newOff);
    h$ret1 = no.getLowBits();
    return no.getHighBits();
  }
}
*/

function h$SEEK_SET() { return 0; }
function h$SEEK_CUR() { return 1; }
function h$SEEK_END() { return 2; }

var h$baseZCSystemziPosixziInternalsZClseek = h$lseek;
var h$baseZCSystemziPosixziInternalsZCSEEKzuCUR = h$__hscore_seek_cur;
var h$baseZCSystemziPosixziInternalsZCSEEKzuSET = h$__hscore_seek_set;
var h$baseZCSystemziPosixziInternalsZCSEEKzuEND = h$__hscore_seek_end;
var h$baseZCSystemziPosixziInternalsZCSzuISDIR = h$__hscore_s_isdir;
var h$baseZCSystemziPosixziInternalsZCSzuISFIFO = h$__hscore_s_isfifo;
var h$baseZCSystemziPosixziInternalsZCSzuISSOCK = h$__hscore_s_issock;
var h$baseZCSystemziPosixziInternalsZCSzuISCHR = h$__hscore_s_ischr;
var h$baseZCSystemziPosixziInternalsZCSzuISREG = h$__hscore_s_isreg;
var h$baseZCSystemziPosixziInternalsZCread = h$read;

function h$lockFile(fd, dev, ino, for_writing) {
    TRACE_IO("lockFile:" + fd);
    return 0;
}
function h$unlockFile(fd) {
    TRACE_IO("unlockFile:" + fd);
    return 0;
}
function h$fdReady(fd, write, msecs, isSock) {
  var f = h$fds[fd];
  if(write) {
    if(f.writeReady) {
      return 1;
    } else if(msecs === 0) {
      return 0;
    } else {
      throw "h$fdReady: blocking not implemented";
    }
  } else {
    if(f.readReady) {
      return 1;
    } else if(msecs === 0) {
      return 0;
    } else {
      throw "h$fdReady: blocking not implemented";
    }
  }
}

function h$write(fd, buf, buf_offset, n) {
  TRACE_IO("h$write: fd: " + fd + " (" + n + ")");
  var f = h$fds[fd];
  return f.buf.write(f, buf, buf_offset, n);
}

function h$read(fd, buf, buf_offset, n) {
  TRACE_IO("h$read: fd: " + fd + " (" + n + ")");
  var f = h$fds[fd];
  return f.buf.read(f, buf, buf_offset, n);
}

var h$baseZCSystemziPosixziInternalsZCwrite = h$write;
/*
function h$readFile(fd, buf, buf_offset, n) {
  TRACE_IO("h$readFile: " + n);
  var fbuf = fd.buf.data;
  var pos = fd.pos;
  n = Math.min(n, fd.buf.len - pos);
  for(var i=0;i<n;i++) {
    buf.u8[buf_offset+i] = fbuf.u8[pos+i];
  }
  fd.pos += n;
  TRACE_IO("h$readFile read: " + n);
  return n;
}
*/
// write file just in memory
/*
function h$writeFile(fd, buf, buf_offset, n) {
  TRACE_IO("h$writeFile write: " + n + " old pos: " + fd.pos + " len: " + fd.buf.len);
  if(fd.pos + n > fd.buf.data.len) {
    var od = fd.buf.data;
    var d = h$newByteArray(Math.round(1.3*od.len)+100);
    var u8 = d.u8;
    var u8od = od.u8;
    for(var i=0;i<od.len;i++) {
      u8[i] = u8od[i];
    }
    fd.buf.data = d;
  }
  var offset = buf_offset + fd.pos;
  var bd = fd.buf.data;
  var u8 = bd.u8;
  var u8buf = buf.u8;
  for(var i=0;i<n;i++) {
    u8[offset+i] = u8buf[buf_offset+i];
  }
  fd.pos += n;
  fd.buf.len = Math.max(fd.buf.len, fd.pos);
  return n;
}
*/

