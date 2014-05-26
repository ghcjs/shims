
#ifdef GHCJS_TRACE_HSCORE
function h$logHscore() { h$log.apply(h$log,arguments); }
#define TRACE_PROC(args...) h$logHscore(args)
#else
#define TRACE_PROC(args...)
#endif

function h$__hscore_sizeof_termios() {
    TRACE_HSCORE("hscore_sizeof_termios");
    return 4;
}

function h$tcgetattr(x, y, z) {
    TRACE_HSCORE("tcgetattr: " + x + " " + y + " " + z);
    return 0;
}

function h$__hscore_get_saved_termios(r) {
    TRACE_HSCORE("hscore_get_saved_termios: " + r);
    h$ret1 = 0;
    return null;
}

function h$__hscore_set_saved_termios(a, b, c) {
    TRACE_HSCORE("hscore_set_saved_termios: " + a + " " + b + " " + c);
    h$ret1 = 0;
    return null;
}

function h$__hscore_sizeof_sigset_t() {
    TRACE_HSCORE("hscore_sizeof_sigset_t");
    return 4;
}

function h$sigemptyset(a, b) {
    TRACE_HSCORE("sigemptyset: " + a + " " + b);
    h$ret1 = 0;
    return null;
}

function h$__hscore_sigttou() {
    TRACE_HSCORE("hscore_sigttou");
    return 0;
}

function h$sigaddset(a, b, c) {
    TRACE_HSCORE("sigaddset: " + a + " " + b + " " + c);
    return 0;
}

function h$__hscore_sig_block() {
    TRACE_HSCORE("hscore_sig_block");
    return 0;
}

function h$sigprocmask(a,b,c,d,e) {
    TRACE_HSCORE("sigprocmask: " + a + " " + b + " " + c + " " + d + " " + e);
    h$ret1 = 0;
    return 0;
}

function h$__hscore_lflag(a,b) {
    TRACE_HSCORE("hscore_lflag: " + a + " " + b);
    return 0;
}

function h$__hscore_icanon() {
    TRACE_HSCORE("hscore_icanon");
    return 0;
}

function h$__hscore_poke_lflag(a, b, c) {
    TRACE_HSCORE("hscore_poke_lflag: " + a + " " + b + " " + c);
    return 0;
}

function h$__hscore_ptr_c_cc(a, b) {
    TRACE_HSCORE("hscore_ptr_c_cc: " + a + " " + b);
    h$ret1 = 0;
    return h$newByteArray(8); // null;
}

function h$__hscore_vmin() {
    TRACE_HSCORE("hscore_vmin");
    h$ret1 = 0;
    return h$newByteArray(8); // null;
}

function h$__hscore_vtime() {
    TRACE_HSCORE("hscore_vtime");
    return 0;
}

function h$__hscore_tcsanow() {
    TRACE_HSCORE("hscore_tcsanow");
    return 0;
}

function h$tcsetattr(a,b,c,d) {
    TRACE_HSCORE("tcsetattr: " + a + " " + b + " " + c + " " + d);
    return 0;
}

function h$__hscore_sig_setmask() {
    TRACE_HSCORE("hscore_sig_setmask");
    return 0;
}

