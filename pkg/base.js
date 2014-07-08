#include "HsBaseConfig.h"

// #define GHCJS_TRACE_IO 1

#ifdef GHCJS_TRACE_IO
function h$logIO() { h$log.apply(h$log, arguments); }
#define TRACE_IO(args...) h$logIO(args)
#else
#define TRACE_IO(args...)
#endif

if(typeof module !== 'undefined' && module.exports) {
  var h$fs = require('fs');
}

function h$base_access(file, file_off, mode, c) {
    TRACE_IO("base_access");
    h$fs.stat(fd, function(err, fs) {
        if(err) {
            h$handleErrnoC(err, -1, 0, c);
        } else {
            c(mode & fs.mode); // fixme is this ok?
        }
    });
}

function h$base_chmod(file, file_off, mode, c) {
    TRACE_IO("base_chmod");
    h$fs.chmod(h$decodeUtf8z(file, file_off), mode, function(err) {
        h$handleErrnoC(err, -1, 0, c);
    });
}

function h$base_close(fd, c) {
    TRACE_IO("base_close");
    var fdo = h$base_fds[fd];
    if(fdo && fdo.close) {
        fdo.close(fd, fdo, c);
    } else {
        h$errno = CONST_EINVAL;
        c(-1);
    }
}

function h$base_dup(fd, something, c) {
    throw "h$base_dup";
}

function h$base_dup2(fd, c) {
    throw "h$base_dup2";
}

function h$base_fstat(fd, stat, stat_off, c) {
    TRACE_IO("base_stat");
    h$fs.fstat(fd, function(err, fs) {
        if(err) {
            h$handlErrnoC(err, -1, 0, c);
        } else {
            c(h$base_fillStat(fs), 0);
        }
    });
}

function h$base_isatty(fd, c) { // fixme remove c
    TRACE_IO("base_isatty " + fd);
    if(typeof process !== 'undefined') {
        if(fd === 0) return process.stdin.isTTY?1:0;
        if(fd === 1) return process.stdout.isTTY?1:0;
        if(fd === 2) return process.stderr.isTTY?1:0;
    }
    return 0;
}

function h$base_lseek(fd, pos_1, pos_2, whence, c) {
    TRACE_IO("base_lseek");
    var p = goog.math.Long.fromBits(pos_2, pos_1), p1;
    var o = h$base_fds[fd];
    if(!o) {
        h$errno = CONST_BADF;
        c(-1,-1);
    } else {
        switch(whence) {
        case 0: /* SET */
            o.pos = p.toNumber();
            c(p.getHighBits(), p.getLowBits());
            break;
        case 1: /* CUR */
            o.pos += p.toNumber();
            p1 = goog.math.Long.fromNumber(o.pos);
            c(p1.getHighBits(), p1.getLowBits());
            break;
        case 2: /* END */
            h$fs.stat(fd, function(err, fs) {
                if(err) {
                    h$setErrno(err);
                    c(-1,-1);
                } else {
                    o.pos = fs.size + p.toNumber();
                    p1 = goog.math.Long.fromNumber(o.pos);
                    c(p1.getHighBits(), p1.getLowBits());
                }
            });
            break;
        default:
            h$errno = CONST_EINVAL;
            c(-1,-1);
        }
    }
}
function h$base_lstat(file, file_off, stat, stat_off, c) {
    TRACE_IO("base_lstat");
    h$fs.lstat(h$decodeUtf8z(file, file_off), function(err, fs) {
        if(err) {
            h$handleErrnoC(err, -1, 0, c);
        } else {
            c(h$base_fillStat(fs), 0);
        }
    });
}
function h$base_open(file, file_off, how, mode, c) {
    var flagStr, off;
    var fp   = h$decodeUtf8z(file, file_off);
    TRACE_IO("base_open: " + fp);
    var acc  = how & h$base_o_accmode;
    var excl = (how & h$base_o_excl) ? 'x' : '';
    if(acc === h$base_o_rdonly) {
        read    = true;
        flagStr = 'r' + excl;
        off     = 0;
    } else if(acc === h$base_o_wronly) {
        write   = true;
        flagStr = (how & h$base_o_trunc ? 'w' : 'a') + excl;
        off     = -1;
    } else { // r+w
        off   = 0; // -1; // is this ok?
        read  = true;
        write = true;
        if(how & h$base_o_creat) {
            flagStr = ((how & h$base_o_trunc) ? 'w' : 'a') + excl + '+';
        } else {
            flagStr = 'r+';
        }
    }
    h$fs.open(fp, flagStr, mode, function(err, fd) {
        if(err) {
            h$handleErrnoC(err, -1, 0, c);
        } else {
            var f = function(p) {
                h$base_fds[fd] = { read:  h$base_readFile
                                 , write: h$base_writeFile
                                 , close: h$base_closeFile
                                 , pos:   p
                                 };
                c(fd);
            }
            if(off === -1) {
                h$fs.stat(fp, function(err, fs) {
                    if(err) h$handleErrnoC(err, -1, 0, c); else f(fs.size);
                });
            } else {
                f(0);
            }
        }
    });
}
function h$base_read(fd, buf, buf_off, n, c) {
    TRACE_IO("base_read: " + fd);
    var fdo = h$base_fds[fd];
    if(fdo && fdo.read) {
        fdo.read(fd, fdo, buf, buf_off, n, c);
    } else {
        h$errno = CONST_EINVAL;
        c(-1);
    }
}
function h$base_stat(file, file_off, stat, stat_off, c) {
    TRACE_IO("base_stat");
    h$fs.stat(h$decodeUtf8z(file, file_off), function(err, fs) {
        if(err) {
            h$handlErrnoC(err, -1, 0, c);
        } else {
            c(h$base_fillStat(fs), 0);
        }
    });
}
function h$base_umask(mode) {
    TRACE_IO("base_umask: " + mode);
    return process.umask(mode);
}
function h$base_write(fd, buf, buf_off, n, c) {
    TRACE_IO("base_write: " + fd);
    var fdo = h$base_fds[fd];
    if(fdo && fdo.write) {
        fdo.write(fd, fdo, buf, buf_off, n, c);
    } else {
        h$errno = CONST_EINVAL;
        c(-1);
    }
}
function h$base_ftruncate(fd, pos_1, pos_2, c) {
    TRACE_IO("base_ftruncate");
    h$fs.ftruncate(fd, goog.math.Long.fromBits(pos_2, pos_1).toNumber(), function(err) {
        h$handleErrnoC(err, -1, 0, c);
    });
}
function h$base_unlink(file, file_off, c) {
    TRACE_IO("base_unlink");
    h$fs.unlink(h$decodeUtf8z(file, file_off), function(err) {
        h$handleErrnoC(err, -1, 0, c);
    });
}
function h$base_getpid() {
    TRACE_IO("base_getpid");
    return process.pid;
}
function h$base_link(file1, file1_off, file2, file2_off, c) {
    TRACE_IO("base_link");
    h$fs.link(h$decodeUtf8z(file1, file1_off), h$decodeUtf8z(file2, file2_off), function(err) {
        h$handleErrnoC(err, -1, 0, c);
    });
}
function h$base_mkfifo(file, file_off, mode, c) {
    throw "h$base_mkfifo";
}
function h$base_sigemptyset(sigset, sigset_off) {
    return 0;
    // throw "h$base_sigemptyset";
}
function h$base_sigaddset(sigset, sigset_off, sig) {
    return 0;
    // throw "h$base_sigaddset";
}
function h$base_sigprocmask(sig, sigset1, sigset1_off, sigset2, sigset2_off) {
    return 0;
    // throw "h$base_sigprocmask";
}
function h$base_tcgetattr(attr, termios, termios_off) {
    return 0;
}
function h$base_tcsetattr(attr, val, termios, termios_off) {
    return 0;
}
function h$base_utime(file, file_off, timbuf, timbuf_off, c) {
    TRACE_IO("base_utime");
    h$fs.fstat(h$decodeUtf8z(file, file_off), function(err, fs) {
        if(err) {
            h$handleErrnoC(err, 0, -1, c); // fixme
        } else {
            var atime = goog.math.Long.fromNumber(fs.atime.getTime());
            var mtime = goog.math.Long.fromNumber(fs.mtime.getTime());
            var ctime = goog.math.Long.fromNumber(fs.ctime.getTime());
            timbuf.i3[0] = atime.getHighBits();
            timbuf.i3[1] = atime.getLowBits();
            timbuf.i3[2] = mtime.getHighBits();
            timbuf.i3[3] = mtime.getLowBits();
            timbuf.i3[4] = ctime.getHighBits();
            timbuf.i3[5] = ctime.getLowBits();
            c(0);
        }
    });
}
function h$base_waitpid(pid, stat, stat_off, options, c) {
    throw "h$base_waitpid";
}
var h$base_o_rdonly   = 0x00000;
var h$base_o_wronly   = 0x00001;
var h$base_o_rdwr     = 0x00002;
var h$base_o_accmode  = 0x00003;    
var h$base_o_append   = 0x00008;
var h$base_o_creat    = 0x00200;
var h$base_o_trunc    = 0x00400;
var h$base_o_excl     = 0x00800;
var h$base_o_noctty   = 0x20000;
var h$base_o_nonblock = 0x00004;
var h$base_o_binary   = 0x00000;

function h$base_c_s_isreg(mode) {
    return 1;
}
function h$base_c_s_ischr(mode) {
    return 0;
}
function h$base_c_s_isblk(mode) {
    return 0;
}
function h$base_c_s_isdir(mode) {
    return 0; // fixme
}
function h$base_c_s_isfifo(mode) {
    return 0;
}

function h$base_fillStat(fs) {
    b = h$newByteArray(h$base_sizeof_stat);
    b.i3[0] = fs.mode;
    var s = goog.math.Long.fromNumber(fs.size);
    b.i3[1] = s.getHighBits();
    b.i3[2] = s.getLowBits();
    b.i3[3] = 0; // fixme
    b.i3[4] = 0; // fixme
    b.i3[5] = fs.dev;
    b.i3[6] = fs.ino;
    b.i3[7] = fs.uid;
    b.i3[8] = fs.gid;
}
// [mode,size1,size2,mtime1,mtime2,dev,ino,uid,gid] all 32 bit
var h$base_sizeof_stat = 36;

function h$base_st_mtime(stat, stat_off) {
    h$ret1 = stat.i3[(stat_off>>2)+4];
    return stat.i3[(stat_off>>2)+3];
}

function h$base_st_size(stat, stat_off) {
    h$ret1 = stat.i3[(stat_off>>2)+2];
    return stat.i3[(stat_off>>2)+1];
}

function h$base_st_mode(stat, stat_off) {
    return stat.i3[stat_off>>2];
}

function h$base_st_dev(stat, stat_off) {
    return stat.i3[(stat_off>>2)+5];
}

function h$base_st_ino(stat, stat_off) {
    return stat.i3[(stat_off>>2)+6];
}

var h$base_echo            = 1;
var h$base_tcsanow         = 2;
var h$base_icanon          = 4;
var h$base_vmin            = 8;
var h$base_vtime           = 16;
var h$base_sigttou         = 0;
var h$base_sig_block       = 0;
var h$base_sig_setmask     = 0;
var h$base_f_getfl         = 0;
var h$base_f_setfl         = 0;
var h$base_f_setfd         = 0;
var h$base_fd_cloexec      = 0;
var h$base_sizeof_termios  = 4;
var h$base_sizeof_sigset_t = 4;
var h$base_lflag           = 0;

function h$base_poke_lflag(termios, termios_off, flag) {
    return 0;
}

function h$base_ptr_c_cc(termios, termios_off) {
    h$ret1 = 0;
    return h$newByteArray(8);
}

var h$base_default_buffer_size = 32768;

function h$base_c_s_issock(mode) {
    return 0; // fixme
}

var h$base_SEEK_SET = 0;
var h$base_SEEK_CUR = 1;
var h$base_SEEK_END = 2;

function h$base_set_saved_termios(a, b, c) {
    h$ret1 = 0
    return null;
}

function h$base_get_saved_termios(r) {
    h$ret1 = 0;
    return null;
}

// fixme
function h$lockFile(fd, dev, ino, for_writing) {
    TRACE_IO("lockFile:" + fd);
    return 0;
}
function h$unlockFile(fd) {
    TRACE_IO("unlockFile:" + fd);
    return 0;
}



// engine-dependent setup
var h$base_readStdin, h$base_writeStderr, h$base_writeStdout;
var h$base_readFile,  h$base_writeFile,   h$base_closeFile;
if(typeof module !== 'undefined' && module.exports) { // node.js
    var h$base_stdin_waiting = new h$Queue();
    var h$base_stdin_chunk   = { buf: null
                               , pos: 0
                               , processing: false
                               };
    var h$base_stdin_eof     = false;

    var h$base_process_stdin = function() {
        var c = h$base_stdin_chunk;
        var q = h$base_stdin_waiting;
        if(!q.length() || c.processing) return;
        c.processing = true;
        if(!c.buf) { c.pos = 0; c.buf = process.stdin.read(); }
        while(c.buf && q.length()) {
            var x = q.dequeue();
            var n = Math.min(c.buf.length - c.pos, x.n);
            for(var i=0;i<n;i++) {
                x.buf.u8[i+x.off] = c.buf[c.pos+i];
            }
            c.pos += n;
            x.c(n);
            if(c.pos >= c.buf.length) c.buf = null;
            if(!c.buf && q.length()) { c.pos = 0; c.buf = process.stdin.read(); }
        }
        while(h$base_stdin_eof && q.length()) q.dequeue().c(0);
        c.processing = false;
    }

    h$base_closeFile = function(fd, fdo, c) {
        h$fs.close(fd, function(err) {
            delete h$base_fds[fd];
            h$handleErrnoC(err, -1, 0, c);
        });
    }

    h$base_readFile = function(fd, fdo, buf, buf_offset, n, c) {
        var pos = typeof fdo.pos === 'number' ? fdo.pos : null;
        TRACE_IO("base_readFile: " + fd + " " + pos + " " + buf_offset + " " + n);
        h$fs.read(fd, new Buffer(n), buf_offset, n, pos, function(err, bytesRead, nbuf) {
            if(err) {
                h$setErrno(err);
                c(-1);
            } else {
                for(var i=bytesRead-1;i>=0;i--) buf.u8[buf_offset+i] = nbuf[i];
                if(typeof fdo.pos === 'number') fdo.pos += bytesRead;
                c(bytesRead);
            }
        });
    }

    h$base_readStdin = function(fd, fdo, buf, buf_offset, n, c) {
        TRACE_IO("read stdin");
        h$base_stdin_waiting.enqueue({buf: buf, off: buf_offset, n: n, c: c});
        h$base_process_stdin();
    }

    h$base_writeFile = function(fd, fdo, buf, buf_offset, n, c) {
        var pos = typeof fdo.pos === 'number' ? fdo.pos : null;
        TRACE_IO("base_writeFile: " + fd + " " + pos + " " + buf_offset + " " + n);
        var nbuf = new Buffer(n);
        for(var i=0;i<n;i++) nbuf[i] = buf.u8[i+buf_offset];
        if(typeof fdo.pos === 'number') fdo.pos += n;
        h$fs.write(fd, nbuf, 0, n, pos, function(err, bytesWritten) {
            TRACE_IO("written file: " + fd);
            if(err) {
                h$setErrno(err);
                if(typeof fdo.pos === 'number') fdo.pos -= n;
                c(-1);
            } else {
                if(typeof fdo.pos === 'number') fdo.pos += bytesWritten - n;
                c(bytesWritten);
            }
        });
    }

    h$base_writeStdout = function(fd, fdo, buf, buf_offset, n, c) {
        TRACE_IO("write stdout");
        h$base_writeFile(1, fdo, buf, buf_offset, n, c);
    }

    h$base_writeStderr = function(fd, fdo, buf, buf_offset, n, c) {
        TRACE_IO("write stderr");
        h$base_writeFile(2, fdo, buf, buf_offset, n, c);
    }

    process.stdin.on('readable', h$base_process_stdin);
    process.stdin.on('end', function() { h$base_stdin_eof = true; h$base_process_stdin(); });

} else if (typeof putstr !== 'undefined' && typeof printErr !== 'undefined') { // SpiderMonkey
    h$base_readStdin = function(fd, fdo, buf, buf_offset, n, c) {
        c(0);
    }
    h$base_writeStdout = function(fd, fdo, buf, buf_offset, n, c) {
        putstr(h$decodeUtf8(buf, n, buf_offset));
        c(n);
    }
    h$base_writeStderr = function(fd, fdo, buf, buf_offset, n, c) {
        printErr(h$decodeUtf8(buf, n, buf_offset));
        c(n);
    }
} else { // browser / fallback
    h$base_readStdin = function(fd, fdo, buf, buf_offset, n, c) {
        c(0);
    }
    h$base_writeStdout = function(fd, fdo, buf, buf_offset, n, c) {
        console.log(h$decodeUtf8(buf, n, buf_offset));
        c(n);
    }
    h$base_writeStderr = function(fd, fdo, buf, buf_offset, n, c) {
        console.log(h$decodeUtf8(buf, n, buf_offset));
        c(n);
    }
}

var h$base_stdin_fd  = { read:  h$base_readStdin };
var h$base_stdout_fd = { write: h$base_writeStdout };
var h$base_stderr_fd = { write: h$base_writeStderr };

var h$base_fdN = -1; // negative file descriptors are 'virtual'
var h$base_fds = [h$base_stdin_fd, h$base_stdout_fd, h$base_stderr_fd];
