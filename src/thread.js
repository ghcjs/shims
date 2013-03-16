// preemptive threading support

// thread status
var h$threadRunning  = 0;
var h$threadBlocked  = 1;
var h$threadFinished = 16;
var h$threadDied     = 17;

var h$threadIdN = 0;

// all threads except h$currentThread
// that are not finished/died can be found here
var h$threads = new goog.structs.Queue();
var h$blocked = [];

function h$logSched() { return; }
// var h$logSched = log;

function h$Thread() {
  this.tid = ++h$threadIdN;
  this.status = h$threadRunning;
  this.stack = [h$done, h$baseZCGHCziConcziSynczireportError, h$catch_e];
  this.sp = 2;
  this.mask = 0;         // async exceptions masked
  this.delayed = false;  // waiting for threadDelay
  this.blockedOn = null;
}

// description of the thread, if unlabeled then just the thread id
function h$threadString(t) {
  if(t.label) {
    var str = h$decodeUtf8z(t.label[0], t.label[1]);
    return str + " (" + t.tid + ")";
  } else {
    return (""+t.tid);
  }
}

function h$fork(a) {
  var t = new h$Thread();
  //h$logSched("sched: forking: " + h$threadString(t));
  //h$logSched("sched: action forked: " + a.f.n);
  t.stack[3] = h$ap_1_0;
  t.stack[4] = a;
  t.stack[5] = h$return;
  t.sp = 5;
  h$wakeupThread(t);
  return t;
}

function h$threadStatus(t) {
  h$ret1 = 1; // capability
  h$ret2 = 0; // locked
  return t.status;
}

function h$waitRead(fd) {
  h$fds[fd].waitRead.push(h$currentThread);
  h$blockThread(h$currentThread,fd);
  return h$reschedule;
}

function h$waitWrite(fd) {
  h$fds[fd].waitWrite.push(h$currentThread);
  h$blockThread(h$currentThread,fd);
  return h$reschedule;
}

// threadDelay support:
var h$delayed = new goog.structs.Heap();
function h$wakeupDelayed() {
  var now = Date.now();
  while(h$delayed.getCount() > 0 && h$delayed.peekKey() < now) {
    var t = h$delayed.remove();
    // might have been woken up early, don't wake up again in that case
    if(t.delayed) {
      t.delayed = false;
      h$wakeupThread(t);
    }
  }
}

function h$delayThread(time) {
  var now = Date.now();
  var ms = time/1000; // we have no microseconds in JS
  //h$logSched("delaying " + h$threadString(h$currentThread) + " " + ms + "ms");
  h$delayed.insert(now+ms, h$currentThread);
  h$sp += 2;
  h$stack[h$sp-1] = h$r1;
  h$stack[h$sp] = h$return;
  h$currentThread.delayed = true;
  h$blockThread(h$currentThread, h$delayed);
  return h$reschedule;
}

// raise the async exception in the thread if not masked
function h$killThread(t, ex) {
  if(t === h$currentThread) {
    if(h$currentThread.mask === 0) {
      return h$throw(ex);
    } else {
      return h$stack[h$sp];
    }
  } else {
    if(t.mask === 0) {
      t.sp += 2;
      t.stack[t.sp-1] = ex;
      t.stack[t.sp] = h$raise_frame;
      h$forceWakeupThread(t);
    }
    return h$stack[h$sp];
  }
}

// wakeup thread, thread has already been removed
// from any queues it was blocked on
function h$wakeupThread(t) {
  //h$logSched("sched: waking up: " + h$threadString(t));
  if(t.status === h$threadBlocked) {
    t.blockedOn = null;
    t.status = h$threadRunning;
    delete h$blocked[t.tid];
  }
  h$threads.enqueue(t);
}

// force wakeup, remove this thread from any
// queue it's blocked on
function h$forceWakeupThread(t) {
  if(t.status === h$threadBlocked) {
    var o = t.blockedOn;
    if(o === null || o === undefined) {
      throw ("panic blocked on null or undefined: " + h$threadString(t));
    } else if(o === h$delayed) {
      // thread delayed, can't remove, wakeupDelayed will check
      t.delayed = false;
    } else if(o instanceof h$MVar) {
      o.readers.remove(t);
      // fixme is there a better way, writers are [thread,val] pairs
      var q = new goog.structs.Queue();
      var w;
      while (w = o.writers.dequeue() !== undefined) {
        if(w[0] !== t) { q.enqueue(w); }
      }
      o.writers = q;
    } else if(o instanceof h$Fd) {
      h$removeFromArray(o.waitRead,t);
      h$removeFromArray(o.waitWrite,t);
    } else if(o.f && o.f.t === h$BLACKHOLE_CLOSURE) {
      h$removeFromArray(o.d2,t);
    } else {
      throw ("panic, blocked on unknown object: " + h$collectProps(o));
    }
    h$wakeupThread(t);
  }
}

function h$removeFromArray(a,o) {
  var i;
  while(i = a.indexOf(o) !== -1) {
    a.splice(i,1);
  }
}

function h$finishThread(t) {
  //h$logSched("sched: finishing: " + h$threadString(t));
  t.status = h$threadFinished;
  delete h$blocked[t.tid];
  t.stack = null;
}

function h$blockThread(t,o) {
  //h$logSched("sched: blocking: " + h$threadString(t));
  if(o === undefined || o === null) {
    throw ("h$blockThread, no block object: " + h$threadString(t));
  }
  t.status = h$threadBlocked;
  t.blockedOn = o;
  t.sp = h$sp;
  h$blocked[t.tid] = t;
}

// the main scheduler, called from h$mainLoop
// returns null if nothing to do, otherwise
// the next function to run
function h$scheduler(next) {
  //h$logSched("sched: scheduler");
  h$wakeupDelayed();
  // find the next runnable thread in the run queue
  // remove non-runnable threads
  var t;
  while(t = h$threads.dequeue()) {
    if(t.status === h$threadRunning) { break; }
  }
  // if no other runnable threads, just continue current (if runnable)
  if(t === undefined) {
    if(h$currentThread && h$currentThread.status === h$threadRunning) {
      //h$logSched("sched: continuing: " + h$threadString(h$currentThread));
      return next; // just continue
    } else {
      //h$logSched("sched: pausing");
      h$currentThread = null;
      return null; // pause the haskell runner
    }
  } else { // runnable thread in t, switch to it
    //h$logSched("sched: switching to: " + h$threadString(t));
    if(h$currentThread !== null) {
      if(h$currentThread.status === h$threadRunning) {
        h$threads.enqueue(h$currentThread);
      }
      // if h$reschedule called, thread takes care of suspend
      if(next !== h$reschedule && next != null) {
        //h$logSched("sched: suspending: " + h$threadString(h$currentThread));
        // suspend thread: push h$restoreThread stack frame
        h$suspendCurrentThread(next);
      } else {
        //h$logSched("sched: no suspend needed, reschedule called from: " + h$threadString(h$currentThread));
      }
    } else {
      //h$logSched("sched: no suspend needed, no running thread");
    }
    // schedule new one
    h$currentThread = t;
    h$stack = t.stack;
    h$sp = t.sp;
    //h$logSched("sched: scheduling " + h$threadString(t) + " sp: " + h$sp);
    //h$logSched("sp thing: " + h$stack[h$sp].n);
//      h$dumpStackTop(h$stack,0,h$sp);
    return h$stack[h$sp];
  }
}

// untility function: yield h$run to browser to do layout or
// other JavaScript

var h$yieldRun;
if(typeof window !== 'undefined' && window.postMessage) {
  // is this lower delay than setTimeout?
  window.addEventListener("message", function(ev) {
    if(ev.data === "h$mainLoop") { h$mainLoop(); }
  });
  h$yieldRun = function() { h$running = false; window.postMessage("h$mainLoop", "*"); }
} else if(typeof setTimeout !== 'undefined') {
  h$yieldRun = function() { h$running = false; setTimeout(h$mainLoop, 0); }
} else {
  h$yieldRun = null; // SpiderMonkey shell has none of these
}

function h$startMainLoop() {
  if(h$yieldRun) {
    h$yieldRun();
  } else {
    h$mainLoop();
  }
}

var h$running = false;
var h$next = null;
function h$mainLoop() {
  if(h$running) return;
  h$running = true;
  h$run_init_static();
  var c = h$next;
  var count;
  var start = Date.now();
  do {
    c = h$scheduler(c);
    var scheduled = Date.now();
    if(c === null) { // no running threads
      h$running = false;
      if(typeof setTimeout !== 'undefined') {
        h$next = null;
        setTimeout(h$mainLoop, 50);
        return;
      } else {
        while(c === null) { c = h$scheduler(c); }
      }
    }
    // yield to js after 500ms
    if(Date.now() - start > 500) {
      if(h$yieldRun) {
        h$next = c;
        return h$yieldRun();
      }
    }
    // preemptively schedule threads after 99990 calls
    // but not earlier than after 25ms
    while(c !== h$reschedule && Date.now() - scheduled < 25) {
      count = 0;
      while(c !== h$reschedule && ++count < 10000) {
//        h$logCall(c);
//        h$logStack();
        c = c();
        c = c();
        c = c();
        c = c();
        c = c();
        c = c();
        c = c();
        c = c();
        c = c();
        c = c();
      }
    }
  } while(true);
}

// run the supplied IO action in a new thread
// returns immediately, thread is started in background
function h$run(a) {
  //h$logSched("sched: starting thread");
  h$fork(a);
  h$startMainLoop();
}

// run the supplied IO action in a main thread
// (program exits when this thread finishes)
function h$main(a) {
  var t = new h$Thread();
  //h$logSched("sched: starting main thread");
  t.stack[0] = h$doneMain;
  t.stack[3] = h$ap_1_0;
  t.stack[4] = h$flushStdout;
  t.stack[5] = h$return;
  t.stack[6] = h$ap_1_0;
  t.stack[7] = a;
  t.stack[8] = h$return;
  t.sp = 8;
  t.label = [h$encodeUtf8("main"), 0];
  h$wakeupThread(t);
  h$startMainLoop();
}

// MVar support
function h$MVar() {
  //h$logSched("h$MVar constructor");
  this.val     = null;
  this.readers = new goog.structs.Queue();
  this.writers = new goog.structs.Queue();
}

// set the MVar to empty unless there are writers
function h$notifyMVarEmpty(mv) {
  var w = mv.writers.dequeue();
  if(w !== undefined) {
    //h$logSched("notifyMVarEmpty: writer ready");
    var thread = w[0];
    var val    = w[1];
    mv.val = val;
    h$wakeupThread(thread);
  } else {
    //h$logSched("notifyMVarEmpty: no writers");
    mv.val = null;
  }
  //h$logSched("notifyMVarEmpty: " + mv.val);
}

// set the MVar to val unless there are readers
function h$notifyMVarFull(mv,val) {
  var r = mv.readers.dequeue();
  if(r !== undefined) {
    //h$logSched("notifyMVarFull: reader ready");
    r.sp += 2;
    r.stack[r.sp-1] = val;
    r.stack[r.sp]   = h$return;
    h$wakeupThread(r);
    mv.val = null;
  } else {
    //h$logSched("notifyMVarFull: no readers");
    mv.val = val;
  }
  //h$logSched("notifyMVarFull: " + mv.val);
}

function h$takeMVar(mv) {
  //h$logSched("h$takeMVar " + mv.val);
  if(mv.val !== null) {
    h$r1 = mv.val;
    h$notifyMVarEmpty(mv);
    return h$stack[h$sp];
  } else {
    mv.readers.enqueue(h$currentThread);
    h$blockThread(h$currentThread,mv);
    return h$reschedule;
  }
}

function h$tryTakeMVar(mv) {
  //h$logSched("h$tryTakeMVar " + mv.val);
  if(mv.val === null) {
    h$ret1 = null;
    return 0;
  } else {
    h$ret1 = mv.val;
    h$notifyMVarEmpty(mv);
    return 1;
  }
}

function h$putMVar(mv,val) {
  //h$logSched("h$putMVar " + mv.val);
  if(mv.val !== null) {
    mv.writers.enqueue([h$currentThread,val]);
    h$blockThread(h$currentThread,mv);
    return h$reschedule;
  } else {
    h$notifyMVarFull(mv,val);
    return h$stack[h$sp];
  }
}

function h$tryPutMVar(mv,val) {
  //h$logSched("h$tryPutMVar " + mv.val);
  if(mv.val !== null) {
    return 0;
  } else {
    h$notifyMVarFull(mv,val);
    return 1;
  }
}

// IORef support
function h$MutVar(v) {
  this.val = v;
}

function h$atomicModifyMutVar(mv, fun) {
  var thunk = { f: h$ap1_e, d1: fun, d2: mv.val };
  mv.val = { f: h$select1_e, d1: thunk, d2: null };
  return { f: h$select2_e, d1: thunk, d2: null };
}

// Black holes and updates
// caller must save registers on stack
function h$blockOnBlackhole(c) {
  //h$logSched("blackhole, blocking: " + h$collectProps(c));
  if(c.d1 === h$currentThread.tid) {
    throw "<<loop>>";
  }
  //h$logSched("blackhole, blocking thread: " + h$threadString(h$currentThread));
  if(c.d2 === null) {
    c.d2 = [h$currentThread];
  } else {
    c.d2.push(h$currentThread);
  }
  h$blockThread(h$currentThread,c);
  return h$reschedule;
}

// fixme: why is this not escaped
var enabled_capabilities = 0;

function h$rtsSupportsBoundThreads() {
    return 0;
}

