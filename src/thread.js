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
var h$blocked = new goog.structs.Set();

function h$logSched() { return; }
// var h$logSched = h$logSched0;
function h$logSched0() { if(arguments.length == 1) {
                          if(h$currentThread != null) {
                            log("sched: " + h$threadString(h$currentThread) +
                                "[" + h$currentThread.mask + "," +
                                (h$currentThread.interruptible?1:0) + "," +
                                h$currentThread.excep.length +
                                "] -> " + arguments[0]);
                          } else {
                            log("sched: " + h$threadString(h$currentThread) + " -> " + arguments[0]);
                          }
                        } else {
                          log.apply(log,arguments);
                        }
                      }

function h$Thread() {
  this.tid = ++h$threadIdN;
  this.status = h$threadRunning;
  this.stack = [h$done, 0, h$baseZCGHCziConcziSynczireportError, h$catch_e];
  this.sp = 3;
  this.mask = 0;         // async exceptions masked (0 unmask, 1: uninterruptible, 2: interruptible)
  this.interruptible = false; // currently in an interruptible operation
  this.excep = [];       // async exceptions waiting for unmask of this thread
  this.delayed = false;  // waiting for threadDelay
  this.blockedOn = null; // object on which thread is blocked
  this.retryInterrupted = null; // how to retry blocking operation when interrupted
  this.transaction = null; // for STM
  this.m = 0;
}

function h$rts_getThreadId(t) {
  return t.tid;
}

function h$cmp_thread(t1,t2) {
  if(t1.tid < t2.tid) return -1;
  if(t1.tid > t2.tid) return 1;
  return 0;
}

// description of the thread, if unlabeled then just the thread id
function h$threadString(t) {
  if(t === null) {
    return "<no thread>";
  } else if(t.label) {
    var str = h$decodeUtf8z(t.label[0], t.label[1]);
    return str + " (" + t.tid + ")";
  } else {
    return (""+t.tid);
  }
}

function h$fork(a, inherit) {
  var t = new h$Thread();
  h$logSched("sched: forking: " + h$threadString(t));
  if(inherit && h$currentThread) {
    t.mask = h$currentThread.mask;
  }
  //h$logSched("sched: action forked: " + a.f.n);
  t.stack[4] = h$ap_1_0;
  t.stack[5] = a;
  t.stack[6] = h$return;
  t.sp = 6;
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
  h$currentThread.interruptible = true;
  h$blockThread(h$currentThread,fd,[h$waitRead,fd]);
  return h$reschedule;
}

function h$waitWrite(fd) {
  h$fds[fd].waitWrite.push(h$currentThread);
  h$currentThread.interruptible = true;
  h$blockThread(h$currentThread,fd,[h$waitWrite,fd]);
  return h$reschedule;
}

// threadDelay support:
var h$delayed = new goog.structs.Heap();
function h$wakeupDelayed(now) {
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
  h$logSched("delaying " + h$threadString(h$currentThread) + " " + ms + "ms");
  h$delayed.insert(now+ms, h$currentThread);
  h$sp += 2;
  h$stack[h$sp-1] = h$r1;
  h$stack[h$sp] = h$return;
  h$currentThread.delayed = true;
  h$blockThread(h$currentThread, h$delayed,[h$resumeDelayThread]);
  return h$reschedule;
}

function h$resumeDelayThread() {
  h$r1 = false;
  return h$stack[h$sp];
}

function h$yield() {
  h$sp += 2;
  h$stack[h$sp-1] = h$r1;
  h$stack[h$sp] = h$return;
  h$currentThread.sp = h$sp;
  return h$reschedule;
}

// raise the async exception in the thread if not masked
function h$killThread(t, ex) {
  h$logSched("killThread: " + h$threadString(t));
  if(t === h$currentThread) {
    // if target is self, then throw even if masked
    h$sp += 2;
    h$stack[h$sp-1] = h$r1;
    h$stack[h$sp]   = h$return;
    return h$throw(ex,true);
  } else {
    h$logSched("killThread mask: " + t.mask);
    if(t.mask === 0 || (t.mask === 2 && t.interruptible)) {
      if(t.stack) {  // finished threads don't have a stack anymore
        h$forceWakeupThread(t);
        t.sp += 2;
        t.stack[t.sp-1] = ex;
        t.stack[t.sp] = h$raiseAsync_frame;
      }
      return h$stack[h$sp];
    } else {
      t.excep.push([h$currentThread,ex]);
      h$blockThread(h$currentThread,t,null);
      h$currentThread.interruptible = true;
      h$sp += 2;
      h$stack[h$sp-1] = h$r1;
      h$stack[h$sp] = h$return;
      return h$reschedule;
    }
  }
}

function h$maskStatus() {
  h$logSched("mask status: " + h$currentThread.mask);
  return h$currentThread.mask;
}

function h$maskAsync(a) {
  h$logSched("mask: thread " + h$threadString(h$currentThread));
  if(h$currentThread.mask !== 2) {
    if(h$currentThread.mask === 0 && h$stack[h$sp] !== h$maskFrame && h$stack[h$sp] !== h$maskUnintFrame) {
      h$stack[++h$sp] = h$unmaskFrame;
    }
    if(h$currentThread.mask === 1) {
      h$stack[++h$sp] = h$maskUnintFrame;
    }
    h$currentThread.mask = 2;
  }
  h$r1 = a;
  return h$ap_1_0_fast();
}

function h$maskUnintAsync(a) {
  h$logSched("mask unint: thread " + h$threadString(h$currentThread));
  if(h$currentThread.mask !== 1) {
    if(h$currentThread.mask === 2) {
      h$stack[++h$sp] = h$maskFrame;
    } else {
      h$stack[++h$sp] = h$unmaskFrame;
    }
    h$currentThread.mask = 1;
  }
  h$r1 = a;
  return h$ap_1_0_fast();
}

function h$unmaskAsync(a) {
  h$logSched("unmask: " + h$threadString(h$currentThread));
  if(h$currentThread.excep.length > 0) {
    h$currentThread.mask = 0;
    h$sp += 3;
    h$stack[h$sp-2] = h$ap_1_0;
    h$stack[h$sp-1] = a;
    h$stack[h$sp]   = h$return;
    return h$reschedule;
  }
  if(h$currentThread.mask !== 0) {
    if(h$stack[h$sp] !== h$unmaskFrame) {
      if(h$currentThread.mask === 2) {
        h$stack[++h$sp] = h$maskFrame;
      } else {
        h$stack[++h$sp] = h$maskUnintFrame;
      }
    }
    h$currentThread.mask = 0;
  }
  h$r1 = a;
  return h$ap_1_0_fast();
}

function h$pendingAsync() {
  var t = h$currentThread;
  return (t.excep.length > 0 && (t.mask === 0 || (t.mask === 2 && t.interruptible)));
}

// post the first of the queued async exceptions to
// this thread, restore frame is in thread if alreadySuspended

function h$postAsync(alreadySuspended,next) {
  var t = h$currentThread;
  if(h$pendingAsync()) {
    h$logSched("posting async to " + h$threadString(t) + " mask status: " + t.mask);
    var v = t.excep.shift();
    var tposter = v[0]; // posting thread, blocked
    var ex      = v[1]; // the exception
    if(v !== null && tposter !== null) {
      h$wakeupThread(tposter);
    }
    if(!alreadySuspended) {
      h$suspendCurrentThread(next);
    }
    h$sp += 2;
    h$stack[h$sp-1]    = ex;
    h$stack[h$sp]      = h$raiseAsync_frame;
    t.sp = h$sp;
    return true;
  } else {
    return false;
  }
}

// wakeup thread, thread has already been removed
// from any queues it was blocked on
function h$wakeupThread(t) {
  h$logSched("sched: waking up: " + h$threadString(t));
  if(t.status === h$threadBlocked) {
    t.blockedOn = null;
    t.status = h$threadRunning;
    h$blocked.remove(t);
  }
  t.interruptible = false;
  t.retryInterrupted = null;
  h$threads.enqueue(t);
}

// force wakeup, remove this thread from any
// queue it's blocked on
function h$forceWakeupThread(t) {
  h$logSched("forcing wakeup of: " + h$threadString(t));
  if(t.status === h$threadBlocked) {
    var o = t.blockedOn;
    if(o === null || o === undefined) {
      throw ("h$forceWakeupThread: blocked on null or undefined: " + h$threadString(t));
    } else if(o === h$delayed) {
      // thread delayed, can't remove, wakeupDelayed will check
      t.delayed = false;
    } else if(o instanceof h$MVar) {
      h$logSched("blocked on MVar");
      h$logSched("MVar before: " + o.readers.getCount() + " " + o.writers.getCount());
      o.readers.remove(t);
      // fixme is there a better way, writers are [thread,val] pairs
      var q = new goog.structs.Queue();
      var w;
      while ((w = o.writers.dequeue()) !== undefined) {
        if(w[0] !== t) { q.enqueue(w); }
      }
      o.writers = q;
      h$logSched("MVar after: " + o.readers.getCount() + " " + o.writers.getCount());
    } else if(o instanceof h$Fd) {
      h$logSched("blocked on fd");
      h$removeFromArray(o.waitRead,t);
      h$removeFromArray(o.waitWrite,t);
    } else if(o instanceof h$Thread) {
      h$logSched("blocked on async exception");
      // set thread (first in pair) to null, exception will still be delivered
      // but this thread not woken up again
      // fixme: are these the correct semantics?
      for(var i=0;i<o.excep.length;i++) {
        if(o.excep[i][0] === t) {
          o.excep[i][0] = null;
          break;
        }
      }
    } else if (o instanceof h$TVarsWaiting) {
      h$stmRemoveBlockedThread(o.tvars, t)
    } else if(o.f && o.f.t === h$BLACKHOLE_CLOSURE) {
      h$logSched("blocked on blackhole");
      h$removeFromArray(o.d2,t);
    } else {
      throw ("h$forceWakeupThread: blocked on unknown object: " + h$collectProps(o));
    }
    if(t.retryInterrupted) {
      t.sp+=2;
      t.stack[t.sp-1] = t.retryInterrupted;
      t.stack[t.sp] = h$retryInterrupted;
    }
    h$wakeupThread(t);
  }
}

function h$removeFromArray(a,o) {
  var i;
  while((i = a.indexOf(o)) !== -1) {
    a.splice(i,1);
  }
}

function h$finishThread(t) {
  h$logSched("sched: finishing: " + h$threadString(t));
  t.status = h$threadFinished;
  h$blocked.remove(t);
  t.stack = null;
  t.mask = 0;
  for(var i=0;i<t.excep.length;i++) {
    var v = t.excep[i];
    var tposter = v[0];
    if(v !== null && tposter !== null) {
      h$wakeupThread(tposter);
    }
  }
  t.excep = [];
}

function h$blockThread(t,o,resume) {
  h$logSched("sched: blocking: " + h$threadString(t));
  if(o === undefined || o === null) {
    throw ("h$blockThread, no block object: " + h$threadString(t));
  }
  t.status = h$threadBlocked;
  t.blockedOn = o;
  t.retryInterrupted = resume;
  t.sp = h$sp;
  h$blocked.add(t);
}

// the main scheduler, called from h$mainLoop
// returns null if nothing to do, otherwise
// the next function to run
var h$lastGc = Date.now();
var h$gcInterval = 1000; // ms
function h$scheduler(next) {
  h$logSched("sched: scheduler: " + h$sp);
  var now = Date.now();
  h$wakeupDelayed(now);
  // find the next runnable thread in the run queue
  // remove non-runnable threads
  if(h$currentThread && h$pendingAsync()) {
    h$logSched("received async exception, continuing thread");
    if(h$currentThread.status !== h$threadRunning) {
      h$forceWakeupThread(h$currentThread);
      h$currentThread.status = h$threadRunning;
    }
    h$postAsync(next === h$reschedule, next);
    return h$stack[h$sp];
  }
  var t;
  while(t = h$threads.dequeue()) {
    if(t.status === h$threadRunning) { break; }
  }
  // if no other runnable threads, just continue current (if runnable)
  if(t === undefined) {
    if(h$currentThread && h$currentThread.status === h$threadRunning) {
      // fixme do gc after a while
      if(now - h$lastGc > h$gcInterval) { // doGc
        if(next !== h$reschedule) {
          h$suspendCurrentThread(next);
          next = h$stack[h$sp];
        }
        h$gc(h$currentThread);
        h$stack = h$currentThread.stack;
        h$lastGc = Date.now();
      }
//      if(h$postAsync(next === h$reschedule, next)) {
//        h$logSched("sched: continuing: " + h$threadString(h$currentThread) + " (async posted)"); // fixme we can remove these, we handle async excep earlier
//        return h$stack[h$sp];  // async exception posted, jump to the new stack top
//      } else {
        h$logSched("sched: continuing: " + h$threadString(h$currentThread));
  //      if(next === h$reschedule) {
//          return h$stack[h$sp];
//        } else {
          return next; // just continue
//        }
//      }
    } else {
      h$logSched("sched: pausing");
      h$currentThread = null;
      h$gc(null);
      return null; // pause the haskell runner
    }
  } else { // runnable thread in t, switch to it
    h$logSched("sched: switching to: " + h$threadString(t));
    if(h$currentThread !== null) {
      if(h$currentThread.status === h$threadRunning) {
        h$threads.enqueue(h$currentThread);
      }
      // if h$reschedule called, thread takes care of suspend
      if(next !== h$reschedule && next != null) {
        h$logSched("sched: suspending: " + h$threadString(h$currentThread));
        // suspend thread: push h$restoreThread stack frame
        h$suspendCurrentThread(next);
      } else {
        h$logSched("sched: no suspend needed, reschedule called from: " + h$threadString(h$currentThread));
        h$currentThread.sp = h$sp;
      }
      h$postAsync(true, next);
    } else {
      h$logSched("sched: no suspend needed, no running thread");
    }
    // gc if needed
    if(now - h$lastGc > h$gcInterval) {
      h$gc(t);
      h$lastGc = Date.now();
    }
    // schedule new one
    h$currentThread = t;
    h$stack = t.stack;
    h$sp = t.sp;
    h$logSched("sched: scheduling " + h$threadString(t) + " sp: " + h$sp);
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
  var handler = function(ev) {
    if(ev.data === "h$mainLoop") { h$mainLoop(); }
  };
  if(window.addEventListener) {
    window.addEventListener("message", handler);
  } else {
    window.attachEvent("message", handler);
  }
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
        setTimeout(h$mainLoop, 20);
        return;
      } else {
        while(c === null) { c = h$scheduler(c); }
      }
    }
    // yield to js after 100ms
    if(Date.now() - start > 100) {
      if(h$yieldRun) {
        h$next = c;
        return h$yieldRun();
      }
    }
    // preemptively schedule threads after 9990 calls
    // but not earlier than after 25ms
    while(c !== h$reschedule && Date.now() - scheduled < 25) {
      count = 0;
      while(c !== h$reschedule && ++count < 1000) {
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
  var t = h$fork(a, false);
  h$startMainLoop();
  return t;
}

// run the supplied IO action in a main thread
// (program exits when this thread finishes)
function h$main(a) {
  var t = new h$Thread();
  //h$logSched("sched: starting main thread");
  t.stack[0] = h$doneMain;
  t.stack[4] = h$ap_1_0;
  t.stack[5] = h$flushStdout;
  t.stack[6] = h$return;
  t.stack[7] = h$ap_1_0;
  t.stack[8] = a;
  t.stack[9] = h$return;
  t.sp = 9;
  t.label = [h$encodeUtf8("main"), 0];
  h$wakeupThread(t);
  h$startMainLoop();
  return t;
}

// MVar support
var h$mvarId = 0;
function h$MVar() {
  //h$logSched("h$MVar constructor");
  this.val     = null;
  this.readers = new goog.structs.Queue();
  this.writers = new goog.structs.Queue();
  this.m = 0;
  this.id = ++h$mvarId;
}

// set the MVar to empty unless there are writers
function h$notifyMVarEmpty(mv) {
  var w = mv.writers.dequeue();
  if(w !== undefined) {
    var thread = w[0];
    var val    = w[1];
    h$logSched("notifyMVarEmpty(" + mv.id + "): writer ready: " + h$threadString(thread));
    mv.val = val;
    // thread is null if some JavaScript outside Haskell wrote to the MVar
    if(thread !== null) {
      h$wakeupThread(thread);
    }
  } else {
    h$logSched("notifyMVarEmpty(" + mv.id + "): no writers");
    mv.val = null;
  }
  h$logSched("notifyMVarEmpty(" + mv.id + "): " + mv.val);
}

// set the MVar to val unless there are readers
function h$notifyMVarFull(mv,val) {
  var r = mv.readers.dequeue();
  if(r !== undefined) {
    h$logSched("notifyMVarFull(" + mv.id + "): reader ready: " + h$threadString(r));
    r.sp += 2;
    r.stack[r.sp-1] = val;
    r.stack[r.sp]   = h$return;
    h$wakeupThread(r);
    mv.val = null;
  } else {
    h$logSched("notifyMVarFull(" + mv.id + "): no readers");
    mv.val = val;
  }
  h$logSched("notifyMVarFull(" + mv.id + "): " + mv.val);
}

function h$takeMVar(mv) {
  h$logSched("h$takeMVar(" + mv.id + "): " + mv.val + " " + h$threadString(h$currentThread));
  if(mv.val !== null) {
    h$r1 = mv.val;
    h$notifyMVarEmpty(mv);
    return h$stack[h$sp];
  } else {
    mv.readers.enqueue(h$currentThread);
    h$currentThread.interruptible = true;
    h$blockThread(h$currentThread,mv,[h$takeMVar,mv]);
    return h$reschedule;
  }
}

function h$tryTakeMVar(mv) {
  h$logSched("h$tryTakeMVar(" + mv.id + "): " + mv.val);
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
  h$logSched("h$putMVar(" + mv.id + "): " + mv.val);
  if(mv.val !== null) {
    mv.writers.enqueue([h$currentThread,val]);
    h$currentThread.interruptible = true;
    h$blockThread(h$currentThread,mv,[h$putMVar,mv]);
    return h$reschedule;
  } else {
    h$notifyMVarFull(mv,val);
    return h$stack[h$sp];
  }
}

function h$tryPutMVar(mv,val) {
  h$logSched("h$tryPutMVar(" + mv.id + "): " + mv.val);
  if(mv.val !== null) {
    return 0;
  } else {
    h$notifyMVarFull(mv,val);
    return 1;
  }
}

// box up a JavaScript value and write it to the MVar synchronously
function h$writeMVarJs1(mv,val) {
  var v = h$c1(h$data1_e, val);
  if(mv.val !== null) {
    mv.writers.enqueue([null,v]);
  } else {
    h$notifyMVarFull(mv,v);
  }
}

function h$writeMVarJs2(mv,val1,val2) {
  var v = h$c2(h$data1_e, val1, val2);
  if(mv.val !== null) {
    mv.writers.enqueue([null,v]);
  } else {
    h$notifyMVarFull(mv,v);
  }
}

// IORef support
function h$MutVar(v) {
  this.val = v;
  this.m = 0;
}

function h$atomicModifyMutVar(mv, fun) {
  var thunk = h$c2(h$ap1_e, fun, mv.val);
  mv.val = h$c1(h$select1_e, thunk);
  return h$c1(h$select2_e, thunk);
}

// Black holes and updates
// caller must save registers on stack
function h$blockOnBlackhole(c) {
  h$logSched("blackhole, blocking: " + h$collectProps(c));
  if(c.d1 === h$currentThread.tid) {
    h$logSched("NonTermination");
    return h$throw(h$baseZCControlziExceptionziBasezinonTermination, false); // is this an async exception?
  }
  h$logSched("blackhole, blocking thread: " + h$threadString(h$currentThread));
  if(c.d2 === null) {
    c.d2 = [h$currentThread];
  } else {
    c.d2.push(h$currentThread);
  }
  h$blockThread(h$currentThread,c,[h$resumeBlockOnBlackhole,c]);
  return h$reschedule;
}

function h$resumeBlockOnBlackhole(c) {
  h$r1 = c;
  return h$ap_0_0_fast();
}

// async exception happened in a black hole, make a thunk
// to resume the computation
// var h$debugResumableId = 0;
function h$makeResumable(bh,start,end,extra) {
  var s = h$stack.slice(start,end+1);
  if(extra) {
    s = s.concat(extra);
  }
//  h$logSched("making resumable " + (h$debugResumableId+1) + ", stack: ");
//  h$dumpStackTop(s,0,s.length-1);
  bh.f = h$resume_e;
  bh.d1 = s;
  bh.d2 = null;
  //  bh.d2 = ++h$debugResumableId;
}

var h$enabled_capabilities = new DataView(new ArrayBuffer(4));
h$enabled_capabilities.setUint32(0,1);

function h$rtsSupportsBoundThreads() {
  return 0;
}

// async foreign calls
function h$mkForeignCallback(x) {
  return function() {
    if(x.mv === null) { // callback called synchronously
      x.mv = arguments;
    } else {
      h$notifyMVarFull(x.mv, h$c1(h$data1_e, arguments));
    }
  }
}

// event listeners through MVar
function h$makeMVarListener(mv, stopProp, stopImmProp, preventDefault) {
  return function(event) {
    h$writeMVarJs1(mv,event);
    if(stopProp) { event.stopPropagation(); }
    if(stopImmProp) { event.stopImmediatePropagation(); }
    if(preventDefault) { event.preventDefault(); }
  }
}

