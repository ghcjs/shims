/* 
   Integer and integer-gmp support
   partial GMP emulation

   note: sign behaves different from real gmp sign,
         value is always zero, don't use it for comparisons
*/

var h$logInt = function() { log.apply(log,arguments); }
// var h$logInt = function() { }
BigInteger.prototype.am = am3;
dbits = 28;
DV = (1<<dbits);
BigInteger.prototype.DB = dbits;
BigInteger.prototype.DM = ((1<<dbits)-1);
BigInteger.prototype.DV = (1<<dbits);
var BI_FP = 52;
BigInteger.prototype.FV = Math.pow(2,BI_FP);
BigInteger.prototype.F1 = BI_FP-dbits;
BigInteger.prototype.F2 = 2*dbits-BI_FP;

h$bigZero = nbv(0);
h$bigOne = nbv(1); // new BigInteger([1]);
h$bigCache = [];
for(var i=0;i<=100;i++) {
  h$bigCache.push(nbv(i));
}
// convert a value to a BigInt
function h$bigFromInt(v) {
//  h$logInt("### h$bigFromInt: " + v);
  var v0 = v|0;
  if(v0 >= 0) {
    if(v0 <= 100) {
      return h$bigCache[v0];
    } else if(v0 < 268435456) { // 67108864) { // guaranteed to fit in one digit
      return nbv(v0);
    }
    var r1 = nbv(v0 >>> 16);
    var r2 = nbi();
    r1.lShiftTo(16,r2);
    r1.fromInt(v0 & 0xffff);
    var r3 = r1.or(r2);
//    h$logInt("### result: " + r3.toString());
    return r3;
  } else {
    v0 = -v0;
    if(v0 < 268435456) { // 67108864) {
      return nbv(v0).negate();
    }
    var r1 = nbv(v0 >>> 16);
    var r2 = nbi();
    r1.lShiftTo(16,r2);
    r1.fromInt(v0 & 0xffff);
    var r3 = r1.or(r2);
    BigInteger.ZERO.subTo(r3,r2);
//    h$logInt("### result: " + r2.toString());
    return r2;
  }
}

function h$bigFromWord(v) {
//  h$logInt("### h$bigFromWord: " + v);
  var v0 = v|0;
  if(v0 >= 0) {
    if(v0 <= 100) {
      return h$bigCache[v0];
    } else if(v0 < 268435456) { // 67108864) { // guaranteed to fit in one digit
      return nbv(v0);
    }
  }
  var r1 = nbv(v0 & 0xffff);
  var r2 = nbv(0);
  r1.lShiftTo(16,r2);
  r1.fromInt(v0 >>> 16);
  var r = r1.or(r2);
//  h$logInt("### result: " + r.toString());
  return r;
}

function h$bigFromInt64(v1,v2) {
//  h$logInt("### h$bigFromInt64: " + v1 + " " + v2);
  var v10 = v1|0;
  var v20 = v2|0;
  var r = new BigInteger([ v10 >>  24, (v10 & 0xff0000) >> 16, (v10 & 0xff00) >> 8, v10 & 0xff
                         , v20 >>> 24, (v20 & 0xff0000) >> 16, (v20 & 0xff00) >> 8, v20 & 0xff
                         ]);
//  h$logInt("### result: " + r.toString());
  return r;
}

function h$bigFromWord64(v1,v2) {
//  h$logInt("### h$bigFromWord64: " + v1 + " " + v2);
  var v10 = v1|0;
  var v20 = v2|0;
  var arr = [ 0, v10 >>> 24, (v10 & 0xff0000) >> 16, (v10 & 0xff00) >> 8, v10 & 0xff
                         , v20 >>> 24, (v20 & 0xff0000) >> 16, (v20 & 0xff00) >> 8, v20 & 0xff
                         ];
//  h$logInt(arr);
  var r = new BigInteger([ 0, v10 >>> 24, (v10 & 0xff0000) >> 16, (v10 & 0xff00) >> 8, v10 & 0xff
                         , v20 >>> 24, (v20 & 0xff0000) >> 16, (v20 & 0xff00) >> 8, v20 & 0xff
                         ]);
//  h$logInt("### result: " + r.toString());
  return r;
}

function h$bigFromNumber(n) {
  var ra = [];
  var s = 0;
  if(n < 0) {
    n = -n;
    s = -1;
  }
  var b = 1;
  while(n >= b) {
    ra.unshift((n/b)&0xff);
    b *= 256;
  }
  ra.unshift(s);
  return new BigInteger(ra);
}

function h$encodeNumber(big,e) {
  var m = Math.pow(2,e);
  if(m === Infinity) {
    switch(big.signum()) {
      case 1: return Infinity;
      case 0: return 0;
      default: return -Infinity;
    }
  }
  var b = big.toByteArray();
  var l = b.length;
  var r = 0;
//  h$logInt(b);
  for(var i=l-1;i>=1;i--) {
//    h$logInt("### i: " + i + " b[i] " + b[i]);
    r += m * Math.pow(2,(l-i-1)*8) * (b[i] & 0xff);
//    h$logInt(r);
  }
  // last one signed
  if(b[0] != 0) {
    r += m * Math.pow(2,(l-1)*8) * b[0];
  }
//  h$logInt(r);
//  h$logInt("### result: " + r);
  return r;
}

function h$integer_cmm_cmpIntegerzh(sa, abits, sb, bbits) {
  var c = abits.compareTo(bbits);
  return c == 0 ? 0 : c > 0 ? 1 : -1;
}

function h$integer_cmm_cmpIntegerIntzh(sa, abits, b) {
  var res = abits.compareTo(h$bigFromInt(b));
  return res;
}

function h$integer_cmm_plusIntegerzh(sa, abits, sb, bbits) {
    h$ret1 = abits.add(bbits);
    return 0;
}

function h$integer_cmm_minusIntegerzh(sa, abits, sb, bbits) {
    h$ret1 = abits.subtract(bbits);
    return 0;
}

function h$integer_cmm_timesIntegerzh(sa, abits, sb, bbits) {
    h$ret1 = abits.multiply(bbits);
    return 0;
}

// fixme make more efficient, divideRemainder
function h$integer_cmm_quotRemIntegerzh(sa, abits, sb, bbits) {
    var q = abits.divide(bbits);
//    h$logInt("### q: " + q.toString());
    var r = abits.subtract(q.multiply(bbits));
//    h$logInt("### r: " + r.toString());
    h$ret1 = q;
    h$ret2 = 0;
    h$ret3 = r;
    return 0;
}

function h$integer_cmm_quotIntegerzh(sa, abits, sb, bbits) {
    h$ret1 = abits.divide(bbits);
    return 0;
}

function h$integer_cmm_remIntegerzh(sa, abits, sb, bbits) {
    h$ret1 = abits.mod(bbits);
//    h$logInt("### result: " + ret1.toString());
    return 0;
}

function h$integer_cmm_divModIntegerzh(sa, abits, sb, bbits) {
    var d = abits.divide(bbits);
    var m = abits.subtract(d.multiply(bbits));
    if(abits.signum()!==bbits.signum() && m.signum() !== 0) {
        d = d.subtract(h$bigOne);
        m = m.add(b);
    }
    h$ret1 = d;
    h$ret2 = 0;
    h$ret3 = m;
    return 0;
}

function h$integer_cmm_divIntegerzh(sa, abits, sb, bbits) {
    var d = abits.divide(bbits);
    var m = abits.subtract(d.multiply(bbits));
    if(abits.signum()!==bbits.signum() && m.signum() !== 0) {
        d = d.subtract(h$bigOne);
    }
    h$ret1 = d;
    return 0;
}

function h$integer_cmm_modIntegerzh(sa, abits, sb, bbits) {
    var d = abits.divide(bbits);
    var m = abits.subtract(d.multiply(bbits));
    if(abits.signum()!==bbits.signum() && m.signum() !== 0) {
        m = m.add(bbits);
    }
    h$ret1 = m;
    return 0;
}
function h$integer_cmm_divExactIntegerzh(sa, abits, sb, bbits) {
    h$ret1 = abits.divide(bbits);
    return 0;
}

function h$gcd(a, b) {
    var x = a.abs();
    var y = b.abs();
    var big, small;
    if(x.compareTo(y) < 0) {
        small = x;
        big = y;
    } else {
        small = y;
        big = x;
    }
    while(small.signum() !== 0) {
        var q = big.divide(small);
        var r = big.subtract(q.multiply(small));
        big = small;
        small = r;
    }
    return big;
}

function h$integer_cmm_gcdIntegerzh(sa, abits, sb, bbits) {
    h$ret1 = h$gcd(abits, bbits);
    return 0;
}

function h$integer_cmm_gcdIntegerIntzh(sa, abits, b) {
    var r = h$gcd(abits, h$bigFromInt(b));
    return r.intValue();
}

function h$integer_cmm_gcdIntzh(a, b) {
        var x = a<0 ? -a : a;
        var y = b<0 ? -b : b;
        var big, small;
        if(x<y) {
            small = x;
            big = y;
        } else {
            small = y;
            big = x;
        }
        while(small!==0) {
            var r = big % small;
            big = small;
            small = r;
        }
        return big;
}

var h$oneOverLog2 = 1 / Math.log(2);

function h$integer_cmm_decodeDoublezh(x) {
    if( x < 0 ) {
        var result = h$integer_cmm_decodeDoublezh(-x);
        h$ret2 = h$ret2.negate();
        h$ret1 = h$ret2.signum();
        return result;
    }
    var exponent = Math.floor(Math.log(x) * h$oneOverLog2)-52;
    var n;
    // prevent overflow
    if(exponent < -1000) {
      n = x * Math.pow(2,-exponent-128) * Math.pow(2,128);
    } else if(exponent > 900) {
      n = x * Math.pow(2,-exponent+128) * Math.pow(2,-128);
    } else {
      n = x * Math.pow(2,-exponent);
    }
    // fixup precision, do we also need the other way (exponent++) ?
    if(Math.abs(n - Math.floor(n) - 0.5) < 0.0001) {
      exponent--;
      n *= 2;
    }
    h$ret2 = h$bigFromNumber(n);
    h$ret1 = 0;
    return exponent;
}

function h$integer_cmm_int2Integerzh(i) {
    h$ret1 = h$bigFromInt(i);
    return 0;
}

function h$integer_cmm_word2Integerzh(i) {
    h$ret1 = h$bigFromWord(i);
    return 0;
}

function h$integer_cmm_andIntegerzh(sa, abits, sb, bbits) {
    h$ret1 = abits.and(bbits);
    return 0;
}

function h$integer_cmm_orIntegerzh(sa, abits, sb, bbits) {
    h$ret1 = abits.or(bbits);
    return 0;
}

function h$integer_cmm_xorIntegerzh(sa, abits, sb, bbits) {
    h$ret1 = abits.xor(bbits);
    return 0;
}

function h$integer_cmm_mul2ExpIntegerzh(sa, abits, b) {
    h$ret1 = abits.shiftLeft(b);
    return 0;
}

function h$integer_cmm_fdivQ2ExpIntegerzh(sa, abits, b) {
    h$ret1 = abits.shiftRight(b);
    return 0;
}

function h$integer_cmm_complementIntegerzh(sa, abits) {
    h$ret1 = abits.not();
    return 0;
}

function h$integer_cmm_int64ToIntegerzh(a0, a1) {
    h$ret1 = h$bigFromInt64(a0,a1);
    return 0;
}

function h$integer_cmm_word64ToIntegerzh(a0, a1) {
    h$ret1 = h$bigFromWord64(a0,a1);
    return 0;
}

function h$hs_integerToInt64(as, abits) {
    h$ret1 = abits.intValue();
    return abits.shiftRight(32).intValue();
}

function h$hs_integerToWord64(as, abits) {
    h$ret1 = abits.intValue();
    return abits.shiftRight(32).intValue();
}

function h$integer_cmm_integer2Intzh(as, abits) {
   return abits.intValue();
}

function h$integer_cbits_encodeDouble(as,abits,e) {
   return h$encodeNumber(abits,e);
}

function h$integer_cbits_encodeFloat(as,abits,e) {
   return h$encodeNumber(abits,e);
}

function h$__int_encodeDouble(i,e) {
   return i * Math.pow(2,e);
}

function h$__int_encodeFloat(i,e) {
   return i * Math.pow(2,e);
}


