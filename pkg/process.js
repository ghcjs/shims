// #ifdef GHCJS_NODE
// only works on node.js

#ifdef GHCJS_TRACE_PROCESS
function h$logProcess() { h$log.apply(h$log,arguments); }
#define TRACE_PROCESS(args...) h$logProcess(args)
#else
#define TRACE_PROCESS(args...)
#endif

if(typeof module !== 'undefined' && module.exports) {
    var h$child = require('child_process');
}

// one-dir pipe
function h$pipeFd(pipe, write) {
  var buf = { pipe: pipe
            };
  var fd = new h$Fd(buf, false, write, false);
  h$fds[fd.fd] = fd;
  TRACE_PROCESS("pipe " + fd.fd + " opened, writable: " + write);
  if(write) {
    buf.read = function() {
      throw "cannot read from write pipe";
    };
    buf.close = function() { pipe.end(); };
    buf.write = function(fd, buf, buf_offset, n)  {
      TRACE_PROCESS("pipe " + fd.fd + " write: " + n);
      if(!fd.writeReady) {
        h$errno = CONST_EWOULDBLOCK;
        return -1;
      }
      fd.writeReady = false;
      var u8 = buf.u8;
      var nbuf = new Buffer(n);
      // can this be made more efficient?
      for(var k=0;k<n;k++) {
        nbuf[k] = u8[buf_offset+k];
      }
      pipe.write(nbuf, function() {
        fd.writeReady = true;
        h$notifyWrite(fd);
      });
      return n;
    };
  } else {
    buf.blocksReady = false;
    buf.chunks = new h$Queue();
    buf.chunkOff = 0;
    buf.eof = false;
    buf.eofPending = false;
    buf.close = function() { /* pipe.close(); */ };
    pipe.on('readable', function() {
      TRACE_PROCESS("pipe " + fd.fd + " readable");
      var ch = pipe.read();
      if(ch) buf.chunks.enqueue(ch);
      fd.readReady = true;
//      buf.blocksReady = true;
      h$notifyRead(fd);
    });
    pipe.on('end', function() {
      TRACE_PROCESS("pipe " + fd.fd + " eof");
      buf.eofPending = true;
      fd.readReady = true;
      h$notifyRead(fd);
    });
    buf.write = function() {
      throw "cannot write to read pipe";
    };
    buf.read = function(fd, buf, buf_offset, n) {
      TRACE_PROCESS("pipe " + fd.fd + " read: " + n + " (" + fd.fd + ") " + fd.readReady + " " + fd.buf.chunks.isEmpty());
      if(fd.buf.chunks.length() === 0) {
        TRACE_PROCESS("pipe " + fd.fd + " adding chunk to buffer " + fd.fd);
        var ch = pipe.read();
        if(ch) {
          do {
            fd.buf.chunks.enqueue(ch);
          } while((ch = pipe.read()) !== null);
          fd.buf.blocksReady = false;
        } else {
          TRACE_PROCESS("pipe " + fd.fd + " WARNING returning zero bytes, eof status: " + fd.buf.eof);
          if(fd.buf.eofPending) fd.buf.eof = true;
            fd.buf.readReady = false;
            if(fd.buf.eof) {
                return 0;
            } else {
                h$errno = CONST_EAGAIN;
                return -1;
            }
        }
      }
      TRACE_PROCESS("pipe " + fd.fd + " chunks available: " + fd.buf.chunks.length());
      var h = fd.buf.chunks.peek();
      var o = fd.buf.chunkOff;
      var left = h.length - o;
      var u8 = buf.u8;
      TRACE_PROCESS("pipe " + fd.fd + " reading " + h.length + " " + o);
      if(left > n) {
        for(var i=0;i<n;i++) {
          u8[buf_offset+i] = h[o+i];
        }
        fd.buf.chunkOff += n;
        TRACE_PROCESS("pipe " + fd.fd + " read " + n + " bytes");
        return n;
      } else {
        for(var i=0;i<left;i++) {
          u8[buf_offset+i] = h[o+i];
        }
        fd.buf.chunkOff = 0;
        fd.buf.chunks.dequeue();
        TRACE_PROCESS("pipe " + fd.fd + " chunk count: " + (fd.buf.chunks.length() === 0) + " eof: " + fd.buf.eof + " blocksReady: " + fd.buf.blocksReady);
        if(fd.buf.chunks.length() === 0 && !fd.buf.blocksReady) {
          if(!fd.buf.eof && !fd.buf.eofPending) {
            TRACE_PROCESS("pipe " + fd.fd + " read, end of input reached");
            fd.readReady = false;
          } else {
            TRACE_PROCESS("pipe " + fd.fd + " read, eof reached");
            if(fd.buf.eofPending) fd.buf.eof = true;
          }
        }
        TRACE_PROCESS("pipe " + fd.fd + " read " + left + " bytes (remainder of chunk)");
        return left;
      }
    };
  }
  TRACE_PROCESS("created pipe, fd: " + fd.fd);
  return fd;
}

function h$process_runInteractiveProcess( cmd, args, workingDir, env
                                        , stdin_fd, stdout_fd, stderr_fd
                                        , closeHandles, createGroup, delegateCtlC) {
  TRACE_PROCESS("runInteractiveProcess");
  TRACE_PROCESS("cmd: " + cmd + " args: " + args);
  TRACE_PROCESS("workingDir: " + workingDir + " env: " + env);
  TRACE_PROCESS("stdin: " + stdin_fd + " stdout: " + stdout_fd + " stderr: " + stderr_fd);

  var stdin_p, stdout_p, stderr_p;

  if(stdin_fd === -1) {
    stdin_p = 'pipe';
  } else if(stdin_fd === 0) {
    stdin_p = process.stdin;
  } else {
    throw "runInteractiveProcess: custom stdin unsupported";
  }

  if(stdout_fd === -1) {
    stdout_p = 'pipe';
  } else if(stdout_fd === 1) {
    stdout_p = process.stdout;
  } else {
    throw "runInteractiveProcess: custom stdout unsupported";
  }

  if(stderr_fd === -1) {
    stderr_p = 'pipe'
  } else if(stderr_fd === 2) {
    stderr_p = process.stderr;
  } else {
    throw "runInteractiveProcess: custom stderr unsupported";
  }

  var options = { detached: createGroup
                , stdio: [stdin_p, stdout_p, stderr_p]
                };
  if(workingDir !== null) options.cwd = workingDir;
  if(env !== null) {
    var envObj = {};
    for(var i=0;i<env.length;i+=2) envObj[env[i]] = env[i+1];
    if(process.env.GHCJS_BOOTING) envObj.GHCJS_BOOTING=1;
    if(process.env.GHCJS_BOOTING1) envObj.GHCJS_BOOTING1=1;
    TRACE_PROCESS("environment: " + h$collectProps(envObj));
    options.env = envObj;
  }

  var procObj;
  var child = h$child.spawn(cmd, args, options);
  child.on('exit', function(code, sig) {
    TRACE_PROCESS("process finished: " + code + " " + sig);
    procObj.exit = code;
    for(var i=0;i<procObj.waiters.length;i++) {
      procObj.waiters[i](code);
    }
  });

  // fixme this leaks
  procObj = { pid: h$nProc
            , fds: [ stdin_fd  === -1 ? h$pipeFd(child.stdin, true).fd   : 0
                   , stdout_fd === -1 ? h$pipeFd(child.stdout, false).fd : 1
                   , stderr_fd === -1 ? h$pipeFd(child.stderr, false).fd : 2
                   ]
            , exit: null
            , waiters : []
            , child: child
            };

  h$procs[h$nProc++] = procObj;

  return procObj;
}

var h$nProc = 1;
var h$procs = [];


// return the thing to run as an array, first element the process, rest the args
// null if no interpreter can be found
function h$process_commandToProcess(cmd, args) {
  TRACE_PROCESS("commandToProcess: " + cmd + " " + args);
  if(process.platform === 'win32') {
    if(args === null) { // shellcmd
      var com = h$process.env.COMSPEC;
      if(!com) {
        com = h$directory_findExecutables("cmd.exe");
        if(com.length) {
          com = cmd[0];
        } else {
          com = h$directory_findExecutables("command.com");
          if(!com.length) return null;
          com = com[0];
        }
      }
      // fixme need to escape stuff
      return [com, com + " /c " + args];
    } else {
       // fixme need to escape stuff
       var r = [cmd];
       r.push(args);
       return r;
    }
  } else {  // non-windows
    if(args === null) { // shellcmd
      return ["/bin/sh", "-c", cmd];
    } else {
       var r = [cmd];
       r.push(args);
       return r;
    }
  }
}

function h$process_terminateProcess(pid) {
  TRACE_PROCESS("terminateProcess: " + pid);
  var p = h$procs[pid];
  p.child.kill();
  return 0; // fixme error status?
}

function h$process_getProcessExitCode(pid, code_d, code_o) {
  TRACE_PROCESS("getProcessExitCode: " + pid);
  var p = h$procs[pid];
  if(p.exit === null) return 0;
  code_d.i3[code_o] = p.exit;
  return 1;
}

function h$process_waitForProcess(pid, code_d, code_o, c) {
  TRACE_PROCESS("waitForProcess: " + pid);
  var p = h$procs[pid];
  if(p.exit !== null) {
    h$process_getProcessExitCode(pid, code_d, code_o);
    c(0);
  } else {
    p.waiters.push(c);
  }
}

// #endif // GHCJS_NODE
