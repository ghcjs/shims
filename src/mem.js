#include <ghcjs/rts.h>

// #define GHCJS_TRACE_META 1

#ifdef GHCJS_TRACE_META
function h$logMeta(args) { h$log.apply(h$log,arguments); }
#define TRACE_META(args...) h$logMeta(args)
#else
#define TRACE_META(args...)
#endif
// memory management and pointer emulation

// static init, non-caf
#ifdef GHCJS_PROF
function h$sti(i,c,xs,ccs) {
#else
function h$sti(i,c,xs) {
#endif
    i.f = c;
#ifdef GHCJS_PROF
    i.cc = ccs;
#endif
    h$init_closure(i,xs);
}

// static init, caf
#ifdef GHCJS_PROF
function h$stc(i,c,xs,ccs) {
#else
function h$stc(i,c,xs) {
#endif
    i.f = c;
#ifdef GHCJS_PROF
    i.cc = ccs;
#endif
    h$init_closure(i,xs);
    h$addCAF(i);
}

#ifdef GHCJS_PROF
function h$stl(o, xs, t, ccs) {
#else
function h$stl(o, xs, t) {
#endif
    var r = t ? t : h$ghczmprimZCGHCziTypesziZMZN;
    var x;
    if(xs.length > 0) {
        for(var i=xs.length-1;i>=0;i--) {
            x = xs[i];
            if(!x && x !== false && x !== 0) throw "h$toHsList: invalid element";
            r = MK_CONS_CC(x, r, ccs);
        }
    }
    // fixme direct object manip
    o.f  = r.f;
    o.d1 = r.d1;
    o.d2 = r.d2;
    o.m  = r.m;
#ifdef GHCJS_PROF
    o.cc = ccs;
#endif
}

// some utilities for constructing common objects from JS in the RTS or foreign code.
// when profiling, the current ccs is assigned

// #ifdef GHCJS_PROF
// var h$nil = h$c(h$ghczmprimZCGHCziTypesziZMZN_con_e, h$CCS_SYSTEM);
// #else
// var h$nil = h$c(h$ghczmprimZCGHCziTypesziZMZN_con_e);
// #endif

// #ifdef GHCJS_PROF
// var h$nothing = h$c(h$baseZCGHCziBaseziNothing_con_e, h$CCS_SYSTEM);
// #else
//var h$nothing = h$c(h$baseZCGHCziBaseziNothing_con_e);
// #endif

// delayed init for top-level closures
var h$staticDelayed = [];
function h$d() {
#ifdef GHCJS_PROF
    // pass a temporary CCS that won't make assertions in h$cN family alert
    var c = h$c(null, h$CCS_SYSTEM);
#else
    var c = h$c(null);
#endif
    h$staticDelayed.push(c);
    return c;
}

var h$allocN = 0;
function h$traceAlloc(x) {
    h$log("allocating: " + (++h$allocN));
    x.alloc = h$allocN;
}

// fixme remove this when we have a better way to immediately init these things
function h$di(c) {
    h$staticDelayed.push(c);
}

// initialize global object to primitive value
function h$p(x) {
    h$staticDelayed.push(x);
    return x;
}

var h$entriesStack = [];
var h$staticsStack = [];
var h$labelsStack  = [];

function h$scheduleInit(entries, objs, lbls, infos, statics) {
    var d = h$entriesStack.length;
    h$entriesStack.push(entries);
    h$staticsStack.push(objs);
    h$labelsStack.push(lbls);
    h$initStatic.push(function() {
        h$initInfoTables(d, entries, objs, lbls, infos, statics);
    });
}

function h$runInitStatic() {
    if(h$initStatic.length > 0) {
        for(var i=h$initStatic.length - 1;i>=0;i--) {
            h$initStatic[i]();
        }
        h$initStatic = [];
    }
    // free the references to the temporary tables used for
    // initialising all our static data
    h$entriesStack = null;
    h$staticsStack = null;
}

// initialize packed info tables
// see Gen2.Compactor for how the data is encoded
function h$initInfoTables ( depth      // depth in the base chain
                          , funcs      // array with all entry functions
                          , objects    // array with all the global heap objects
                          , lbls       // array with non-haskell labels
                          , infoMeta   // packed info
                          , infoStatic
                          ) {
  TRACE_META("decoding info tables");
  var n, i, j, o, pos = 0, info;
  function code(c) {
    if(c < 34) return c - 32;
    if(c < 92) return c - 33;
    return c - 34;
  }
  function next() {
    var c = info.charCodeAt(pos);
    if(c < 124) {
      TRACE_META("pos: " + pos + " decoded: " + code(c));
      pos++;
      return code(c);
    }
    if(c === 124) {
      pos+=3;
      var r =  90 + 90 * code(info.charCodeAt(pos-2))
                  + code(info.charCodeAt(pos-1));
      TRACE_META("pos: " + (pos-3) + " decoded: " + r);
      return r;
    }
    if(c === 125) {
      pos+=4;
      var r = 8190 + 8100 * code(info.charCodeAt(pos-3))
                   + 90 * code(info.charCodeAt(pos-2))
                   + code(info.charCodeAt(pos-1));
      TRACE_META("pos: " + (pos-4) + " decoded: " + r);
      return r;
    }
    throw ("h$initInfoTables: invalid code in info table: " + c + " at " + pos)
  }
  function nextCh() {
        return next(); // fixme map readable chars
  }
    function nextInt() {
        var n = next();
        var r;
        if(n === 0) {
            var n1 = next();
            var n2 = next();
            r = n1 << 16 | n2;
        } else {
            r = n - 12;
        }
        TRACE_META("decoded int: " + r);
        return r;
    }
    function nextSignificand() {
        var n = next();
        var n1, n2, n3, n4, n5;
        var r;
        if(n < 2) {
            n1 = next();
            n2 = next();
            n3 = next();
            n4 = next();
            n5 = n1 * 281474976710656 + n2 * 4294967296 + n3 * 65536 + n4;
            r = n === 0 ? -n5 : n5;
        } else {
            r = n - 12;
        }
        TRACE_META("decoded significand:" + r);
        return r;
    }
    function nextEntry(o) { return nextIndexed("nextEntry", h$entriesStack, o); }
    function nextObj(o)   { return nextIndexed("nextObj",   h$staticsStack, o); }
    function nextLabel(o) { return nextIndexed("nextLabel", h$labelsStack, o); }
    function nextIndexed(msg, stack, o) {
        var n = (o === undefined) ? next() : o;
        var i = depth;
        while(n > stack[i].length) {
            n -= stack[i].length;
            i--;
            if(i < 0) throw (msg + ": cannot find item " + n + ", stack length: " + stack.length + " depth: " + depth);
        }
        return stack[i][n];
    }
    function nextArg() {
        var o = next();
        var n, n1, n2, d0, d1, d2, d3;
        var isString = false;
        switch(o) {
        case 0:
            TRACE_META("bool arg: false");
            return false;
        case 1:
            TRACE_META("bool arg: true");
            return true;
        case 2:
            TRACE_META("int constant: 0");
            return 0;
        case 3:
            TRACE_META("int constant: 1");
            return 1;
        case 4:
            TRACE_META("int arg");
            return nextInt();
        case 5:
            TRACE_META("literal arg: null");
            return null;
        case 6:
            TRACE_META("double arg");
            n = next();
            switch(n) {
            case 0:
                return -0.0;
            case 1:
                return 0.0;
            case 2:
                return 1/0;
            case 3:
                return -1/0;
            case 4:
                return 0/0;
            case 5:
                n1 = nextInt();
                var ns = nextSignificand();
              if(n1 > 600) {
                return ns * Math.pow(2,n1-600) * Math.pow(2,600);
              } else if(n1 < -600) {
                return ns * Math.pow(2,n1+600) * Math.pow(2,-600);
              } else {
                return ns * Math.pow(2, n1);
              }
            default:
                n1 = n - 36;
                return nextSignificand() * Math.pow(2, n1);
            }
        case 7:
            TRACE_META("string arg");
            isString = true;
            // no break, strings are null temrinated UTF8 encoded binary with
        case 8:
            TRACE_META("binary arg");
            n = next();
            var ba = h$newByteArray(isString ? (n+1) : n);
            var b8 = ba.u8;
            if(isString) b8[n] = 0;
            var p  = 0;
            while(n > 0) {
                switch(n) {
                case 1:
                    d0 = next();
                    d1 = next();
                    b8[p] = ((d0 << 2) | (d1 >> 4));
                    break;
                case 2:
                    d0 = next();
                    d1 = next();
                    d2 = next();
                    b8[p++] = ((d0 << 2) | (d1 >> 4));
                    b8[p]   = ((d1 << 4) | (d2 >> 2));
                    break;
                default:
                    d0 = next();
                    d1 = next();
                    d2 = next();
                    d3 = next();
                    b8[p++] = ((d0 << 2) | (d1 >> 4));
                    b8[p++] = ((d1 << 4) | (d2 >> 2));
                    b8[p++] = ((d2 << 6) | d3);
                    break;
                }
                n -= 3;
            }
            return ba;
        case 9:
            var isFun = next() === 1;
            var lbl   = nextLabel();
            return h$initPtrLbl(isFun, lbl);
        case 10:
            var c = { f: nextEntry(), d1: null, d2: null, m: 0 };
            var n = next();
            var args = [];
            while(n--) {
                args.push(nextArg());
            }
            return h$init_closure(c, args);
        default:
            TRACE_META("object arg: " + (o-11));
            return nextObj(o-11);
        }
    }
    info = infoMeta; pos = 0;
  for(i=0;i<funcs.length;i++) {
    o = funcs[i];
    var ot;
    var oa = 0;
    var oregs = 256; // one register no skip
    switch(next()) {
      case 0: // thunk
        ot = 0;
        break;
      case 1: // fun
        ot           = 1;
        var arity    = next();
        var skipRegs = next()-1;
        if(skipRegs === -1) throw "h$initInfoTables: unknown register info for function";
        var skip     = skipRegs & 1;
        var regs     = skipRegs >>> 1;
        oregs        = (regs << 8) | skip;
        oa           = arity + ((regs-1+skip) << 8);
        break;
      case 2:  // con
        ot = 2;
        oa = next();
        break;
      case 3: // stack frame
        ot = -1;
        oa = 0;
        oregs = next() - 1;
        if(oregs !== -1) oregs = ((oregs >>> 1) << 8) | (oregs & 1);
        break;
      default: throw ("h$initInfoTables: invalid closure type")
    }
    var size = next() - 1;
    var nsrts = next();
    var srt = null;
    if(nsrts > 0) {
      srt = [];
      for(var j=0;j<nsrts;j++) {
          srt.push(nextObj());
      }
    }

    // h$log("result: " + ot + " " + oa + " " + oregs + " [" + srt + "] " + size);
    // h$log("orig: " + o.t + " " + o.a + " " + o.r + " [" + o.s + "] " + o.size);
    // if(ot !== o.t || oa !== o.a || oregs !== o.r || size !== o.size) throw "inconsistent";

    o.t    = ot;
    o.i    = [];
    o.n    = "";
    o.a    = oa;
    o.r    = oregs;
    o.s    = srt;
    o.m    = 0;
    o.size = size;
  }
    info = infoStatic;
    pos = 0;
    for(i=0;i<objects.length;i++) {
      TRACE_META("start iteration");
      o = objects[i];
        // traceMetaObjBefore(o);
      var nx = next();
      TRACE_META("static init object: " + i + " tag: " + nx);
      switch(nx) {
      case 0:  // no init, could be a primitive value (still in the list since others might reference it)
          // h$log("zero init");
          break;
      case 1: // staticfun
          o.f = nextEntry();
        TRACE_META("staticFun");
        n = next();
        TRACE_META("args: " + n);
        if(n === 0) {
          o.d1 = null;
          o.d2 = null;
        } else if(n === 1) {
          o.d1 = nextArg();
          o.d2 = null;
        } else if(n === 2) {
          o.d1 = nextArg();
          o.d2 = nextArg();
        } else {
          for(j=0;j<n;j++) {
            h$setField(o, j, nextArg());
          }
        }

          break;
      case 2:  // staticThunk
          TRACE_META("staticThunk");
        o.f = nextEntry();
        n = next();
        TRACE_META("args: " + n);
        if(n === 0) {
          o.d1 = null;
          o.d2 = null;
        } else if(n === 1) {
          o.d1 = nextArg();
          o.d2 = null;
        } else if(n === 2) {
          o.d1 = nextArg();
          o.d2 = nextArg();
        } else {
          for(j=0;j<n;j++) {
            h$setField(o, j, nextArg());
          }
        }
          h$addCAF(o);
          break;
      case 3: // staticPrim false, no init
          TRACE_META("staticBool false");
          break;
      case 4: // staticPrim true, no init
          TRACE_META("staticBool true");
          break;
      case 5:
          TRACE_META("staticInt");
          break;
      case 6: // staticString
          TRACE_META("staticDouble");
          break;
      case 7: // staticBin
          TRACE_META("staticBin: error unused");
          n = next();
          var b = h$newByteArray(n);
          for(j=0;j>n;j++) {
              b.u8[j] = next();
          }
          break;
      case 8: // staticEmptyList
          TRACE_META("staticEmptyList");
          o.f = HS_NIL_CON;
          break;
      case 9: // staticList
          TRACE_META("staticList");
          n = next();
          var hasTail = next();
          var c = (hasTail === 1) ? nextObj() : HS_NIL;
          TRACE_META("list length: " + n);
          while(n--) {
              c = MK_CONS(nextArg(), c);
          }
          o.f  = c.f;
          o.d1 = c.d1;
          o.d2 = c.d2;
          break;
      case 10:  // staticData n args
          TRACE_META("staticData");
          n = next();
          TRACE_META("args: " + n);
          o.f = nextEntry();
          for(j=0;j<n;j++) {
              h$setField(o, j, nextArg());
          }
          break;
      case 11: // staticData 0 args
          TRACE_META("staticData0");
          o.f = nextEntry();
          break;
      case 12: // staticData 1 args
          TRACE_META("staticData1");
          o.f  = nextEntry();
          o.d1 = nextArg();
          break;
      case 13: // staticData 2 args
          TRACE_META("staticData2");
          o.f  = nextEntry();
          o.d1 = nextArg();
          o.d2 = nextArg();
          break;
      case 14: // staticData 3 args
          TRACE_META("staticData3");
          o.f  = nextEntry();
          o.d1 = nextArg();
          // should be the correct order
          o.d2 = { d1: nextArg(), d2: nextArg()};
          break;
      case 15: // staticData 4 args
          TRACE_META("staticData4");
          o.f  = nextEntry();
          o.d1 = nextArg();
          // should be the correct order
          o.d2 = { d1: nextArg(), d2: nextArg(), d3: nextArg() };
          break;
      case 16: // staticData 5 args
          TRACE_META("staticData5");
          o.f  = nextEntry();
          o.d1 = nextArg();
          o.d2 = { d1: nextArg(), d2: nextArg(), d3: nextArg(), d4: nextArg() };
          break;
      case 17: // staticData 6 args
          TRACE_META("staticData6");
          o.f  = nextEntry();
          o.d1 = nextArg();
          o.d2 = { d1: nextArg(), d2: nextArg(), d3: nextArg(), d4: nextArg(), d5: nextArg() };
          break;
      default:
          throw ("invalid static data initializer: " + nx);
      }
  }
  h$staticDelayed = null;
}

function h$initPtrLbl(isFun, lbl) {
    return lbl;
}

function h$callDynamic(f) {
    return f.apply(f, Array.prototype.slice.call(arguments, 2));
}

// slice an array of heap objects
function h$sliceArray(a, start, n) {
  return a.slice(start, start+n);
}

function h$memcpy() {
  if(arguments.length === 3) {  // ByteArray# -> ByteArray# copy
    var dst = arguments[0];
    var src = arguments[1];
    var n   = arguments[2];
    for(var i=n-1;i>=0;i--) {
      dst.u8[i] = src.u8[i];
    }
    RETURN_UBX_TUP2(dst, 0);
  } else if(arguments.length === 5) { // Addr# -> Addr# copy
    var dst = arguments[0];
    var dst_off = arguments[1]
    var src = arguments[2];
    var src_off = arguments[3];
    var n   = arguments[4];
    for(var i=n-1;i>=0;i--) {
      dst.u8[i+dst_off] = src.u8[i+src_off];
    }
    RETURN_UBX_TUP2(dst, dst_off);
  } else {
    throw "h$memcpy: unexpected argument";
  }
}

// note: only works for objects bigger than two!
function h$setField(o,n,v) {
    if(n > 0 && !o.d2) o.d2 = {};
    switch(n) {
    case 0:
        o.d1 = v;
        return;
    case 1:
        o.d2.d1 = v;
        return;
    case 2:
        o.d2.d2 = v;
        return;
    case 3:
        o.d2.d3 = v;
        return;
    case 4:
        o.d2.d4 = v;
        return;
    case 5:
        o.d2.d5 = v;
        return;
    case 6:
        o.d2.d6 = v;
        return;
    case 7:
        o.d2.d7 = v;
        return;
    case 8:
        o.d2.d8 = v;
        return;
    case 9:
        o.d2.d9 = v;
        return;
    case 10:
        o.d2.d10 = v;
        return;
    case 11:
        o.d2.d11 = v;
        return;
    case 12:
        o.d2.d12 = v;
        return;
    case 13:
        o.d2.d13 = v;
        return;
    case 14:
        o.d2.d14 = v;
        return;
    case 15:
        o.d2.d15 = v;
        return;
    case 16:
        o.d2.d16 = v;
        return;
    case 17:
        o.d2.d17 = v;
        return;
    case 18:
        o.d2.d18 = v;
        return;
    case 19:
        o.d2.d19 = v;
        return;
    case 20:
        o.d2.d20 = v;
        return;
    case 21:
        o.d2.d21 = v;
        return;
    case 22:
        o.d2.d22 = v;
        return;
    case 23:
        o.d2.d23 = v;
        return;
    case 24:
        o.d2.d24 = v;
        return;
    case 25:
        o.d2.d25 = v;
        return;
    case 26:
        o.d2.d26 = v;
        return;
    case 27:
        o.d2.d27 = v;
        return;
    case 28:
        o.d2.d28 = v;
        return;
    case 29:
        o.d2.d29 = v;
        return;
    case 30:
        o.d2.d30 = v;
        return;
    case 31:
        o.d2.d31 = v;
        return;
    case 32:
        o.d2.d32 = v;
        return;
    case 33:
        o.d2.d33 = v;
        return;
    case 34:
        o.d2.d34 = v;
        return;
    case 35:
        o.d2.d35 = v;
        return;
    case 36:
        o.d2.d36 = v;
        return;
    case 37:
        o.d2.d37 = v;
        return;
    case 38:
        o.d2.d38 = v;
        return;
    case 39:
        o.d2.d39 = v;
        return;
    case 40:
        o.d2.d40 = v;
        return;
    case 41:
        o.d2.d41 = v;
        return;
    case 42:
        o.d2.d42 = v;
        return;
    case 43:
        o.d2.d43 = v;
        return;
    case 44:
        o.d2.d44 = v;
        return;
    case 45:
        o.d2.d45 = v;
        return;
    case 45:
        o.d2.d45 = v;
        return;
    case 46:
        o.d2.d46 = v;
        return;
    case 47:
        o.d2.d47 = v;
        return;
    case 48:
        o.d2.d48 = v;
        return;
    case 49:
        o.d2.d49 = v;
        return;
    case 50:
        o.d2.d50 = v;
        return;
    case 51:
        o.d2.d51 = v;
        return;
    case 52:
        o.d2.d52 = v;
        return;
    case 53:
        o.d2.d53 = v;
        return;
    case 54:
        o.d2.d54 = v;
        return;
    case 55:
        o.d2.d55 = v;
        return;
    case 56:
        o.d2.d56 = v;
        return;
    case 57:
        o.d2.d57 = v;
        return;
    case 58:
        o.d2.d58 = v;
        return;
    case 59:
        o.d2.d59 = v;
        return;
    case 60:
        o.d2.d60 = v;
        return;
    case 61:
        o.d2.d61 = v;
        return;
    case 62:
        o.d2.d62 = v;
        return;
    case 63:
        o.d2.d63 = v;
        return;
    case 64:
        o.d2.d64 = v;
        return;
    case 65:
        o.d2.d65 = v;
        return;
    case 66:
        o.d2.d66 = v;
        return;
    case 67:
        o.d2.d67 = v;
        return;
    case 68:
        o.d2.d68 = v;
        return;
    case 69:
        o.d2.d69 = v;
        return;
    case 70:
        o.d2.d70 = v;
        return;
    case 71:
        o.d2.d71 = v;
        return;
    case 72:
        o.d2.d72 = v;
        return;
    case 73:
        o.d2.d73 = v;
        return;
    case 74:
        o.d2.d74 = v;
        return;
    case 75:
        o.d2.d75 = v;
        return;
    case 76:
        o.d2.d76 = v;
        return;
    case 77:
        o.d2.d77 = v;
        return;
    case 78:
        o.d2.d78 = v;
        return;
    case 79:
        o.d2.d79 = v;
        return;
    case 80:
        o.d2.d80 = v;
        return;
    case 81:
        o.d2.d81 = v;
        return;
    case 82:
        o.d2.d82 = v;
        return;
    case 83:
        o.d2.d83 = v;
        return;
    case 84:
        o.d2.d84 = v;
        return;
    case 85:
        o.d2.d85 = v;
        return;
    case 86:
        o.d2.d86 = v;
        return;
    case 87:
        o.d2.d87 = v;
        return;
    case 88:
        o.d2.d88 = v;
        return;
    case 89:
        o.d2.d89 = v;
        return;
    case 90:
        o.d2.d90 = v;
        return;
    case 91:
        o.d2.d91 = v;
        return;
    case 92:
        o.d2.d92 = v;
        return;
    case 93:
        o.d2.d93 = v;
        return;
    case 94:
        o.d2.d94 = v;
        return;
    case 95:
        o.d2.d95 = v;
        return;
    case 96:
        o.d2.d96 = v;
        return;
    case 97:
        o.d2.d97 = v;
        return;
    case 98:
        o.d2.d98 = v;
        return;
    case 99:
        o.d2.d99 = v;
        return;
    case 100:
        o.d2.d100 = v;
        return;
    case 101:
        o.d2.d101 = v;
        return;
    case 102:
        o.d2.d102 = v;
        return;
    case 103:
        o.d2.d103 = v;
        return;
    case 104:
        o.d2.d104 = v;
        return;
    case 105:
        o.d2.d105 = v;
        return;
    case 106:
        o.d2.d106 = v;
        return;
    case 107:
        o.d2.d107 = v;
        return;
    default:
        throw ("h$setField: setter not implemented for field: " + n);
    }
}


function h$mkExportDyn(t, f) {
    h$log("making dynamic export: " + t);
    h$log("haskell fun: " + f + " " + h$collectProps(f));

    // fixme register things, global static data
    var ff = function() {
        h$log("running some haskell for you");
        return 12;
    };
    return h$mkPtr(ff, 0);
}

function h$memchr(a_v, a_o, c, n) {
  for(var i=0;i<n;i++) {
    if(a_v.u8[a_o+i] === c) {
      RETURN_UBX_TUP2(a_v, a_o+i);
    }
  }
  RETURN_UBX_TUP2(null, 0);
}

function h$strlen(a_v, a_o) {
  var i=0;
  while(true) {
    if(a_v.u8[a_o+i] === 0) { return i; }
    i++;
  }
}

function h$newArray(len, e) {
    var r = [];
    r.__ghcjsArray = true;
    r.m = 0;
    if(e === null) e = r;
    for(var i=0;i<len;i++) r[i] = e;
    return r;
}

function h$roundUpToMultipleOf(n,m) {
  var rem = n % m;
  return rem === 0 ? n : n - rem + m;
}

function h$newByteArray(len) {
  var len0 = Math.max(h$roundUpToMultipleOf(len, 8), 8);
  var buf = new ArrayBuffer(len0);
  return { buf: buf
         , len: len
         , i3: new Int32Array(buf)
         , u8: new Uint8Array(buf)
         , u1: new Uint16Array(buf)
         , f3: new Float32Array(buf)
         , f6: new Float64Array(buf)
         , dv: new DataView(buf)
         }
}

/*
  Unboxed arrays in GHC use the ByteArray# and MutableByteArray#
  primitives. In GHCJS these primitives are represented by an
  object that contains a JavaScript ArrayBuffer and several views
  (typed arrays) on that buffer.

  Usually you can use GHCJS.Foreign.wrapBuffer and
  GHCJS.Foreign.wrapMutableBuffer to do the conversion. If you need
  more control or lower level acces, read on.

  You can use h$wrapBuffer to wrap any JavaScript ArrayBuffer
  into such an object, without copying the buffer. Since typed array
  access is aligned, not all views are available
  if the offset of the buffer is not a multiple of 8.

  Since IO has kind * -> *, you cannot return IO ByteArray#
  from a foreign import, even with the UnliftedFFITypes
  extension. Return a JSVal instead and use unsafeCoerce
  to convert it to a Data.Primitive.ByteArray.ByteArray or
  Data.Primitive.ByteArray.MutableByteArray (primitive package)
  and pattern match on the constructor to get the
  primitive value out.

  These types have the same runtime representation (a data
  constructor with one regular (one JavaScript variable)
  field) as a JSVal, so the conversion is safe, as long
  as everything is fully evaluated.
*/
function h$wrapBuffer(buf, unalignedOk, offset, length) {
  if(!unalignedOk && offset && offset % 8 !== 0) {
    throw ("h$wrapBuffer: offset not aligned:" + offset);
  }
  if(!buf || !(buf instanceof ArrayBuffer))
    throw "h$wrapBuffer: not an ArrayBuffer"
  if(!offset) { offset = 0; }
  if(!length || length < 0) { length = buf.byteLength - offset; }
  return { buf: buf
         , len: length
         , i3: (offset%4) ? null : new Int32Array(buf, offset, length >> 2)
         , u8: new Uint8Array(buf, offset, length)
         , u1: (offset%2) ? null : new Uint16Array(buf, offset, length >> 1)
         , f3: (offset%4) ? null : new Float32Array(buf, offset, length >> 2)
         , f6: (offset%8) ? null : new Float64Array(buf, offset, length >> 3)
         , dv: new DataView(buf, offset, length)
         };
}

/* 
   A StableName is represented as either a h$StableName object (for most heap objects)
   or a number (for heap objects with unboxed representation)

   Holding on to a StableName does not keep the original object alive.
 */
var h$stableNameN = 1;
/** @constructor */
function h$StableName(m) {
  this.m = m;
  this.s = null;
}

function h$makeStableName(x) {
  if(typeof x === 'number') {
    return x;
  } else if(IS_WRAPPED_NUMBER(x)) {
    return UNWRAP_NUMBER(x);
  } else if(typeof x === 'object') {
    if(typeof x.m !== 'object') {
      x.m = new h$StableName(x.m);
    }
    return x.m;
  } else {
    throw new Error("h$makeStableName: invalid argument");
  }
}

function h$stableNameInt(s) {
  if(typeof s === 'number') {
    if(s!=s) return 999999; // NaN
    var s0 = s|0;
    if(s0 === s) return s0;
    h$convertDouble[0] = s;
    return h$convertInt[0] ^ h$convertInt[1];
  } else {
    var x = s.s;
    if(x === null) {
      x = s.s = h$stableNameN = (h$stableNameN+1)|0;
    }
    return x;
  }
}

function h$eqStableName(s1o,s2o) {
  if(s1o!=s1o && s2o!=s2o) return 1; // NaN
  return s1o === s2o ? 1 : 0;
}

function h$makeStablePtr(v) {
  var buf = h$newByteArray(4);
  buf.arr = [v];
  RETURN_UBX_TUP2(buf, 0);
}

function h$hs_free_stable_ptr(stable) {

}

function h$malloc(n) {
  RETURN_UBX_TUP2(h$newByteArray(n), 0);
}

function h$free() {

}

function h$memset() {
  var buf_v, buf_off, chr, n;
  buf_v = arguments[0];
  if(arguments.length == 4) { // Addr#
    buf_off = arguments[1];
    chr     = arguments[2];
    n       = arguments[3];
  } else if(arguments.length == 3) { // ByteString#
    buf_off = 0;
    chr     = arguments[1];
    n       = arguments[2];
  } else {
    throw("h$memset: unexpected argument")
  }
  var end = buf_off + n;
  for(var i=buf_off;i<end;i++) {
    buf_v.u8[i] = chr;
  }
  RETURN_UBX_TUP2(buf_v, buf_off);
}

function h$memcmp(a_v, a_o, b_v, b_o, n) {
  for(var i=0;i<n;i++) {
    var a = a_v.u8[a_o+i];
    var b = b_v.u8[b_o+i];
    var c = a-b;
    if(c !== 0) { return c; }
  }
  return 0;
}

function h$memmove(a_v, a_o, b_v, b_o, n) {
  if(n > 0) {
    var tmp = new Uint8Array(b_v.buf.slice(b_o,b_o+n));
    for(var i=0;i<n;i++) {
      a_v.u8[a_o+i] = tmp[i];
    }
  }
  RETURN_UBX_TUP2(a_v, a_o);
}
function h$mkPtr(v, o) {
  return MK_PTR(v, o);
};
function h$mkFunctionPtr(f) {
  var d = h$newByteArray(4);
  d.arr = [f];
  return d;
}
var h$freeHaskellFunctionPtr = function () {
}

// extra roots for the heap scanner: objects with root property
var h$extraRootsN = 0;
var h$extraRoots = new h$Set();

function h$makeCallback(f, extraArgs, action) {
    var args = extraArgs.slice(0);
    args.unshift(action);
    var c = function() {
        return f.apply(this, args);
    }
    c._key = ++h$extraRootsN;
    c.root = action;
    h$extraRoots.add(c);
    return c;
}

function h$makeCallbackApply(n, f, extraArgs, fun) {
  var c;
  if(n === 1) {
    c = function(x) {
      var args = extraArgs.slice(0);
      var action = MK_AP1(fun, MK_JSVAL(x));
      args.unshift(action);
      return f.apply(this, args);
    }
  } else if (n === 2) {
    c = function(x,y) {
      var args = extraArgs.slice(0);
      var action = MK_AP2(fun, MK_JSVAL(x), MK_JSVAL(y));
      args.unshift(action);
      return f.apply(this, args);
    }
  } else if (n === 3) {
    c = function(x,y,z) {
      var args = extraArgs.slice(0);
      var action = MK_AP1(MK_AP2(fun, MK_JSVAL(x), MK_JSVAL(y)), MK_JSVAL(z));
      args.unshift(action);
      return f.apply(this, args);
    }
  } else {
    throw new Error("h$makeCallbackApply: unsupported arity");
  }
  c.root = fun;
  c._key = ++h$extraRootsN;
  h$extraRoots.add(c);
  return c;
}

function h$retain(c) {
  var k = c._key;
  if(typeof k !== 'number') throw new Error("retained object does not have a key");
  if(k === -1) c._key = ++h$extraRootsN;
  h$extraRoots.add(c);
}

function h$release(c) {
  h$extraRoots.remove(c);
}

function h$isInstanceOf(o,c) {
  return o instanceof c;
}

function h$getpagesize() {
  return 4096;
}

var h$MAP_ANONYMOUS = 0x20;
function h$mmap(addr_d, addr_o, len, prot, flags, fd, offset1, offset2) {
  if(flags & h$MAP_ANONYMOUS || fd === -1) {
    RETURN_UBX_TUP2(h$newByteArray(len), 0);
  } else {
    throw "h$mmap: mapping a file is not yet supported";
  }
}

function h$mprotect(addr_d, addr_o, size, prot) {
  return 0;
}

function h$munmap(addr_d, addr_o, size) {
  if(addr_d && addr_o === 0 && size >= addr_d.len) {
    addr_d.buf = null;
    addr_d.i3  = null;
    addr_d.u8  = null;
    addr_d.u1  = null;
    addr_d.f3  = null;
    addr_d.f6  = null;
    addr_d.dv  = null;
  }
  return 0;
}
