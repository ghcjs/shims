
var h$stdout = { writable: true
               , readable: false
               , write: h$writeConsole
               };

var h$stdin = { writable: false
              , readable: true
              , read: function() { throw "unimplemented read: stdin"; }
              };

var h$stderr = { writable: true
               , readable: false
               , write: h$writeConsole
               };

function h$stdFd(n,file) { return { pos: 0, file: file, fd: n }; }

var h$fdN = 3;
var h$fds = { '0': h$stdFd(0,h$stdin), '1': h$stdFd(1,h$stdout), '2': h$stdFd(2,h$stderr) };
var h$filesMap = {}; // new Map(); // path -> file

// fixme remove file from h$filesMap?
function h$close(fd) {
  delete h$fds[fd];
}

function h$newFd(file) {
  var n = h$fdN++;
  var fd = { fd: n, pos: 0, file: file };
  h$fds[n] = fd;
  return fd;
}

function h$newFile(path, data) {
  var f = { path: path
          , data: data
          , writable: true
          , readable: true
          , read: h$readFile
          , write: h$writeFile
          };
  h$filesMap[path] = f;
  return f;
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

function isatty(d) {
  return 0;
}

function __hscore_bufsiz() { return 4096; }
function __hscore_seek_cur() { return 1; }
function __hscore_seek_set() { return 0; }
function __hscore_seek_end() { return 2; }

function __hscore_o_binary() { return 0; }
function __hscore_o_rdonly() { return 0; }
function __hscore_o_wronly() { return 0x0001; }
function __hscore_o_rdwr() { return 0x0002; }
function __hscore_o_append() { return 0x0008; }
function __hscore_o_creat() { return 0x0200; }
function __hscore_o_excl() { return 0x0800; }
function __hscore_o_trunc() { return 0x0400; }
function __hscore_o_noctty() { return 0x20000; }
function __hscore_o_nonblock() { return 0x0004; }
function __hscore_sizeof_stat() { return 4; }
function __hscore_s_isdir() { return 0; }
function __hscore_s_isfifo() { return 0; }
function __hscore_s_isblk() { return 0; }
function __hscore_s_ischr() { return 0; }
function __hscore_s_issock() { return 0; }
function __hscore_s_isreg() { return 1; }

function __hscore_fstat(fd, buf) { return 0; }
function __hscore_st_mode(st) { return 0; }
function __hscore_st_dev() { return 0; }
function __hscore_st_ino() { return 0; }

function __hscore_open(filename, filename_off, h, mode) {
    var p = decodeUtf8(filename, filename_off);
    log('__hscore_open '+p);
    var f = h$findFile(p);
    if(!f) {
      var d = h$loadFileData(p);
      var file = h$newFile(p,d);
      return h$newFd(file).fd;
    } else {
      return h$newFd(f).fd;
    }
}

var baseZCSystemziPosixziInternalsZCSzuISDIR = __hscore_s_isdir;
var baseZCSystemziPosixziInternalsZCSzuISFIFO = __hscore_s_isfifo;
var baseZCSystemziPosixziInternalsZCSzuISSOCK = __hscore_s_issock;
var baseZCSystemziPosixziInternalsZCSzuISCHR = __hscore_s_ischr;
var baseZCSystemziPosixziInternalsZCSzuISREG = __hscore_s_isreg;
var baseZCSystemziPosixziInternalsZCread = h$read;

function lockFile(fd, dev, ino, for_writing) {
    log("### lockFile");
    return 0;
}
function unlockFile(fd) {
    log("### unlockFile");
    return 0;
}
function fdReady(fd, write) {
//  console.log("### fdReady");
  if(write && h$fds[fd].file.writable) return 1;
  return 0;
};

function h$write(fd, buf, buf_offset, n) {
//  log("h$write: fd: " + fd + " (" + n + ")");
  var f = h$fds[fd];
  return f.file.write(f, buf, buf_offset, n);
}

function h$read(fd, buf, buf_offset, n) {
  log("h$read: fd: " + fd + " (" + n + ")");
  var f = h$fds[fd];
  return f.file.read(f, buf, buf_offset, n);
}

var baseZCSystemziPosixziInternalsZCwrite = h$write;
function h$writeConsole(fd, buf, buf_offset, n) {
//  log("###writeConsole: " + n);
  var str = decodeUtf8(buf, n, buf_offset);
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
  log("h$readFile: " + n);
  var fbuf = fd.file.data;
  var pos = fd.pos;
  n = Math.min(n, fbuf.byteLength - pos);
  for(var i=0;i<n;i++) {
    buf.setUint8(buf_offset+i, fbuf.getUint8(pos+i));
  }
  fd.pos += n;
  log("h$readFile read: " + n);
  return n;
}

function h$writeFile(fd, buf, buf_offset, n) {
  log("h$writeFile write: " + n);
  return n; // fixme
}



