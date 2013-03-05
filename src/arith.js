// var logArith = function() { log.apply(this,arguments); }
var logArith = function() { }

function hs_eqWord64(a1,a2,b1,b2) {
  logArith("### hs_eqWord64: " + a1 + " " + a2 + " <-> " + b1 + " " + b2);
  return (a1===b1 && a2===b2) ? 1 : 0;
}

function hs_neWord64(a1,a2,b1,b2) {
  logArith("### hs_neWord64: " + a1 + " " + a2 + " != " + b1 + " " + b2);
  return (a1 !== b1 || a2 !== b2) ? 1 : 0;
}

function hs_word64ToWord(a1,a2) {
  logArith("### hs_word64ToWord: " + a1 + " " + a2);
  return a2;
}

function hs_wordToWord64(w) {
  logArith("### hs_wordToWord64: " + w);
  ret1 = w;
  return 0;
}

function hs_intToInt64(a) {
  logArith("### hs_intToInt64: " + a);
  ret1 = a;
  return (a < 0) ? -1 : 0;
}

function hs_int64ToWord64(a1,a2) {
  logArith("### hs_int64ToWord64: " + a1 + " " + a2);
  ret1 = a2;
  return a1;
}

function hs_word64ToInt64(a1,a2) {
  logArith("### hs_word64ToInt64: " + a1 + " " + a2);
  ret1 = a2;
  return a1;
}

function hs_int64ToInt(a1,a2) {
  logArith("### hs_int64ToInt: " + a1 + " " + a2);
  return (a1 < 0) ? (a2 | 0x80000000) : (a2 & 0x7FFFFFFF);
}

function hs_negateInt64(a1,a2) {
  logArith("### hs_negateInt64: " + a1 + " " + a2);
  var c = goog.math.Long.fromBits(a2,a1).negate();
  ret1 = c.getLowBits();
  return c.getHighBits();
}

function hs_not64(a1,a2) {
  logArith("### hs_not64: " + a1 + " " + a2);
  ret1 = ~a2;
  return ~a1;
}

function hs_xor64(a1,a2,b1,b2) {
  logArith("### hs_xor64: " + a1 + " " + a2 + " ^ " + b1 + " " + b2);
  ret1 = a2 ^ b2;
  return a1 ^ b1;
}

function hs_and64(a1,a2,b1,b2) {
  logArith("### hs_and64: " + a1 + " " + a2 + " & " + b1 + " " + b2);
  ret1 = a2 & b2;
  return a1 & b1;
}

function hs_or64(a1,a2,b1,b2) {
  logArith("### hs_or64: " + a1 + " " + a2 + " | " + b1 + " " + b2);
  ret1 = a2 | b2;
  return a1 | b1;
}

function hs_eqInt64(a1,a2,b1,b2) {
  logArith("### hs_eqInt64: " + a1 + " " + a2 + " == " + b1 + " " + b2);
  return (a1 === b1 && a2 === b2) ? 1 : 0;
}

function hs_neInt64(a1,a2,b1,b2) {
  logArith("### hs_eqInt64: " + a1 + " " + a2 + " == " + b1 + " " + b2);
  return (a1 !== b1 || a2 !== b2) ? 1 : 0;
}

function hs_leInt64(a1,a2,b1,b2) {
  logArith("### hs_leInt64: " + a1 + " " + a2 + " <= " + b1 + " " + b2);
  if(a1 === b1) {
    var a2s = a2 >>> 1;
    var b2s = b2 >>> 1;
    return (a2s < b2s || (a2s === b2s && (a2&1 <= b2&1))) ? 1 : 0;
  } else {
    return (a1 < b1) ? 1 : 0;
  }
}

function hs_ltInt64(a1,a2,b1,b2) {
  logArith("### hs_ltInt64: " + a1 + " " + a2 + " < " + b1 + " " + b2);
  if(a1 === b1) {
    var a2s = a2 >>> 1;
    var b2s = b2 >>> 1;
    return (a2s < b2s || (a2s === b2s && (a2&1 < b2&1))) ? 1 : 0;
  } else {
    return (a1 < b1) ? 1 : 0;
  }
}

function hs_geInt64(a1,a2,b1,b2) {
  logArith("### hs_geInt64: " + a1 + " " + a2 + " >= " + b1 + " " + b2);
  if(a1 === b1) {
    var a2s = a2 >>> 1;
    var b2s = b2 >>> 1;
    return (a2s > b2s || (a2s === b2s && (a2&1 >= b2&1))) ? 1 : 0;
  } else {
    return (a1 > b1) ? 1 : 0;
  }
}

function hs_gtInt64(a1,a2,b1,b2) {
  logArith("### hs_geInt64: " + a1 + " " + a2 + " > " + b1 + " " + b2);
  if(a1 === b1) {
    var a2s = a2 >>> 1;
    var b2s = b2 >>> 1;
    return (a2s > b2s || (a2s === b2s && (a2&1 > b2&1))) ? 1 : 0;
  } else {
    return (a1 > b1) ? 1 : 0;
  }
}

// fixme wrong
function hs_quotWord64(a1,a2,b1,b2) {
  logArith("### quotWord64: " + a1 + " " + a2 + " / " + b1 + " " + b2);
  var c = goog.math.Long.fromBits(a2,a1).div(goog.math.Long.fromBits(b2,b1));
  ret1 = c.getLowBits();
  return c.getHighBits();
}

function hs_timesInt64(a1,a2,b1,b2) {
  logArith("### hs_timesInt64: " + a1 + " " + a2 + " * " + b1 + " " + b2);
  var c = goog.math.Long.fromBits(a2,a1).multiply(goog.math.Long.fromBits(b2,b1));
  ret1 = c.getLowBits();
  return c.getHighBits();
}

function hs_quotInt64(a1,a2,b1,b2) {
  logArith("### quotInt64: " + a1 + " " + a2 + " / " + b1 + " " + b2);
  var c = goog.math.Long.fromBits(a2,a1).div(goog.math.Long.fromBits(b2,b1));
  ret1 = c.getLowBits();
  return c.getHighBits();
}

function hs_plusInt64(a1,a2,b1,b2) {
  logArith("### hs_plusInt64: " + a1 + " " + a2 + " + " + b1 + " " + b2);
  var c = goog.math.Long.fromBits(a2,a1).add(goog.math.Long.fromBits(b2,b1));
  ret1 = c.getLowBits();
  return c.getHighBits();
}

function hs_minusInt64(a1,a2,b1,b2) {
  logArith("### hs_minusInt64: " + a1 + " " + a2 + " - " + b1 + " " + b2);
  var c = goog.math.Long.fromBits(a2,a1).subtract(goog.math.Long.fromBits(b2,b1));
  ret1 = c.getLowBits();
  return c.getHighBits();
}

function hs_leWord64(a1,a2,b1,b2) {
  logArith("### hs_leWord64: " + a1 + " " + a2 + " <= " + b1 + " " + b2);
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

function hs_geWord64(a1,a2,b1,b2) {
  logArith("### hs_geWord64: " + a1 + " " + a2 + " >= " + b1 + " " + b2);
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

function hs_uncheckedIShiftL64(a1,a2,n) {
  logArith("### hs_uncheckedIShiftL64: " + a1 + " " + a2 + " << " + n); // correct?
  var num = new goog.math.Long(a2,a1).shiftLeft(n);
  ret1 = num.getLowBits();
  return num.getHighBits();
}

function hs_uncheckedIShiftRA64(a1,a2,n) {
  logArith("### hs_uncheckedIShiftRA64: " + a1 + " " + a2 + " " + n);
  var num = new goog.math.Long(a2,a1).shiftRight(n);
  ret1 = num.getLowBits();
  return num.getHighBits();
}

// always nonnegative n?
function hs_uncheckedShiftL64(a1,a2,n) {
  logArith("### hs_uncheckedShiftL64: " + a1 + " " + a2 + " << " + n); // correct?
  n &= 63;
  if(n == 0) {
    ret1 = a2;
    return a1;
  } else if(n < 32) {
    ret1 = a2 << n;
    return (a1 << n) | (a2 >>> (32-n));
  } else {
    ret1 = 0;
    return ((a2 << (n-32))|0);
  }
}

function hs_uncheckedShiftRL64(a1,a2,n) {
  logArith("### hs_uncheckedShiftL64: " + a1 + " " + a2 + " >>> " + n); // correct?
  n &= 63;
  if(n == 0) {
    ret1 = a2;
    return a1;
  } else if(n < 32) {
    ret1 = (a2 >>> n ) | (a1 << (32-n));
    return a1 >>> n;
  } else {
    ret1 = a1 >>> (n-32);
    return 0;
  }
}

// fixme: since we only supply the low 32 bit words, the multiplication can be done more efficiently
function h$mulInt32(a,b) {
  logArith("### hs_mulInt32: " + a + " " + b); // correct?
  var res = goog.math.Long.fromInt(a).multiply(goog.math.Long.fromInt(b)).getLowBits();
  logArith("### result: " + res);
  return res;
}
var hs_mulInt32 = h$mulInt32;

function h$mulWord32(a,b) {
  logArith("### hs_mulWord32: " + a + " " + b); // correct?
  return goog.math.Long.fromInt(a).multiply(goog.math.Long.fromInt(b)).getLowBits();
}

function h$mul2Word32(a,b) {
  logArith("### hs_mul2Word32: " + a + " " + b); // correct?
  return new goog.math.Long(a,0).multiply(new goog.math.Long(b,0)).getLowBits();
}

function h$quotWord32(a,b) {
  logArith("### hs_quotWord32: " + a + " " + b);
  var res = new goog.math.Long(a,0).div(new goog.math.Long(b,0)).getLowBits();
  logArith("### result: " + res);
  return res;
}

function h$remWord32(a,b) {
  logArith("### hs_remWord32: " + a + " " + b);
  var res = new goog.math.Long(a,0).modulo(new goog.math.Long(b,0)).getLowBits();
  logArith("### result: " + res);
  return res;
}

// this does an unsigned shift, is that ok?
function h$uncheckedShiftRL64(a1,a2,n) {
  logArith("### hs_uncheckedShiftRL64: " + a1 + " " + a2 + " >> " + n);
  if(n < 0) throw "unexpected right shift";
  n &= 63;
  if(n == 0) {
    ret1 = a2;
    return a1;
  } else if(n < 32) {
    ret1 = (a2 >>> n) | (a1 << (32 - n));
    return (a1 >>> n);
  } else {
    ret1 = a2 >>> (n - 32);
    return 0;
  }
}

function isDoubleNegativeZero(d) {
  logArith("### isDoubleNegativeZero: " + d);
  return (d===0 && (1/d) === -Infinity) ? 1 : 0;
}

function isFloatNegativeZero(d) {
  logArith("### isFloatNegativeZero: " + d);
  return (d===0 && (1/d) === -Infinity) ? 1 : 0;
}

function isDoubleInfinite(d) {
  logArith("### isDoubleInfinite: " + d);
  return (d === Number.NEGATIVE_INFINITY || d === Number.POSITIVE_INFINITY) ? 1 : 0;
}

function isFloatInfinite(d) {
  logArith("### isFloatInfinite: " + d);
  return (d === Number.NEGATIVE_INFINITY || d === Number.POSITIVE_INFINITY) ? 1 : 0;
}

function isFloatFinite(d) {
  logArith("### isFloatFinite: " + d);
  return (d !== Number.NEGATIVE_INFINITY && d !== Number.POSITIVE_INFINITY && !isNaN(d)) ? 1 : 0;
}

function isDoubleFinite(d) {
  logArith("### isDoubleFinite: " + d);
  return (d !== Number.NEGATIVE_INFINITY && d !== Number.POSITIVE_INFINITY && !isNaN(d)) ? 1 : 0;
}

function isDoubleNaN(d) {
  logArith("### isDoubleNaN: " + d);
  logArith("### " + ((isNaN(d)) ? 1 : 0));
  return (isNaN(d)) ? 1 : 0;
}

function isFloatNaN(d) {
  logArith("### isFloatNaN: " + d);
  return (isNaN(d)) ? 1 : 0;
}

function isDoubleDenormalized(d) {
  logArith("### isDoubleDenormalized: " + d);
  return (d !== 0 && Math.abs(d) < 2.2250738585072014e-308) ? 1 : 0;
}

function isFloatDenormalized(d) {
  logArith("### isFloatDenormalized: " + d);
  return (d !== 0 && Math.abs(d) < 2.2250738585072014e-308) ? 1 : 0;
}

function h$decodeFloatInt(d) {
    logArith("### h$decodeFloatInt: " + d);
    if( d < 0 ) {
      var r0 = -h$decodeFloatInt(-d);
      logArith("### result: " + r0 + ", " + ret1);
      return r0;
    }
    var exponent = Math.floor(Math.log(d) * 1.4426950408889634)-23; // 1/log(2)
    ret1 = exponent;
    var r = (d * Math.pow(2, -exponent)) | 0;
    logArith("### result: " + r + ", " + ret1);
    return r;
}

function h$decodeDouble2Int(d) {
   logArith("### h$decodeDoubleInt: " + d);
   var sign = 1;
   if( d < 0 ) {
      d = -d;
      sign = -1;
    }
    var exponent = Math.floor(Math.log(d) * 1.4426950408889634); // 1/log(2)
    var mantissa = goog.math.Long.fromNumber(d * Math.pow(2, -exponent));
    ret1 = mantissa.getHighBits();
    ret2 = mantissa.getLowBits();
    ret3 = -exponent;
//    log("### result: " + sign + " " + ret1 + " " + ret2 + " " + ret3)
    return sign;
}

function rintDouble(a) {
    if(a < 0) {
      return -Math.round(-a);
    } else {
      return Math.round(a);
    }
}

function rintFloat(a) {
    if(a < 0) {
      return -Math.round(-a);
    } else {
      return Math.round(a);
    }
}

function sin(d) {
  return Math.sin(d);
}

function cos(d) {
  return Math.cos(d);
}

var h$popCntTab =
   [0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4,1,2,2,3,2,3,3,4,2,3,3,4,3,4,4,5,
    1,2,2,3,2,3,3,4,2,3,3,4,3,4,4,5,2,3,3,4,3,4,4,5,3,4,4,5,4,5,5,6,
    1,2,2,3,2,3,3,4,2,3,3,4,3,4,4,5,2,3,3,4,3,4,4,5,3,4,4,5,4,5,5,6,
    2,3,3,4,3,4,4,5,3,4,4,5,4,5,5,6,3,4,4,5,4,5,5,6,4,5,5,6,5,6,6,7,
    1,2,2,3,2,3,3,4,2,3,3,4,3,4,4,5,2,3,3,4,3,4,4,5,3,4,4,5,4,5,5,6,
    2,3,3,4,3,4,4,5,3,4,4,5,4,5,5,6,3,4,4,5,4,5,5,6,4,5,5,6,5,6,6,7,
    2,3,3,4,3,4,4,5,3,4,4,5,4,5,5,6,3,4,4,5,4,5,5,6,4,5,5,6,5,6,6,7,
    3,4,4,5,4,5,5,6,4,5,5,6,5,6,6,7,4,5,5,6,5,6,6,7,5,6,6,7,6,7,7,8];

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


function memcpy() {
  if(arguments.length === 3) {  // ByteArray# -> ByteArray# copy
    var dst = arguments[0];
    var src = arguments[1];
    var n   = arguments[2];
    for(var i=n-1;i>=0;i--) {
      dst.setUint8(i, src.getUint8(i));
    }
  } else if(arguments.length === 5) { // Addr# -> Addr# copy
    var dst = arguments[0];
    var dst_off = arguments[1]
    var src = arguments[2];
    var src_off = arguments[3];
    var n   = arguments[4];
    for(var i=n-1;i>=0;i--) {
      dst.setUint8(i+dst_off, src.getUint8(i+src_off));
    }
  } else {
    throw "unexpected memcpy";
  }
}

function h$newArray(len,e) {
  var r = [];
  for(var i=0;i<len;i++) { r[i] = e; }
  return r;
}

var h$stableNameN = 0;
var h$stableNames = new WeakMap();
function h$stableNameInt(s) {
  if(h$stableNames.has(s)) {
    return h$stableNames.get(s);
  } else {
    h$stableNameN = (h$stableNameN+1)|0;
    h$stableNames.set(s, h$stableNameN);
  }
}

