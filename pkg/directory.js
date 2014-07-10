//#define GHCJS_NODE 1
//#ifdef GHCJS_NODE
// only works on node.js

#include "HsBaseConfig.h"

#ifdef GHCJS_TRACE_DIRECTORY
function h$logDirectory() { h$log.apply(h$log,arguments); }
#define TRACE_DIRECTORY(args...) h$logDirectory(args)
#else
#define TRACE_DIRECTORY(args...)
#endif

if(typeof module !== 'undefined' && module.exports) {
    var h$fs      = require('fs');
    var h$path    = require('path');
    var h$os      = require('os');
    var h$process = process;
}

// get/set permissions for file
// set errno and return -1 on error
// masks: 1 - read
//        2 - write
//        4 - exe
//        8 - search
function h$directory_getPermissions(file, c) {
  TRACE_DIRECTORY("getPermissions: " + file);
  h$fs.stat(file, function(err, fs) {
    if(err) {
      h$handleErrnoC(err, -1, 0, c);
    } else {
      var m = fs.mode;
      var r = (m&4) || (m&32) || (m&256);
      var w = (m&2) || (m&16) || (m&128);
      var x = (m&1) || (m&8)  || (m&64);
      var exe    = x; // fixme?
      var search = x; // fixme?
      if(h$process.platform == 'win32') exe = true;
      c((r?1:0)|(w?2:0)|(exe?4:0)|(search?8:0));
    }
  });
}

function h$directory_setPermissions(file, perms, c) {
  TRACE_DIRECTORY("setPermissions: " + file + " " + perms);
  h$fs.stat(file, function(err, fs) {
    if(err) {
      h$handleErrnoC(err, -1, 0, c);
    } else {
      var r = perms & 1;
      var w = perms & 2;
      var x = perms & 4;
      var search = perms & 8;
      var m  = fs.mode;
      m = r ? (m | 292) : (m & ~292);
      m = w ? (m | 146) : (m & ~146);
      m = (x || search) ? (m | 73) : (m & ~73);
      h$fs.chmod(file, function(err) {
        h$handleErrnoC(err, -1, 0, c);
      });
    }
  });
}

function h$directory_copyPermissions(file1, file2, c) {
  TRACE_DIRECTORY("copyPermissions: " + file1 + " " + file2);
  h$fs.stat(file1, function(err1, fs) {
    if(err) {
      h$handleErrnoC(err1, -1, 0, c);
    } else {
      h$fs.chmod(file2, fs.mode, function(err2) {
        h$handleErrnoC(err2, -1, 0, c);
      });
    }
  });
}


function h$directory_createDirectory(dir, c) {
  TRACE_DIRECTORY("createDirectory: " + dir);
  h$fs.mkdir(dir, function(err) {
    h$handleErrnoC(err,-1,0,c);
  });
}

function h$directory_removeDirectory(dir, c) {
  TRACE_DIRECTORY("removeDirectory: " + dir);
  h$fs.rmdir(dir, function(err) {
    h$handleErrnoC(err,-1,0,c);
  });
}

function h$directory_removeFile(file, c) {
  TRACE_DIRECTORY("removeFile: " + file);
  h$fs.unlink(file, function(err) {
    h$handleErrnoC(err,-1,0,c);
  });
}

function h$directory_renameDirectory(dir1, dir2, c) {
  TRACE_DIRECTORY("renameDirectory: " + dir1 + " " + dir2);
  h$fs.rename(dir1, dir2, function(err) {
    h$handleErrnoC(err,-1,0,c);
  });
}

function h$directory_renameFile(file1, file2, c) {
  TRACE_DIRECTORY("renameFile: " + file1 + " " + file2);
  h$fs.rename(file1, file2, function(err) {
    h$handleErrnoC(err,-1,0,c);
  });
}

function h$directory_canonicalizePath(path) {
  TRACE_DIRECTORY("canonicalizePath: " + path);
  return h$path.normalize(path);
}

function h$directory_findExecutables(name, c) {
  TRACE_DIRECTORY("findExecutables: " + name);
  var result = [];
  var pathSep = h$process.platform === 'win32'?';':':';
  var parts   = h$process.env.PATH.split(pathSep);
  var exts    = []; // h$process.platform === 'win32'?h$process.env.PATHEXT.split(pathSep):[];
  exts.push(null);
  files = [];
  result = [];
  for(var i=0;i<parts.length;i++) {
    for(var j=0;j<exts.length;j++) {
      files.push(parts[i] + h$path.sep + name + (exts[j]?(exts[j]):""));
    }
  }
  var tryFile = function(n) {
    if(n >= files.length) {
      c(result);
    } else {
      TRACE_DIRECTORY("trying: " + files[n]);
      h$fs.stat(files[n], function(err, fs) {
        if(!err && ((fs.mode & 73) || h$process.platform === 'win32')) result.push(files[n]);
        tryFile(n+1);
      });
    }
  }
  tryFile(0);
}

function h$directory_getDirectoryContents(dir,c) {
  TRACE_DIRECTORY("getDirectoryContents: " + dir);
  h$fs.readdir(dir, function(err, d) {
    h$handleErrnoC(err, null, d, c);
  });
}

function h$directory_getCurrentDirectory() {
  TRACE_DIRECTORY("getCurrentDirectory");
  return h$handleErrno(null, function() {
    return h$process.cwd();
  });
}

function h$directory_setCurrentDirectory(dir) {
  TRACE_DIRECTORY("setCurrentDirectory: " + dir);
  return h$handleErrnoR(-1, 0, function() {
    return h$process.chdir(dir);
  });
}

function h$directory_getHomeDirectory(dir) {
  TRACE_DIRECTORY("getHomeDirectory: " + dir);
  return h$process.env.HOME ||
         h$process.env.HOMEPATH ||
         h$process.env.USERPROFILE;
}

function h$directory_getAppUserDataDirectory(appName) {
    TRACE_DIRECTORY("getAppUserDataDirectory: " + appName);
    if(process.env.APPDATA)
        return h$process.env.APPDATA + h$path.sep + appName;
    if(process.env.HOME)
        return h$process.env.HOME + h$path.sep + "." + appName;
    TRACE_DIRECTORY("getAppUserDataDirectory fallback");
    return "/";
}

function h$directory_getTemporaryDirectory() {
  TRACE_DIRECTORY("getTemporaryDirectory");
  return h$handleErrno(null, function() {
    return h$os.tmpdir();
  });
}

function h$directory_exeExtension() {
  TRACE_DIRECTORY("exeExtension");
  return (h$os.platform() === 'windows') ? 'exe' : '';
}

function h$directory_getFileStatus(file, c) {
  TRACE_DIRECTORY("getFileStatus: " + file);
  h$fs.stat(file, function(err, s) {
    h$handleErrnoC(err, null, s, c);
  });
}

function h$directory_getFileOrSymlinkStatus(file, c) {
    TRACE_DIRECTORY("getFileOrSymlinkStatus: " + file);
    h$fs.lstat(file, function(err, s) {
        h$handleErrnoC(err, null, s, c);
    });
}

function h$directory_getFileStatusModificationTime(fs) {
    TRACE_DIRECTORY("getFileStatusModificationTime: " + fs.mtime.getTime());
    return fs.mtime.getTime();
}

function h$directory_getFileStatusIsDirectory(fs) {
  TRACE_DIRECTORY("getFileStatusIsDirectory: " + fs + " " + fs.isDirectory());
  return fs.isDirectory();
}

// fixme this doesn't really belong here
function h$chmod(path_d, path_o, m) {
    var path = h$decodeUtf8z(path_d, path_o);
    TRACE_DIRECTORY("chmod: " + path + " mode: " + m);
    h$fs.chmodSync(path, m);
    return 0;
}

//#endif

