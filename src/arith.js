// var h$logArith = function() { log.apply(this,arguments); }
var h$logArith = function() { }

function h$hs_eqWord64(a1,a2,b1,b2) {
  return (a1===b1 && a2===b2) ? 1 : 0;
}

function h$hs_neWord64(a1,a2,b1,b2) {
  return (a1 !== b1 || a2 !== b2) ? 1 : 0;
}

function h$hs_word64ToWord(a1,a2) {
  return a2;
}

function h$hs_wordToWord64(w) {
  h$ret1 = w;
  return 0;
}

function h$hs_intToInt64(a) {
  h$ret1 = a;
  return (a < 0) ? -1 : 0;
}

function h$hs_int64ToWord64(a1,a2) {
  h$ret1 = a2;
  return a1;
}

function h$hs_word64ToInt64(a1,a2) {
  h$ret1 = a2;
  return a1;
}

function h$hs_int64ToInt(a1,a2) {
  return (a1 < 0) ? (a2 | 0x80000000) : (a2 & 0x7FFFFFFF);
}

function h$hs_negateInt64(a1,a2) {
  var c = goog.math.Long.fromBits(a2,a1).negate();
  h$ret1 = c.getLowBits();
  return c.getHighBits();
}

function h$hs_not64(a1,a2) {
  h$ret1 = ~a2;
  return ~a1;
}

function h$hs_xor64(a1,a2,b1,b2) {
  h$ret1 = a2 ^ b2;
  return a1 ^ b1;
}

function h$hs_and64(a1,a2,b1,b2) {
  h$ret1 = a2 & b2;
  return a1 & b1;
}

function h$hs_or64(a1,a2,b1,b2) {
  h$ret1 = a2 | b2;
  return a1 | b1;
}

function h$hs_eqInt64(a1,a2,b1,b2) {
  return (a1 === b1 && a2 === b2) ? 1 : 0;
}

function h$hs_neInt64(a1,a2,b1,b2) {
  return (a1 !== b1 || a2 !== b2) ? 1 : 0;
}

function h$hs_leInt64(a1,a2,b1,b2) {
  if(a1 === b1) {
    var a2s = a2 >>> 1;
    var b2s = b2 >>> 1;
    return (a2s < b2s || (a2s === b2s && ((a2&1) <= (b2&1)))) ? 1 : 0;
  } else {
    return (a1 < b1) ? 1 : 0;
  }
}

function h$hs_ltInt64(a1,a2,b1,b2) {
  if(a1 === b1) {
    var a2s = a2 >>> 1;
    var b2s = b2 >>> 1;
    return (a2s < b2s || (a2s === b2s && ((a2&1) < (b2&1)))) ? 1 : 0;
  } else {
    return (a1 < b1) ? 1 : 0;
  }
}

function h$hs_geInt64(a1,a2,b1,b2) {
  if(a1 === b1) {
    var a2s = a2 >>> 1;
    var b2s = b2 >>> 1;
    return (a2s > b2s || (a2s === b2s && ((a2&1) >= (b2&1)))) ? 1 : 0;
  } else {
    return (a1 > b1) ? 1 : 0;
  }
}

function h$hs_gtInt64(a1,a2,b1,b2) {
  if(a1 === b1) {
    var a2s = a2 >>> 1;
    var b2s = b2 >>> 1;
    return (a2s > b2s || (a2s === b2s && ((a2&1) > (b2&1)))) ? 1 : 0;
  } else {
    return (a1 > b1) ? 1 : 0;
  }
}

// fixme wrong
function h$hs_quotWord64(a1,a2,b1,b2) {
  var c = goog.math.Long.fromBits(a2,a1).div(goog.math.Long.fromBits(b2,b1));
  h$ret1 = c.getLowBits();
  return c.getHighBits();
}

function h$hs_timesInt64(a1,a2,b1,b2) {
  var c = goog.math.Long.fromBits(a2,a1).multiply(goog.math.Long.fromBits(b2,b1));
  h$ret1 = c.getLowBits();
  return c.getHighBits();
}

function h$hs_quotInt64(a1,a2,b1,b2) {
  var c = goog.math.Long.fromBits(a2,a1).div(goog.math.Long.fromBits(b2,b1));
  h$ret1 = c.getLowBits();
  return c.getHighBits();
}

function h$hs_remInt64(a1,a2,b1,b2) {
  var c = goog.math.Long.fromBits(a2,a1).modulo(goog.math.Long.fromBits(b2,b1));
  h$ret1 = c.getLowBits();
  return c.getHighBits();
}

function h$hs_plusInt64(a1,a2,b1,b2) {
  var c = goog.math.Long.fromBits(a2,a1).add(goog.math.Long.fromBits(b2,b1));
  h$ret1 = c.getLowBits();
  return c.getHighBits();
}

function h$hs_minusInt64(a1,a2,b1,b2) {
  var c = goog.math.Long.fromBits(a2,a1).subtract(goog.math.Long.fromBits(b2,b1));
  h$ret1 = c.getLowBits();
  return c.getHighBits();
}

function h$hs_leWord64(a1,a2,b1,b2) {
  if(a1 === b1) {
    var a2s = a2 >>> 1;
    var b2s = b2 >>> 1;
    return (a2s < b2s || (a2s === b2s && (a2&1 <= b2&1))) ? 1 : 0;
  } else {
    var a1s = a1 >>> 1;
    var b1s = b1 >>> 1;
    return (a1s < b1s || (a1s === b1s && (a1&1 <= b1&1))) ? 1 : 0;
  }
}

function h$hs_geWord64(a1,a2,b1,b2) {
  if(a1 === b1) {
    var a2s = a2 >>> 1;
    var b2s = b2 >>> 1;
    return (a2s > b2s || (a2s === b2s && (a2&1 >= b2&1))) ? 1 : 0;
  } else {
    var a1s = a1 >>> 1;
    var b1s = b1 >>> 1;
    return (a1s > b1s || (a1s === b1s && (a1&1 >= b1&1))) ? 1 : 0;
  }
}

function h$hs_uncheckedIShiftL64(a1,a2,n) {
  var num = new goog.math.Long(a2,a1).shiftLeft(n);
  h$ret1 = num.getLowBits();
  return num.getHighBits();
}

function h$hs_uncheckedIShiftRA64(a1,a2,n) {
  var num = new goog.math.Long(a2,a1).shiftRight(n);
  h$ret1 = num.getLowBits();
  return num.getHighBits();
}

// always nonnegative n?
function h$hs_uncheckedShiftL64(a1,a2,n) {
  n &= 63;
  if(n == 0) {
    h$ret1 = a2;
    return a1;
  } else if(n < 32) {
    h$ret1 = a2 << n;
    return (a1 << n) | (a2 >>> (32-n));
  } else {
    h$ret1 = 0;
    return ((a2 << (n-32))|0);
  }
}

function h$hs_uncheckedShiftRL64(a1,a2,n) {
  n &= 63;
  if(n == 0) {
    h$ret1 = a2;
    return a1;
  } else if(n < 32) {
    h$ret1 = (a2 >>> n ) | (a1 << (32-n));
    return a1 >>> n;
  } else {
    h$ret1 = a1 >>> (n-32);
    return 0;
  }
}

function h$imul_shim(a, b) {
    if(a < 0) {
      if(b < 0) {
        return h$imul_shim(-a,-b);
      } else {
        return -h$imul_shim(-a,b);
      }
    } else if(b < 0) {
        return -h$imul_shim(a,-b);
    }
    var ah  = (a >>> 16) & 0xffff;
    var al = a & 0xffff;
    var bh  = (b >>> 16) & 0xffff;
    var bl = b & 0xffff;
    // the shift by 0 fixes the sign on the high part
    // the final |0 converts the unsigned value into a signed value
    return (((al * bl)|0) + (((ah * bl + al * bh) << 16) >>> 0)|0);
}

var h$mulInt32 = Math.imul ? Math.imul : h$imul_shim;

// function h$mulInt32(a,b) {
//  return goog.math.Long.fromInt(a).multiply(goog.math.Long.fromInt(b)).getLowBits();
// }
// var hs_mulInt32 = h$mulInt32;

function h$mulWord32(a,b) {
  return new goog.math.Long(a,0).multiply(new goog.math.Long(b,0)).getLowBits();
}

function h$mul2Word32(a,b) {
  return new goog.math.Long(a,0).multiply(new goog.math.Long(b,0)).getLowBits();
}

function h$quotWord32(a,b) {
  return new goog.math.Long(a,0).div(new goog.math.Long(b,0)).getLowBits();
}

function h$remWord32(a,b) {
  return new goog.math.Long(a,0).modulo(new goog.math.Long(b,0)).getLowBits();
}

// this does an unsigned shift, is that ok?
function h$uncheckedShiftRL64(a1,a2,n) {
  if(n < 0) throw "unexpected right shift";
  n &= 63;
  if(n == 0) {
    h$ret1 = a2;
    return a1;
  } else if(n < 32) {
    h$ret1 = (a2 >>> n) | (a1 << (32 - n));
    return (a1 >>> n);
  } else {
    h$ret1 = a2 >>> (n - 32);
    return 0;
  }
}

function h$isDoubleNegativeZero(d) {
  return (d===0 && (1/d) === -Infinity) ? 1 : 0;
}

function h$isFloatNegativeZero(d) {
  return (d===0 && (1/d) === -Infinity) ? 1 : 0;
}

function h$isDoubleInfinite(d) {
  return (d === Number.NEGATIVE_INFINITY || d === Number.POSITIVE_INFINITY) ? 1 : 0;
}

function h$isFloatInfinite(d) {
  return (d === Number.NEGATIVE_INFINITY || d === Number.POSITIVE_INFINITY) ? 1 : 0;
}

function h$isFloatFinite(d) {
  return (d !== Number.NEGATIVE_INFINITY && d !== Number.POSITIVE_INFINITY && !isNaN(d)) ? 1 : 0;
}

function h$isDoubleFinite(d) {
  return (d !== Number.NEGATIVE_INFINITY && d !== Number.POSITIVE_INFINITY && !isNaN(d)) ? 1 : 0;
}

function h$isDoubleNaN(d) {
  return (isNaN(d)) ? 1 : 0;
}

function h$isFloatNaN(d) {
  return (isNaN(d)) ? 1 : 0;
}

function h$isDoubleDenormalized(d) {
  return (d !== 0 && Math.abs(d) < 2.2250738585072014e-308) ? 1 : 0;
}

function h$isFloatDenormalized(d) {
  return (d !== 0 && Math.abs(d) < 2.2250738585072014e-308) ? 1 : 0;
}

function h$decodeFloatInt(d) {
    if( d < 0 ) {
      return -h$decodeFloatInt(-d);
    }
    var exponent = Math.floor(Math.log(d) * 1.4426950408889634)-23; // 1/log(2)
    h$ret1 = exponent;
    return (d * Math.pow(2, -exponent)) | 0;
}

function h$decodeDouble2Int(d) {
   var sign = 1;
   if( d < 0 ) {
      d = -d;
      sign = -1;
    }
    var exponent = Math.floor(Math.log(d) * 1.4426950408889634); // 1/log(2)
    var mantissa = goog.math.Long.fromNumber(d * Math.pow(2, -exponent));
    h$ret1 = mantissa.getHighBits();
    h$ret2 = mantissa.getLowBits();
    h$ret3 = -exponent;
    return sign;
}

function h$rintDouble(a) {
    if(a < 0) {
      return -Math.round(-a);
    } else {
      return Math.round(a);
    }
}

function h$rintFloat(a) {
    if(a < 0) {
      return -Math.round(-a);
    } else {
      return Math.round(a);
    }
}

function h$acos(d) { return Math.acos(d); }
function h$acosf(f) { return Math.acos(f); }

function h$asin(d) { return Math.asin(d); }
function h$asinf(f) { return Math.asin(f); }

function h$atan(d) { return Math.atan(d); }
function h$atanf(f) { return Math.atan(f); }

function h$atan2(x,y) { return Math.atan2(x,y); }
function h$atan2f(x,y) { return Math.atan2(x,y); }

function h$cos(d) { return Math.cos(d); }
function h$cosf(f) { return Math.cos(f); }

function h$sin(d) { return Math.sin(d); }
function h$sinf(f) { return Math.sin(f); }

function h$tan(d) { return Math.tan(d); }
function h$tanf(f) { return Math.tan(f); }

function h$cosh(d) { return (Math.exp(d)+Math.exp(-d))/2; }
function h$coshf(f) { return h$cosh(f); }

function h$sinh(d) { return (Math.exp(d)-Math.exp(-d))/2; }
function h$sinhf(f) { return h$sinh(f); }

function h$tanh(d) { return (Math.exp(2*d)-1)/(Math.exp(2*d)+1); }
function h$tanhf(f) { return h$tanh(f); }

var h$popCntTab =
   [0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4,1,2,2,3,2,3,3,4,2,3,3,4,3,4,4,5,
    1,2,2,3,2,3,3,4,2,3,3,4,3,4,4,5,2,3,3,4,3,4,4,5,3,4,4,5,4,5,5,6,
    1,2,2,3,2,3,3,4,2,3,3,4,3,4,4,5,2,3,3,4,3,4,4,5,3,4,4,5,4,5,5,6,
    2,3,3,4,3,4,4,5,3,4,4,5,4,5,5,6,3,4,4,5,4,5,5,6,4,5,5,6,5,6,6,7,
    1,2,2,3,2,3,3,4,2,3,3,4,3,4,4,5,2,3,3,4,3,4,4,5,3,4,4,5,4,5,5,6,
    2,3,3,4,3,4,4,5,3,4,4,5,4,5,5,6,3,4,4,5,4,5,5,6,4,5,5,6,5,6,6,7,
    2,3,3,4,3,4,4,5,3,4,4,5,4,5,5,6,3,4,4,5,4,5,5,6,4,5,5,6,5,6,6,7,
    3,4,4,5,4,5,5,6,4,5,5,6,5,6,6,7,4,5,5,6,5,6,6,7,5,6,6,7,6,7,7,8];

function h$popCnt32(x) {
   return h$popCntTab[x&0xFF] +
          h$popCntTab[(x>>>8)&0xFF] +
          h$popCntTab[(x>>>16)&0xFF] +
          h$popCntTab[(x>>>24)&0xFF]
}

function h$popCnt64(x1,x2) {
   return h$popCntTab[x1&0xFF] +
          h$popCntTab[(x1>>>8)&0xFF] +
          h$popCntTab[(x1>>>16)&0xFF] +
          h$popCntTab[(x1>>>24)&0xFF] +
          h$popCntTab[x2&0xFF] +
          h$popCntTab[(x2>>>8)&0xFF] +
          h$popCntTab[(x2>>>16)&0xFF] +
          h$popCntTab[(x2>>>24)&0xFF];
}

// slice an array of heap objects
var h$sliceArray = /* ArrayBuffer.prototype.slice ?
  function(a, start, n) {
    return new Int32Array(a.buffer.slice(start, n));
  }
  : */
  function(a, start, n) {
    var tgt = [];
    for(var i=0;i<n;i++) {
      tgt[i] = a[start+i];
    }
    return tgt;
  }


function h$memcpy() {
  if(arguments.length === 3) {  // ByteArray# -> ByteArray# copy
    var dst = arguments[0];
    var src = arguments[1];
    var n   = arguments[2];
    for(var i=n-1;i>=0;i--) {
      dst.setUint8(i, src.getUint8(i));
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
      dst.setUint8(i+dst_off, src.getUint8(i+src_off));
    }
    ret1 = dst_off;
    return dst;
  } else {
    throw "memcpy: unexpected argument";
  }
}

function h$memchr(a_v, a_o, c, n) {
  for(var i=0;i<n;i++) {
    if(a_v.getUint8(a_o+i) === c) {
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
    if(a_v.getUint8(a_o+i) === 0) { return i; }
    i++;
  }
}

function h$fps_reverse(a_v, a_o, b_v, b_o, n) {
  for(var i=0;i<n;i++) {
    a_v.setUint8(a_o+n-i-1, b_v.getUint8(b_o+i));
  }
}

function h$fps_intersperse(a_v,a_o,b_v,b_o,n,c) {
  var dst_o = a_o;
  for(var i=0;i<n-1;i++) {
    a_v.setUint8(dst_o, b_v.getUint8(b_o+i));
    a_v.setUint8(dst_o+1, c);
    dst_o += 2;
  }
  if(n > 0) {
    a_v.setUint8(dst_o, b_v.getUint8(b_o+n-1));
  }
}

function h$fps_maximum(a_v,a_o,n) {
  var max = a_v.getUint8(a_o);
  for(var i=1;i<n;i++) {
    var c = a_v.getUint8(a_o+i);
    if(c > max) { max = c; }
  }
  return max;
}

function h$fps_minimum(a_v,a_o,n) {
  var min = a_v.getUint8(a_o);
  for(var i=1;i<n;i++) {
    var c = a_v.getUint8(a_o+i);
    if(c < min) { min = c; }
  }
  return min;
}

function h$fps_count(a_v,a_o,n,c) {
  var count = 0;
  for(var i=0;i<n;i++) {
    if(a_v.getUint8(a_o+i) === c) { count++; }
  }
  return count|0;
}

function h$newArray(len,e) {
  var r = [];
  for(var i=0;i<len;i++) { r[i] = e; }
  return r;
}

// try to compute a reasonably unique int key from object data
// used to calculate the StableName int
// note: be careful to not use any mutable properties for this
// - numbers directly on the heap shouldn't change
// - o.m >> 2 shouldn't change if it's nonzero
h$stableNameN = 1;
// semi-unique in the upper 14 bits of the .m thing
function h$getObjectKey(o) {
  var x = o.m;
  if(o.m >> 18 === 0) {
    o.m |= ++h$stableNameN << 18;
  }
  return o.m >> 18;
}

function h$getObjectHash(o) {
  if(o === null) {
    return 230948;
  } if(typeof o === 'number') {
    return o|0;
  } else if(typeof o === 'object' && o.hasOwnProperty('m') && typeof o.m === 'number') {
    return h$getObjectKey(o);
  } else {
    return 3456333333;
  }
}

function h$makeStableName(x) {
  return [x,x.f];
}

function h$stableNameInt(s) {
  return 0; // fixme
/*  var hash = 23;
  hash = (hash * 37 + h$getObjectKey(s.f))|0;
  hash = (hash * 37 + h$getObjectHash(s.d1))|0;
  hash = (hash * 37 + h$getObjectHash(s.d2))|0;
  return hash; */
}

function h$eqStableName(s1o,s2o) {
  var s1 = s1o[0];
  var s2 = s2o[0];
  var s1f = s1o[1];
  var s2f = s2o[1];
  return (s1f === s2f && (s1 === s2 || (s1.f === s2.f && s1.d1 === s2.d1 && s1.d2 === s2.d2)))?1:0;
}

function h$makeStablePtr(v) {
  var buf = new DataView(new ArrayBuffer(4));
  buf.arr = [v];
  h$ret1 = 0;
  return buf;
}

function h$hs_free_stable_ptr(stable) {

}

function h$malloc(n) {
  h$ret1 = 0;
  return new DataView(new ArrayBuffer(n));
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
    buf_v.setUint8(i, chr);
  }
  ret1 = buf_off;
  return buf_v;
}

function h$memcmp(a_v, a_o, b_v, b_o, n) {
  for(var i=0;i<n;i++) {
    var a = a_v.getUint8(a_o+i);
    var b = b_v.getUint8(b_o+i);
    var c = a-b;
    if(c !== 0) { return c; }
  }
  return 0;
}

function h$mkFunctionPtr(f) {
  var d = new DataView(new ArrayBuffer(4));
  d.arr = [f];
  return d;
}

function h$isInstanceOf(o,c) {
  return o instanceof c;
}
