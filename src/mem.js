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
function h$stc(i,c,ccs) {
#else
function h$stc(i,c) {
#endif
    i.f = c;
#ifdef GHCJS_PROF
    i.cc = ccs;
#endif
    h$init_closure(i,[]);
    h$CAFs.push(i);
    h$CAFsReset.push(i.f);
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
#ifdef GHCJS_PROF
            r = h$c2(h$ghczmprimZCGHCziTypesziZC_con_e, x, r, ccs);
#else
            r = h$c2(h$ghczmprimZCGHCziTypesziZC_con_e, x, r);
#endif
        }
    }
    o.f  = r.f;
    o.d1 = r.d1;
    o.d2 = r.d2;
    o.m  = r.m;
#ifdef GHCJS_PROF
    o.cc = ccs;
#endif
}

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
        var n, n1, n2;
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
                return nextSignificand() * Math.pow(2, n1)
            default:
                n1 = n - 36;
                return nextSignificand() * Math.pow(2, n1);
            }
        case 7:
            TRACE_META("string arg: fixme implement");
            throw "string arg";
            return ""; // fixme haskell string
        case 8:
            TRACE_META("binary arg");
            n = next();
            var ba = h$newByteArray(n);
            var b8 = ba.u8;
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
        ot           = 1
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
          break;
      case 2:  // staticThunk
          TRACE_META("staticThunk");
          o.f = nextEntry();
          h$CAFs.push(o);
          h$CAFsReset.push(o.f);
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
          o.f = h$ghczmprimZCGHCziTypesziZMZN.f;
          break;
      case 9: // staticList
          TRACE_META("staticList");
          n = next();
          var hasTail = next();
          var c = (hasTail === 1) ? nextObj() : h$ghczmprimZCGHCziTypesziZMZN;
          TRACE_META("list length: " + n);
          while(n--) {
              c = h$c2(h$ghczmprimZCGHCziTypesziZC_con_e, nextArg(), c);
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
    ret1 = 0;
    return dst;
  } else if(arguments.length === 5) { // Addr# -> Addr# copy
    var dst = arguments[0];
    var dst_off = arguments[1]
    var src = arguments[2];
    var src_off = arguments[3];
    var n   = arguments[4];
    for(var i=n-1;i>=0;i--) {
      dst.u8[i+dst_off] = src.u8[i+src_off];
    }
    ret1 = dst_off;
    return dst;
  } else {
    throw "h$memcpy: unexpected argument";
  }
}

// note: only works for objects bigger than two!
function h$setField(o,n,v) {
    if(n > 0 && !o.d2) o.d2 = {};
    if (n == 0) {
        o.d1 = v;
        return;
    } else {
        o.d2['d' + n] = v;
        return;
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
      h$ret1 = a_o+i;
      return a_v;
    }
  }
  h$ret1 = 0;
  return null;
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
  extension. Return a JSRef instead and use unsafeCoerce
  to convert it to a Data.Primitive.ByteArray.ByteArray or
  Data.Primitive.ByteArray.MutableByteArray (primitive package)
  and pattern match on the constructor to get the
  primitive value out.

  These types have the same runtime representation (a data
  constructor with one regular (one JavaScript variable)
  field) as a JSRef, so the conversion is safe, as long
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

var h$stableNameN = 1;
/** @constructor */
function h$StableName(m) {
    this.m = m;
    this.s = null;
}

function h$makeStableName(x) {
    if(typeof x === 'object') {
        if(typeof x.m !== 'object') {
            x.m = new h$StableName(x.m);
        }
        return x.m;
    } else {
        return new h$StableName(0);
    }
}

function h$stableNameInt(s) {
    var x = s.s;
    if(x === null) {
        x = s.s = h$stableNameN = (h$stableNameN+1)|0;
    }
    return x;
}

function h$eqStableName(s1o,s2o) {
    return s1o === s2o ? 1 : 0;
}

function h$makeStablePtr(v) {
  var buf = h$newByteArray(4);
  buf.arr = [v];
  h$ret1 = 0;
  return buf;
}

function h$hs_free_stable_ptr(stable) {

}

function h$malloc(n) {
  h$ret1 = 0;
  return h$newByteArray(n);
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
  ret1 = buf_off;
  return buf_v;
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
  h$ret1 = a_o;
  return a_v;
}
function h$mkPtr(v, o) {
  return h$c2(h$baseZCGHCziPtrziPtr_con_e, v, o);
};
function h$mkFunctionPtr(f) {
  var d = h$newByteArray(4);
  d.arr = [f];
  return d;
}
var h$freeHaskellFunctionPtr = function () {
}
/*
function h$createAdjustor(cconv, hptr, hptr_2, wptr, wptr_2, type) {
    h$ret1 = hptr_2;
    return hptr;
};
*/

// extra roots for the heap scanner: objects with root property
var h$extraRootsN = 0;
var h$extraRoots = new h$Set();

// 
var h$domRoots = new h$Set();

function h$makeCallback(retain, f, extraArgs, action) {
    var args = extraArgs.slice(0);
    args.unshift(action);
    var c = function() {
        return f.apply(this, args);
    }
    if(retain === true) {
        c._key = ++h$extraRootsN;
        c.root = action;
        h$extraRoots.add(c);
    } else if(retain) { // DOM retain

    }
    return c;
}

function h$makeCallbackApply(retain, n, f, extraArgs, fun) {
  var c;
  if(n === 1) {
    c = function(x) {
      var args = extraArgs.slice(0);
      var action = h$c2(h$ap1_e, fun, h$mkJSRef(x));
      args.unshift(action);
      return f.apply(this, args);
    }
  } else if (n === 2) {
    c = function(x,y) {
      var args = extraArgs.slice(0);
      var action = h$c3(h$ap2_e, fun, h$mkJSRef(x), h$mkJSRef(y));
      args.unshift(action);
      return f.apply(this, args);
    }
  } else {
    throw "h$makeCallbackApply: unsupported arity";
  }
  if(retain === true) {
      c.root = fun;
      c._key = ++h$extraRootsN;
      h$extraRoots.add(c);
  } else if(retain) {
    // fixme: retain this while `retain' is in some DOM
  } else {
    // no retainer
  }
  return c;
}

function h$mkJSRef(x) {
  return h$c1(h$ghcjszmprimZCGHCJSziPrimziJSRef_con_e, x);
}

// fixme these don't guarantee that the object has a key!
function h$retain(c) {
  h$extraRoots.add(c);
}

function h$retainDom(d, c) {
  h$domRoots.add(c);
  c.domRoots = new h$Set();
}

function h$releasePermanent(c) {
  h$extraRoots.remove(c);
}

function h$release(c) {
  h$extraRoots.remove(c);
  h$domRoots.remove(c);
}

function h$releaseDom(c,d) {
  if(c.domRoots) c.domRoots.remove(d);
  if(!c.domRoots || c.domRoots.size() == 0) h$domRoots.remove(c);
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
    h$ret1 = 0;
    return h$newByteArray(len);
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
