/*
  do garbage collection where the JavaScript GC doesn't suffice or needs some help:
  - run finalizers for weak references
  - find unreferenced CAFs and reset them (unless h$retainCAFs is set)
  - shorten stacks that are mostly empty
  - reset unused parts of stacks to null
  - reset registers to null
  - reset return variables to null

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

var h$gcMark = 2; // 2 or 3 (objects initialized with 0)
var h$gcTime = 0;

var h$retainCAFs = false;
var h$CAFs = [];
var h$CAFsReset = [];

// var traceGc = log;
function traceGc() { return; }

function h$gcQuick(t) {
  var start = Date.now();
  h$resetRegisters();
  h$resetResultVars();
  var i;
  if(t !== null) { // only thread t
    h$resetThread(t);
  } else { // all threads, h$currentThread assumed unused
    var runnable = h$threads.getValues();
    for(i=0;i<runnable.length;i++) {
      h$resetThread(runnable[i]);
    }
    var iter = h$blocked.__iterator__();
    try {
      while(true) {
        t = iter.next();
        h$resetThread(t, work, weaks);
      }
    } catch(e) { if(e !== goog.iter.StopIteration) { throw e; } }
  }
  var time = Date.now() - start;
  h$gcTime += time;
  traceGc("time (quick): " + time + "ms");
  traceGc("time (total): " + h$gcTime + "ms");
}

// run full marking for threads in h$blocked and h$threads, optionally t if t /= null
var h$marked = 0;
function h$gc(t) {
  h$marked = 0;
  var now = Date.now();
//  if(now - h$lastGc < 1000) {
//    return;
//  }
  h$lastGc = now;
  traceGc("gc: " + (t!==null?h$threadString(t):"null"));
  var start = Date.now();
  h$resetRegisters();
  h$resetResultVars();
  h$gcMark = 5-h$gcMark;
  var i;
  var runnable = h$threads.getValues();
  var work = [];
  var weaks = [];
  if(t !== null) {
    h$markThread(t, work, weaks);
  }
  for(i=0;i<runnable.length;i++) {
    h$markThread(runnable[i], work, weaks);
  }
  var iter = h$blocked.__iterator__();
  try {
    while(true) {
      t = iter.next();
      h$markThread(t, work, weaks);
    }
  } catch(e) { if(e !== goog.iter.StopIteration) { throw e; } }

  // we now have a bunch of weak refs, mark their finalizers and
  // values, both should not keep the key alive
  while(weaks.length > 0) {
    var w = weaks.pop();
    work.push(w.finalizer, w.val);
    h$follow(null, -1, work, weaks, w.key);
  }

  h$finalizeWeaks();
  h$finalizeCAFs();
  var time = Date.now() - start;
  h$gcTime += time;
  h$lastGc = Date.now();
  traceGc("time: " + time + "ms");
  traceGc("time (total): " + h$gcTime + "ms");
  traceGc("marked objects: " + h$marked);
}

function h$markThread(t,work,weaks) {
  var start = Date.now();
  traceGc("marking thread: " + h$threadString(t));
  var stack = t.stack;
  if(stack === null) { return; } // thread finished
  var sp = t.sp;
  var i,c;
  var mark = h$gcMark;
//  for(i=0;i<=sp;i++) {
//    work.push(stack[i]);
//  }
  traceGc("h$markThread: " + (Date.now()-start) + "ms");
  h$follow(stack, sp, work, weaks, null);
  h$resetThread(t);
}
/*
function h$followObj1(c, work) {
  work.push(c.d1);
}

function h$followObj7(c, work) {
  var d7=c.d2; work.push(c.d1, d7.d1, d7.d2, d7.d3, d7.d4, d7.d5, d7.d6);
}

function h$followObj6(c, work) {
  var d7=c.d2; work.push(c.d1, d7.d1, d7.d2, d7.d3, d7.d4, d7.d5);
}

function h$followObj5(c, work) {
  var d7=c.d2; work.push(c.d1, d7.d1, d7.d2, d7.d3, d7.d4);
}

function h$followObj4(c, work) {
  var d7=c.d2; work.push(c.d1, d7.d1, d7.d2, d7.d3);
}
*/
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

function h$follow(stack, sp, work, weaks, ignore) {
  var start = Date.now();
  var mark = h$gcMark;
  if(stack === null) { sp = -1; }
  while(sp >= 0 || work.length > 0) {
    //traceGc(work.slice(-5).map(function(x) { if(typeof(x)==='object') { return h$collectProps(x).substring(0,40); } else {return (""+x).substring(0,40);}}));
    var c = (sp >= 0) ? stack[sp--] : work.pop();
    //traceGc("mark step: " + typeof c);
    if(c !== null && typeof c === 'object' && c !== ignore && (c.m === undefined || (c.m&3) !== mark)) {
      var doMark = false;
      var cf = c.f;
      if(cf !== undefined) { // c.f !== undefined && c.d1 !== undefined && c.d2 !== undefined) {
        // traceGc("marking heap obj: " + c.f.n + " tag: " + c.f.gtag);
        c.m = (c.m&-4)|mark;
        // dynamic references
        var d = c.d2;
        switch(cf.gtag) {
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
//          case 10: var d10=c.d2; work.push(c.d1, d10.d1, d10.d2, d10.d3, d10.d4, d10.d5, d10.d6, d10.d7, d10.d8, d10.d9); break;
//          case 11: var d11=c.d2; work.push(c.d1, d11.d1, d11.d2, d11.d3, d11.d4, d11.d5, d11.d6, d11.d7, d11.d8, d11.d9, d11.d10); break;
//          case 12: var d12=c.d2; work.push(c.d1, d12.d1, d12.d2, d12.d3, d12.d4, d12.d5, d12.d6, d12.d7, d12.d8, d12.d9, d12.d10, d12.d11); break;
          default: h$followObjGen(c,work);
        }
        // static references
        var s = cf.s;
        if(s !== null) {
          //traceGc("adding static marks:");
          //traceGc(s);
          // work.push.apply(work, s);
          for(var i=0;i<s.length;i++) { work.push(s[i]); }
        }
      } else if(c instanceof h$Thread) {
        //traceGc("marking thread or array");
        c.m = (c.m&-4)|mark;
      } else if(c instanceof h$Weak) {
        //traceGc("marking weak");
        weaks.push(c);
        c.m = (c.m&-4)|mark;
      } else if(c instanceof h$MVar) {
        //traceGc("marking mvar");
        c.m = (c.m&-4)|mark;
        work.push.apply(work, c.readers.getValues());
        work.push.apply(work, c.writers.getValues());
        if(c.val !== null) { work.push(c); }
      } else if(c instanceof h$MutVar) {
        //traceGc("marking mutvar");
        c.m = (c.m&-4)|mark;
        work.push(c.val);
      } else if(c instanceof DataView) {
        doMark = true;
      } else if(c instanceof Array) {
        //traceGc("marking array");
        doMark = true;
        for(var i=0;i<c.length;i++) {
          var x = c[i];
          if(x.m === undefined || (x.m&3) !== mark) {
            work.push(x);
          }
        }
      }
      // safe marking for when we don't know that c.m exists
      if(doMark) {
//        h$marked++;
        if(c.m === undefined) {
          c.m = mark;
        } else {
          c.m = (c.m&-4)|mark;
        }
      }
    }
  }
  traceGc("h$follow: " + (Date.now()-start) + "ms");
}

function h$resetThread(t) {
  var start = Date.now();
  var stack = t.stack;
  var sp = t.sp;
  if(stack.length - sp > sp && stack.length > 100) {
    t.stack = t.stack.slice(0,sp+1);
  } else {
    for(var i=sp+1;i<stack.length;i++) {
      stack[i] = null;
    }
  }
  traceGc("h$resetThread: " + (Date.now()-start) + "ms");
}

function h$finalizeCAFs(t) {
  if(h$retainCAFs) { return; }
  var start = Date.now();
  var mark = h$gcMark;
  for(var i=0;i<h$CAFs.length;i++) {
    var c = h$CAFs[i];
    if(c.m & 3 !== mark) {
      var cr = h$CAFsReset[i];
      if(c.f !== cr) { // has been updated, reset it
        traceGc("resetting CAF: " + cr.n);
        c.f = cr;
        c.d1 = null;
        c.d2 = null;
      }
    }
  }
  traceGc("h$finalizeCAFs: " + (Date.now()-start) + "ms");
}

