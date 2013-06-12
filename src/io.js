
function h$stdFd(n,readReady,writeReady,buf) {
  return new h$Fd(buf, readReady, writeReady, n);
}

var h$stdinBuf = { write: function() { throw "can't write to stdin"; } };
var h$stdoutBuf = { read: function() { throw "can't read from stdout"; } };
var h$stderrBuf = { read: function () { throw "can't read from stderr"; } };

function h$initStdioBufs() {
  if(typeof process !== 'undefined' && process && process.stdin) { // node.js
    h$stdinBuf.isATTY  = process.stdin.isTTY;
    h$stdoutBuf.isATTY = process.stdout.isTTY;
    h$stderrBuf.isATTY = process.stderr.isTTY;

    // stdin
    h$stdinBuf.chunks = new goog.structs.Queue();
    h$stdinBuf.chunkOff = 0;
    h$stdinBuf.eof = false;
    h$stdinBuf.readReady = false;
    h$stdinBuf.writeReady = false;
    process.stdin.on('data', function(chunk) {
      h$stdinBuf.chunks.enqueue(chunk);
      h$stdin.readReady = true;
      h$notifyRead(h$stdin);
    });
    process.stdin.on('end', function() {
      h$stdinBuf.eof = true;
      h$stdin.readReady = true; // for eof, the fd is ready but read returns 0 bytes
      h$notifyRead(h$stdin);
    });
    h$stdinBuf.read = function(fd, buf, buf_offset, n) {
      if(fd.buf.chunks.getCount() === 0) {
        return 0;
      } else {
        var h = fd.buf.chunks.peek();
        var o = fd.buf.chunkOff;
        var left = h.length - o;
        var u8 = buf.u8;
        if(left < n) {
          for(var i=0;i<n;i++) {
            u8[buf_offset+i] = h[o+i];
          }
          fd.buf.chunkOff += n;
          return n;
        } else {
          for(var i=0;i<left;i++) {
            u8[buf_offset+i] = h[o+i];
          }
          fd.buf.chunkOff = 0;
          fd.buf.chunks.dequeue();
          if(fd.buf.chunks.getCount() === 0 && !fd.buf.eof) {
            h$stdin.readReady = false;
          }
          return left;
        }
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

var h$fdN = 3;
var h$fds = { '0': h$stdin
            , '1': h$stdout
            , '2': h$stderr
            };

var h$filesMap = {}; // new Map(); // path -> file

// fixme remove file from h$filesMap?
function h$close(fd) {
  var f = h$fds[fd];
  if(f) {
    for(var i=0;i<f.waitRead.length;i++) {
      h$throwTo(f.waitRead[i], h$IOException);
    }
    for(var i=0;i<f.waitWrite.length;i++) {
      h$throwTo(f.waitWrite[i], h$IOException);
    }
    delete h$fds[fd];
    return 0;
  } else {
    h$errno = h$EBADF;
    return -1;
  }
}

function h$Fd(buf, readReady, writeReady, isATTY, n) {
  if(n !== undefined) {
    this.fd = n;
  } else {
    this.fd  = h$fdN++;
  }
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
  h$fds[fd.fd] = fd;
  return fd;
}

function h$newFile(path, data) {
  var f = { path: path
          , data: data
          , len: data.byteLength // number of bytes in the file (migh be smaller than data.byteLength later)
          , read: h$readFile
          , write: h$writeFile
          , isATTY: false
          };
  h$filesMap[path] = f;
  return f;
}

// notify threads waiting, call after new data for fd comes in
function h$notifyRead(fd) {
  var a = fd.waitRead;
  for(var i=0;i<a.length;i++) {
    h$wakeupThread(a[i]);
  }
  a.length = 0;
}

// notify threads waiting, call when we can write more
function h$notifyWrite(fd) {
  var a = fd.waitWrite;
  for(var i=0;i<a.length;i++) {
    h$wakupThread(a[i]);
  }
  fd.waitRead.length = 0;
}

function h$readFile() {

}

// use the system specific way to load the file (either AJAX or directly)
// return a DataView with the contents
function h$loadFileData(path) {
  if(path.charCodeAt(path.length-1) === 0) {
    path = path.substring(0,path.length-1);
  }
  if(typeof h$nodeFs !== 'undefined' && h$nodeFs.readFileSync) { // node.js
    return h$fromNodeBuffer(h$nodeFs.readFileSync(path));
  } else if(typeof snarf !== 'undefined') { // SpiderMonkey
    return new DataView(snarf(path, "binary").buffer);
  } else {
    var url = h$pathUrl(path);
    var transport = new XMLHttpRequest();
    transport.open("GET", url, false);
    transport.responseType = "arraybuffer";
    transport.send();
    if(transport.status == 200 || transport.status == 0) {
      return new DataView(transport.response);
    } else {
      return null; // fixme proper error
    }
  }
}

// node buffer to DataView
function h$fromNodeBuffer(buf) {
  var l = buf.length;
  var buf2 = new ArrayBuffer(l);
  var u8 = new Uint8Array(buf2);
  for(var i=0;i<l;i++) {
    u8[i] = buf[i];
  }
  return new DataView(buf2);
}

function h$pathUrl(path) {
  log("path url: " + path);
  return("://" + path);
}

function h$findFile(path) {
  return h$filesMap[path];
}

function h$isatty(d) {
  return h$fds[d].buf.isATTY?1:0;
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

/*
 partial fstat emulation, only set the size
 */
function h$__hscore_sizeof_stat() { return 4; }
function h$__hscore_fstat(fd, buf, off) {
  var f = h$fds[fd]
//  log('__hscore_fstat: (bytelen): ' + f.file.data.byteLength);
  buf.setUint32(off, f.buf.len);
  return 0;
}
function h$__hscore_st_mode(st) { return 0; }
function h$__hscore_st_dev() { return 0; }
function h$__hscore_st_ino() { return 0; }
function h$__hscore_st_size(st,off) {
    // return 64 bit
    h$ret1 = st.dv.getInt32(off, true);
    return 0;
}

function h$__hscore_open(filename, filename_off, h, mode) {
    var p = h$decodeUtf8(filename, filename_off);
//    log('__hscore_open '+p);
    var f = h$findFile(p);
    if(!f) {
      var d = h$loadFileData(p);
      var file = h$newFile(p,d);
      return h$newFd(file).fd;
    } else {
      return h$newFd(f).fd;
    }
}

function h$lseek(fd, offset1, offset2, whence) {
  var offset = goog.math.Long.fromBits(offset2,offset1).toNumber();
//  log("### lseek: " + fd + ", " + offset + ", " + whence);
  var f = h$fds[fd];
  if(!f) {
    h$errno = h$EBADF;
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
//    log("### lockFile");
    return 0;
}
function h$unlockFile(fd) {
//    log("### unlockFile");
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
//  log("h$write: fd: " + fd + " (" + n + ")");
  var f = h$fds[fd];
  return f.buf.write(f, buf, buf_offset, n);
}

function h$read(fd, buf, buf_offset, n) {
//  log("h$read: fd: " + fd + " (" + n + ")");
  var f = h$fds[fd];
  return f.buf.read(f, buf, buf_offset, n);
}

var h$baseZCSystemziPosixziInternalsZCwrite = h$write;

function h$readFile(fd, buf, buf_offset, n) {
//  log("h$readFile: " + n);
  var fbuf = fd.buf.data;
  var pos = fd.pos;
  n = Math.min(n, fd.buf.len - pos);
  for(var i=0;i<n;i++) {
    buf.u8[buf_offset+i] = fbuf.u8[pos+i];
  }
  fd.pos += n;
//  log("h$readFile read: " + n);
  return n;
}

// write file just in memory
function h$writeFile(fd, buf, buf_offset, n) {
//  log("h$writeFile write: " + n + " old pos: " + fd.pos + " len: " + fd.buf.len);
  if(fd.pos + n >= fd.buf.data.len) {
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


