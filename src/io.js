
var h$stdout = { read: function() { throw "can't read from stdout"; }
               , write: h$writeConsole
               };

var h$stdin = { write: function() { throw "can't write to stdin"; }
              , read: function() { throw "unimplemented read: stdin"; }
              };

var h$stderr = { read: function () { throw "can't read from stderr"; }
               , write: h$writeConsole
               };

function h$stdFd(n,readable,writable,buf) { 
  return new h$Fd(buf,readable,writable,n);
}

var h$fdN = 3;
var h$fds = { '0': h$stdFd(0, true, false, h$stdin)
            , '1': h$stdFd(1, false, true, h$stdout)
            , '2': h$stdFd(2, false, true, h$stderr)
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

function h$Fd(buf, readable, writable, n) {
  if(n !== undefined) {
    this.fd = n;
  } else {
    this.fd  = h$fdN++;
  }
  this.pos = 0;
  this.buf = buf;
  this.waitRead = [];
  this.waidWrite = [];
  this.readable = readable;
  this.writable = writable;
}

function h$newFd(file) {
  var fd = new h$Fd(file, true, true);
  h$fds[fd.fd] = fd;
  return fd;
}

function h$newFile(path, data) {
  var f = { path: path
          , data: data
          , read: h$readFile
          , write: h$writeFile
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
  if(typeof h$nodeFs !== 'undefined' && h$nodeFs.readFileSync) { // node.js
    return new DataView(h$nodeFs.readFileSync(path));
  } else if(typeof snarf !== 'undefined') { // SpiderMonkey
    return new DataView(snarf(path, "binary"));
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

function h$pathUrl(path) {
  log("path url: " + path);
  return("://" + path);
}

function h$findFile(path) {
  return h$filesMap[path];
}

function h$isatty(d) {
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

/*
 partial fstat emulation, only set the size
 */
function h$__hscore_sizeof_stat() { return 4; }
function h$__hscore_fstat(fd, buf, off) {
  var f = h$fds[fd]
//  log('__hscore_fstat: (bytelen): ' + f.file.data.byteLength);
  buf.setUint32(off, f.buf.data.byteLength);
  return 0;
}
function h$__hscore_st_mode(st) { return 0; }
function h$__hscore_st_dev() { return 0; }
function h$__hscore_st_ino() { return 0; }
function h$__hscore_st_size(st,off) {
    // return 64 bit
    h$ret1 = st.getUint32(off);
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

function h$baseZCSystemziPosixziInternalsZClseek(fd, offset1, offset2, whence) {
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
    newOff = f.buf.data.byteLength + offset;
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
function h$fdReady(fd, write) {
//  console.log("### fdReady");
  if(write && h$fds[fd].writable) return 1;
  return 0;
};

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

function h$writeConsole(fd, buf, buf_offset, n) {
//  log("###writeConsole: " + n);
  var str = h$decodeUtf8(buf, n, buf_offset);
  if(typeof(process) !== 'undefined' && process && process.stdout) { /* node.js */
    process.stdout.write(str);
  } else if(typeof(putstr) !== 'undefined') { /* SpiderMonkey */
    putstr(str);
  } else if(typeof(console) !== 'undefined') {
    // we print too many newlines here, is it possible to fix that?
    console.log(str);
  }
  return n;
}

function h$readFile(fd, buf, buf_offset, n) {
//  log("h$readFile: " + n);
  var fbuf = fd.buf.data;
  var pos = fd.pos;
  n = Math.min(n, fbuf.byteLength - pos);
  for(var i=0;i<n;i++) {
    buf.setUint8(buf_offset+i, fbuf.getUint8(pos+i));
  }
  fd.pos += n;
//  log("h$readFile read: " + n);
  return n;
}

function h$writeFile(fd, buf, buf_offset, n) {
//  log("h$writeFile write: " + n);
  return n; // fixme
}


