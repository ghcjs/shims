/*
  do garbage collection where the JavaScript GC doesn't suffice or needs some help:
  - run finalizers for weak references
  - find unreferenced CAFs and reset them (unless h$retainCAFs is set)
  - shorten stacks that are mostly empty
  - reset unused parts of stacks to null
  - reset registers to null
  - reset return variables to null
  - throw exceptions to threads that are blocked on an unreachable MVar

  the gc uses the .m field to store its mark in all the objects it marks. for heap objects,
  the .m field is also used for other things, like stable names, the gc only changes
  the two least significant bits for these.

  assumptions:
  - all threads suspended, no active registers
  - h$currentThread == null or at least unused:
       1. all reachable threads must be in h$threads or h$blocked
       2. no registers contain any usable value
  notes:
  - gc() may replace the stack of any thread, make sure to reload h$stack after gc()
*/

/*
  fixme, todo:
  - tag unreachable MVar# so that JavaScript can stop posting events
  - mark posted exceptions to thread
*/


#ifdef GHCJS_TRACE_GC
function h$traceGC() { h$log.apply(h$log, arguments); }
#define TRACE_GC(args...) h$traceGC(args)
#else
#define TRACE_GC(args...)
#endif

// requires target to be an object
#define IS_OBJ_MARKED(obj, mark) obj && typeof obj.m === 'number' && obj.m & 3 === mark

var h$gcMark = 2; // 2 or 3 (objects initialized with 0)

#ifdef GHCJS_TRACE_GC
var h$gcTime = 0;
#endif

#ifdef GHCJS_RETAIN_CAFS
var h$retainCAFs = true;
#else
var h$retainCAFs = false;
#endif
var h$CAFs = [];
var h$CAFsReset = [];

// check whether the object is marked by the latest gc
function h$isMarked(obj) {
  return (typeof obj === 'object' || typeof obj === 'function') &&
         typeof obj.m === 'number' && (obj.m & 3) === h$gcMark;
}

// do a quick gc of a thread:
// - reset the stack (possibly shrinking storage for it)
// - reset all global data
// checks all known threads if t is null, but not h$currentThread
function h$gcQuick(t) {
  if(h$currentThread !== null) throw "h$gcQuick: GC can only be run when no thread is running";
#ifdef GHCJS_TRACE_GC
  var start = Date.now();
#endif
  h$resetRegisters();
  h$resetResultVars();
  var i;
  if(t !== null) { // reset specified threads
    if(t instanceof h$Thread) {  // only thread t
      h$resetThread(t);
    } else { // assume it's an array
      for(var i=0;i<t.length;i++) h$resetThread(t[i]);
    }
  } else { // all threads, h$currentThread assumed unused
    var runnable = h$threads.getValues();
    for(i=0;i<runnable.length;i++) {
      h$resetThread(runnable[i]);
    }
    var iter = h$blocked.__iterator__();
    try {
      while(true) h$resetThread(iter.next());
    } catch(e) { if(e !== goog.iter.StopIteration) throw e; }
  }
#ifdef GHCJS_TRACE_GC
  var time = Date.now() - start;
  h$gcTime += time;
  TRACE_GC("time (quick): " + time + "ms");
  TRACE_GC("time (total): " + h$gcTime + "ms");
#endif
}

// run full marking for threads in h$blocked and h$threads, optionally t if t /= null
#ifdef GHCJS_TRACE_GC
var h$marked = 0;
#endif
function h$gc(t) {
  if(h$currentThread !== null) throw "h$gc: GC can only be run when no thread is running";
#ifdef GHCJS_TRACE_GC
  h$marked = 0;
  TRACE_GC("gc: " + (t!==null?h$threadString(t):"null"));
#endif
  var start = Date.now();
  h$resetRegisters();
  h$resetResultVars();
  h$gcMark = 5-h$gcMark;
  var i;
  var runnable = h$threads.getValues();
  if(t !== null) h$markThread(t);
  for(i=0;i<runnable.length;i++) h$markThread(runnable[i]);
  var iter = h$blocked.__iterator__();
  try {
    while(true) {
      var nt = iter.next();
      if(!(nt.blockedOn instanceof h$MVar) || (nt.stack && nt.stack[nt.sp] === h$unboxFFIResult)) {
        h$markThread(nt);
      }
    }
  } catch(e) { if(e !== goog.iter.StopIteration) throw e; }
  iter = h$extraRoots.__iterator__();
  try {
    while(true) h$follow(iter.next().root);
  } catch(e) { if(e !== goog.iter.StopIteration) throw e; }

  // now we've marked all the regular Haskell data, continue marking
  // weak references and everything retained by DOM retainers
  h$markRetained();

  // now all running threads and threads blocked on something that's
  // not an MVar operation have been marked, including other threads
  // they reference through their ThreadId

  // clean up threads waiting on unreachable MVars:
  // throw an exception to a thread (which brings it back
  // to life), then scan it. Killing one thread might be enough
  // since the killed thread could make other threads reachable again.
  var killedThread;
  while(killedThread = h$finalizeMVars()) {
    h$markThread(killedThread);
    h$markRetained();
  }

  // mark all blocked threads
  iter = h$blocked.__iterator__();
  try {
    while(true) h$markThread(iter.next());
  } catch(e) { if(e !== goog.iter.StopIteration) throw e; }

  // and their weak references etc
  h$markRetained();

  // now everything has been marked, bring out your dead references
  h$finalizeDom();    // remove all unreachable DOM retainers
  h$finalizeWeaks();  // run finalizers for all weak references with unreachable keys
  h$finalizeCAFs();   // restore all unreachable CAFs to unevaluated state

  var now = Date.now();
  h$lastGc = now;
#ifdef GHCJS_TRACE_GC
  h$gcTime += time;
  var time = now - start;
  TRACE_GC("time: " + time + "ms");
  TRACE_GC("time (total): " + h$gcTime + "ms");
  TRACE_GC("marked objects: " + h$marked);
#endif
}

function h$markRetained() {
  var marked;
  do {
    marked = false;
    // mark all finalizers and values of weak references where the key is reachable
    iter = h$weaks.__iterator__();
    try {
      while(true) {
        TRACE_GC("recursive marking");
        c = iter.next();
        if(h$isMarked(c.key) && !h$isMarked(c.val)) {
          TRACE_GC("recursively marking weak value");
          h$follow(c.val);
          marked = true;
        }
        if(c.finalizer && !h$isMarked(c.finalizer) && h$isMarked(c.key)) {
          TRACE_GC("recursively marking weak finalizer: " + h$collectProps(c.finalizer));
          h$follow(c.finalizer);
          marked = true;
        }
      }
    } catch (e) { if(e !== goog.iter.StopIteration) throw e; }

    // mark all callbacks where at least one of the DOM retainers is reachable
    iter = h$domRoots.__iterator__();
    try {
      while(true) {
        c = iter.next();
        if(!h$isMarked(c.root) && c.domRoots && c.domRoots.size() > 0) {
          var domRetainers = c.domRoots.__iterator__();
          try {
            while(true) {
              if(h$isReachableDom(c.next())) {
                TRACE_GC("recursively marking weak DOM retained root");
                h$follow(c.root);
                marked = true;
                break;
              }
            }
          } catch(e) { if(e !== goog.iter.StopIteration) throw e; }
        }
      }
    } catch (e) { if(e !== goog.iter.StopIteration) throw e; }
    // continue for a next round if we have marked something more
    // note: this will be slow for very deep chains of weak refs,
    // change this if that becomes a problem.
  } while(marked);
}


function h$markThread(t) {
  if(t.m === h$gcMark) return;
#ifdef GHCJS_TRACE_GC
  TRACE_GC("marking thread: " + h$threadString(t));
#endif
  t.m = h$gcMark;
  if(t.stack === null) return;  // thread finished
  h$follow(t.stack, t.sp);
  h$resetThread(t);
}

// big object, not handled by 0..7 cases
// keep out of h$follow to prevent deopt
function h$followObjGen(c, work) {
   work.push(c.d1);
   var d = c.d2;
   for(var x in d) {
//              if(d.hasOwnProperty(x)) {
     work.push(d[x]);
//              }
   }
}

// follow all references in the object obj and mark them with the current mark
// if sp is a number, obj is assumed to be an array for which indices [0..sp] need
// to be followed (used for thread stacks)
function h$follow(obj, sp) {
  var i, iter, c, work;
#ifdef GHCJS_TRACE_GC
  var start = Date.now();
#endif
  var mark  = h$gcMark;
  var work;
  if(typeof sp === 'number') {
    work = obj.slice(0, sp+1);
  } else {
    work = [obj];
  }
  while(work.length > 0) {
    TRACE_GC("work length: " + work.length);
    c = work.pop();
    TRACE_GC("[" + work.length + "] mark step: " + typeof c);
#ifdef GHCJS_TRACE_GC
    if(typeof c === 'object') {
      TRACE_GC("object: " + c.toString());
      TRACE_GC("object props: " + h$collectProps(c));
      TRACE_GC("object mark: " + c.m + " (" + typeof(c.m) + ") (current: " + mark + ")");
    }
#endif
    if(c !== null && typeof c === 'object' && (c.m === undefined || (c.m&3) !== mark)) {
      var doMark = false;
      var cf = c.f;
      if(typeof cf === 'function' && typeof c.m === 'number') {
        TRACE_GC("marking heap object: " + c.f.n + " size: " + c.f.size);
        c.m = (c.m&-4)|mark; // only change the two least significant bits for heap objects
        // dynamic references
        var d = c.d2;
        switch(cf.size) {
          case 0: break;
          case 1: work.push(c.d1); break;
          case 2: work.push(c.d1, d); break;
          case 3: var d3=c.d2; work.push(c.d1, d3.d1, d3.d2); break;
          case 4: var d4=c.d2; work.push(c.d1, d4.d1, d4.d2, d4.d3); break;
          case 5: var d5=c.d2; work.push(c.d1, d5.d1, d5.d2, d5.d3, d5.d4); break;
          case 6: var d6=c.d2; work.push(c.d1, d6.d1, d6.d2, d6.d3, d6.d4, d6.d5); break;
          case 7: var d7=c.d2; work.push(c.d1, d7.d1, d7.d2, d7.d3, d7.d4, d7.d5, d7.d6); break;
          case 8: var d8=c.d2; work.push(c.d1, d8.d1, d8.d2, d8.d3, d8.d4, d8.d5, d8.d6, d8.d7); break;
          case 9: var d9=c.d2; work.push(c.d1, d9.d1, d9.d2, d9.d3, d9.d4, d9.d5, d9.d6, d9.d7, d9.d8); break;
          case 10: var d10=c.d2; work.push(c.d1, d10.d1, d10.d2, d10.d3, d10.d4, d10.d5, d10.d6, d10.d7, d10.d8, d10.d9); break;
          case 11: var d11=c.d2; work.push(c.d1, d11.d1, d11.d2, d11.d3, d11.d4, d11.d5, d11.d6, d11.d7, d11.d8, d11.d9, d11.d10); break;
          case 12: var d12=c.d2; work.push(c.d1, d12.d1, d12.d2, d12.d3, d12.d4, d12.d5, d12.d6, d12.d7, d12.d8, d12.d9, d12.d10, d12.d11); break;
          default: h$followObjGen(c,work);
        }
        // static references
        var s = cf.s;
        if(s !== null) {
          TRACE_GC("adding static marks");
          for(var i=0;i<s.length;i++) work.push(s[i]);
        }
      } else if(c instanceof h$Weak) {
        /*
           - weak references are marked later in a separate loop, so we don't need to add
               the finalizer or value to the work queue
         */
        TRACE_GC("marking weak reference");
        c.m = mark;
      } else if(c instanceof h$MVar) {
        TRACE_GC("marking MVar");
        c.m = mark;
        // only push the values in the queues, the threads will
        // be scanned after threads waiting on unreachable MVars have
        // been cleaned up
        iter = c.writers.getValues();
        for(i=0;i<iter.length;i++) {
          work.push(iter[i][1]);
        }
        if(c.val !== null) { work.push(c.val); }
      } else if(c instanceof h$MutVar) {
        TRACE_GC("marking MutVar");
        c.m = mark;
        work.push(c.val);
      } else if(c instanceof h$TVar) {
        TRACE_GC("marking TVar");
        c.m = mark;
        work.push(c.val);
      } else if(c instanceof h$Thread) {
        TRACE_GC("marking Thread");
        if(c.m !== mark) {
          c.m = mark;
          if(c.stack) work.push.apply(work, c.stack.slice(0, c.sp));
        }
      } else if(c instanceof h$Transaction) {
        /* - the accessed TVar values don't need to be marked
           - parents are also on the stack, so they should've been marked already
         */
        TRACE_GC("marking STM transaction");
        c.m = mark;
        work.push.apply(work, c.invariants);
        work.push(c.action);
        iter = c.tvars.__iterator__();
        try {
          while(true) work.push(c.next());
        } catch(e) { if(e !== goog.iter.StopIteration) throw e; }
      } else if(c instanceof Array) {
        // could be a boxed array or any JS object, we only need to follow boxed arrays
        // we check that the first element is something that looks like a heap object
        // before we proceed to scan the thing
        TRACE_GC("marking array");
        if(((typeof c.m === 'number' && c.m !== mark) || typeof c.m === 'undefined') &&
           (c.length === 0 || (typeof c[0] === 'object' && typeof c[0].f === 'function' && typeof c[0].m === 'number'))) {
          c.m = mark;
          for(i=0;i<c.length;i++) {
            var x = c[i];
            if(x && typeof x === 'object' && typeof x.f === 'function' && typeof x.m === 'number') {
              if(x.m !== mark) work.push(x);
            } else {
              break; // not a boxed array, don't scan the remainder
            }
          }
        }
//      } else if(c instanceof EventTarget) { // HTMLElement) { // DOM retention
//        TRACE_GC("marking DOM element");
        // fixme
      } else {
#ifdef GHCJS_TRACE_GC_UNKNOWN
        // everything else is unknown, no followable values, this gets spammy
       TRACE_GC("unknown object: " + h$collectProps(c));
#endif
      }
    }
  }
  TRACE_GC("h$follow: " + (Date.now()-start) + "ms");
}

// resetThread clears the stack above the stack pointer
// and shortens the stack array if there is too much
// unused space
function h$resetThread(t) {
#ifdef GHCJS_TRACE_GC
  var start = Date.now();
#endif
  var stack = t.stack;
  var sp = t.sp;
  if(stack.length - sp > sp && stack.length > 100) {
    t.stack = t.stack.slice(0,sp+1);
  } else {
    for(var i=sp+1;i<stack.length;i++) {
      stack[i] = null;
    }
  }
  TRACE_GC("h$resetThread: " + (Date.now()-start) + "ms");
}

// throw blocked indefinitely exception to the first thread waiting on an unreferenced MVar
function h$finalizeMVars() {
  TRACE_GC("finalizing MVars");
  var i, iter = h$blocked.__iterator__();
  try {
    while(true) {
      var t = iter.next();
      if(t.status === h$threadBlocked && t.blockedOn instanceof h$MVar) {
        // if h$unboxFFIResult is the top of the stack, then we cannot kill
        // the thread since it's waiting for async FFI
        if(t.blockedOn.m !== h$gcMark && t.stack[t.sp] !== h$unboxFFIResult) {
          h$killThread(t, h$ghcjszmprimZCGHCJSziPrimziInternalziblockedIndefinitelyOnMVar);
          return t;
        }
      }
    }
  } catch(e) { if(e !== goog.iter.StopIteration) throw e; }
  return null;
}

// clear DOM retainers
function h$finalizeDom() {
  // fixme
}

// reset unreferenced CAFs to their initial value
function h$finalizeCAFs() {
  if(h$retainCAFs) return;
#ifdef GHCJS_TRACE_GC
  var start = Date.now();
#endif
  var mark = h$gcMark;
  for(var i=0;i<h$CAFs.length;i++) {
    var c = h$CAFs[i];
    if(c.m & 3 !== mark) {
      var cr = h$CAFsReset[i];
      if(c.f !== cr) { // has been updated, reset it
        TRACE_GC("resetting CAF: " + cr.n);
        c.f = cr;
        c.d1 = null;
        c.d2 = null;
      }
    }
  }
  TRACE_GC("h$finalizeCAFs: " + (Date.now()-start) + "ms");
}
