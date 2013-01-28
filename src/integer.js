/* Integer and integer-gmp support
   partial GMP emulation

   note: sign behaves different from real gmp sign,
         value is always zero, don't use it for comparisons

*/

// var logInt = log;
var logInt = function() { }

$hs_bigOne = new BigInteger([1]);

// convert a value to a BigInt
// fixme make faster conversion stuff if we know how many bits each digit has
function $hs_bigFromInt(v) {
  logInt("### $hs_bigFromInt: " + v);
  var v0 = v|0;
  var r = new BigInteger([v0 >> 24, (v0&0xff0000) >> 16, (v0 & 0xff00) >> 8, v0 & 0xff]);
  logInt("### result: " + r.toString());
  return r;
}

function $hs_bigFromWord(v) {
  logInt("### $hs_bigFromInt: " + v);
  var v0 = v|0;
  var r = new BigInteger([0, v0 >>> 24, (v0&0xff0000) >> 16, (v0 & 0xff00) >> 8, v0 & 0xff]);
  logInt("### result: " + r.toString());
  return r;
}

function $hs_bigFromInt64(v1,v2) {
  logInt("### $hs_bigFromInt64: " + v1 + " " + v2);
  var v10 = v1|0;
  var v20 = v2|0;
  var r = new BigInteger([ v10 >>  24, (v10 & 0xff0000) >> 16, (v10 & 0xff00) >> 8, v10 & 0xff
                         , v20 >>> 24, (v20 & 0xff0000) >> 16, (v20 & 0xff00) >> 8, v20 & 0xff
                         ]);
  logInt("### result: " + r.toString());
  return r;
}

function $hs_bigFromWord64(v1,v2) {
  logInt("### $hs_bigFromWord64: " + v1 + " " + v2);
  var v10 = v1|0;
  var v20 = v2|0;
  var arr = [ 0, v10 >>> 24, (v10 & 0xff0000) >> 16, (v10 & 0xff00) >> 8, v10 & 0xff
                         , v20 >>> 24, (v20 & 0xff0000) >> 16, (v20 & 0xff00) >> 8, v20 & 0xff
                         ];
  logInt(arr);
  var r = new BigInteger([ 0, v10 >>> 24, (v10 & 0xff0000) >> 16, (v10 & 0xff00) >> 8, v10 & 0xff
                         , v20 >>> 24, (v20 & 0xff0000) >> 16, (v20 & 0xff00) >> 8, v20 & 0xff
                         ]);
  logInt("### result: " + r.toString());
  return r;
}

function $hs_bigFromNumber(n) {
  logInt("### $hs_bigFromNumber: " + n);
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
  logInt(ra);
  var r = new BigInteger(ra);
  logInt("### result: " + r.toString());
  return r;
}

function $hs_encodeNumber(big,e) {
  logInt("### $hs_encodeNumber: " + big.toString() + " " + e);
  var m = Math.pow(2,e);
  var b = big.toByteArray();
  var l = b.length;
  var r = 0;
//  logInt(b);
  for(var i=l-1;i>=1;i--) {
    logInt("### i: " + i + " b[i] " + b[i]);
    r += m * Math.pow(2,(l-i-1)*8) * (b[i] & 0xff);
    logInt(r);
  }
  // last one signed
  if(b[0] != 0) {
    r += m * Math.pow(2,(l-1)*8) * b[0];
  }
  logInt(r);
  logInt("### result: " + r);
  return r;
}

function integer_cmm_cmpIntegerzh(sa, abits, sb, bbits) {
  logInt("### integer_cmm_cmpIntegerzh:" + abits.toString() + " " + bbits.toString());
  var c = abits.compareTo(bbits);
  return c == 0 ? 0 : c > 0 ? 1 : -1;
}

function integer_cmm_cmpIntegerIntzh(sa, abits, b) {
  logInt("### integer_cmm_cmpIntegerIntzh: " + abits.toString() + " " + b);
  var res = abits.compareTo($hs_bigFromInt(b));
  logInt("### result: " + res);
  return res;
}

function integer_cmm_plusIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_plusIntegerzh");
    ret1 = abits.add(bbits);
    return 0; // ret1.getSign();
}

function integer_cmm_minusIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_minusIntegerzh: " + abits.toString() + " " + bbits.toString());
    ret1 = abits.subtract(bbits);
    return 0; // ret1.getSign();
}

function integer_cmm_timesIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_timesIntegerzh: " + abits.toString() + " " + bbits.toString());
    ret1 = abits.multiply(bbits);
    logInt("### result: " + ret1.toString());
    return 0; // ret1.getSign();
}

// fixme make more efficient, divideRemainder
function integer_cmm_quotRemIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_quotRemIntegerzh: " + abits.toString() + " " + bbits.toString());
    var q = abits.divide(bbits);
    logInt("### q: " + q.toString());
    var r = abits.subtract(q.multiply(bbits));
    logInt("### r: " + r.toString());
    ret1 = q;
    ret2 = 0; // r.getSign();
    ret3 = r;
    return 0; // q.getSign();
}

function integer_cmm_quotIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_quotIntegerzh: " + abits.toString() + " " + bbits.toString());
    ret1 = abits.divide(bbits);
    return 0; // ret1.getSign();
}

function integer_cmm_remIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_remIntegerzh: " + abits.toString() + " " + bbits.toString());
    ret1 = abits.mod(bbits);
    logInt("### result: " + ret1.toString());
    return 0; // ret1.getSign();
}

function integer_cmm_divModIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_divModIntegerzh");
    var d = abits.divide(bbits);
    var m = abits.subtract(d.multiply(bbits));
    if(abits.signum()!==bbits.signum() && m.signum() !== 0) {
        // Take one off d and add b onto m
        d = d.subtract($hs_bigOne);
        m = m.add(b);
    }
    ret1 = d;
    ret2 = 0; // m.getSign();
    ret3 = m;
    return 0; // d.getSign();
}

function integer_cmm_divIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_divIntegerzh");
    var d = abits.divide(bbits);
    var m = abits.subtract(d.multiply(bbits));
    if(abits.signum()!==bbits.signum() && m.signum() !== 0) {
        // Take one off d and add b onto m
        d = d.subtract($hs_bigOne);
    }
    ret1 = d;
    return 0; // d.getSign();
}

function integer_cmm_modIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_modIntegerzh");
    var d = abits.divide(bbits);
    var m = abits.subtract(d.multiply(bbits));
    if(abits.signum()!==bbits.signum() && m.signum() !== 0) {
        // Take one off d and add b onto m
        m = m.add(bbits);
    }
    ret1 = m;
    return 0; // m.getSign();
}
function integer_cmm_divExactIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_divExactIntegerzh");
    ret1 = abits.divide(bbits);
    return 0; // ret1.getSign();
}

function $hs_gcd(a, b) {
    var x = a.abs();
    var y = b.abs();
    var big, small;
    if(x.compareTo(y) < 0) {
        small = x;
        big = y;
    }
    else {
        small = x;
        big = y;
    }
    while(small.signum() !== 0) {
        var q = big.divide(small);
        var r = big.subtract(q.multiply(small));
        big = small;
        small = r;
    }
    return big;
}

function integer_cmm_gcdIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_gcdIntegerzh");
    ret1 = $hs_gcd(abits, bbits);
    return 0; // ret1.getSign();
}

function integer_cmm_gcdIntegerIntzh(sa, abits, b) {
    logInt("### integer_cmm_gcdIntegerzh");
    ret1 = $hs_gcd(abits, $hs_bigFromInt(b));
    return 0; // ret1.getSign();
}
function integer_cmm_gcdIntzh(a, b) {
        logInt("### integer_cmm_gcdIntzh");
        var x = a<0 ? -a : a;
        var y = b<0 ? -b : b;
        var big, small;
        if(x<y) {
            small = x;
            big = y;
        }
        else {
            small = x;
            big = y;
        }
        while(small!==0) {
            var r = big % small;
            big = small;
            small = r;
        }
        return big;
}

var $hs_oneOverLog2 = 1 / Math.log(2);

function integer_cmm_decodeDoublezh(x) {
    logInt("### integer_cmm_decodeDoublezh: " + x);
    if( x < 0 ) {
        var result = integer_cmm_decodeDoublezh(-x);
        ret2 = ret2.negate();
        ret1 = ret2.signum();
        return result;
    }
    var exponent = Math.floor(Math.log(x) * $hs_oneOverLog2)-52;
    var n;
    // prevent overflow
    if(exponent < -1000) {
      n = x * Math.pow(2,-exponent-64) * Math.pow(2,64);
    } else if(exponent > 900) {
      n = x * Math.pow(2,-exponent+64) * Math.pow(2,-64);
    } else {
      n = x * Math.pow(2,-exponent);
    }
    // fixup precision, do we also need the other way (exponent++) ?
    if(Math.abs(n - 0.5 - Math.floor(n)) < 0.0001) {
      exponent--;
      n *= 2;
    }
    ret2 = $hs_bigFromNumber(n);
    ret1 = 0;
    return exponent;
}

function integer_cmm_int2Integerzh(i) {
    logInt("### integer_cmm_int2Integerzh: " + i);
    ret1 = $hs_bigFromInt(i);
    logInt("result: " + ret1.toString());
    return 0; // ret1.getSign();
}

function integer_cmm_word2Integerzh(i) {
    logInt("### integer_cmm_word2Integerzh: " + i);
    ret1 = $hs_bigFromWord(i);
    logInt("result: " + ret1.toString());
    return 0; // ret1.getSign();
}

function integer_cmm_andIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_andIntegerzh");
    ret1 = abits.and(bbits);
    return 0; // ret1.getSign();
}

function integer_cmm_orIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_orIntegerzh: " + abits.toString() + " " + bbits.toString());
    ret1 = abits.or(bbits);
    logInt("### result: " + ret1.toString());
    return 0; // ret1.getSign();
}

function integer_cmm_xorIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_xorIntegerzh");
    ret1 = abits.xor(bbits);
    return 0; // ret1.getSign();
}

function integer_cmm_mul2ExpIntegerzh(sa, abits, b) {
    logInt("### integer_cmm_mul2ExpIntegerzh: " + abits.toString() + " " + b);
    ret1 = abits.shiftLeft(b);
    return 0; // ret1.getSign();
}

function integer_cmm_fdivQ2ExpIntegerzh(sa, abits, b) {
    logInt("### integer_cmm_fdivQ2Integerzh");
    ret1 = abits.shiftRight(bbits);
    return 0; // ret1.getSign();
}

function integer_cmm_complementIntegerzh(sa, abits) {
    logInt("### integer_cmm_complementIntegerzh");
    ret1 = abits.not();
    return 0; // ret1.getSign();
}

function integer_cmm_int64ToIntegerzh(a0, a1) {
    logInt("### integer_cmm_int64ToIntegerzh: " + a0 + " " + a1);
    ret1 = $hs_bigFromInt64(a0,a1);
    logInt("### result: " + ret1.toString());
    return 0; // ret1.getSign();
}

function integer_cmm_word64ToIntegerzh(a0, a1) {
    logInt("### integer_cmm_word64ToIntegerzh: " + a0 + " " + a1);
    ret1 = $hs_bigFromWord64(a0,a1); //new BigInteger(a1,a0); // [a1,a0], 0);
    logInt("### result: " + ret1.toString());
    return 0; // ret1.getSign();
}

function hs_integerToInt64(as, abits) {
    logInt("### integer_cmm_integerToInt64zh: " + abits.toString());
    ret1 = abits.intValue();
    return abits.shiftRight(32).intValue();
}

function hs_integerToWord64(as, abits) {
    logInt("### integer_cmm_integerToWord64zh: " + abits.toString());
    ret1 = abits.intValue();
    return abits.shiftRight(32).intValue();
}

function integer_cmm_integer2Intzh(as, abits) {
   logInt("### integer_cmm_integer2Intzh: " + abits.toString() + " -> " + abits.intValue());
   return abits.intValue();
}

function integer_cbits_encodeDouble(as,abits,e) {
   logInt("### integer_cbits_encodeDouble: " + abits.toString() + " " + e);
   var r = $hs_encodeNumber(abits,e);
//   var r = abits.toNumber() * Math.pow(2,e);
   logInt("### result: " + r);
   return r;
}

function integer_cbits_encodeFloat(as,abits,e) {
   logInt("### integer_cbits_encodeFloat: " + abits.toString() + " " + e);
//   var r = abits.toNumber() * Math.pow(2,e);
   var r = $hs_encodeNumber(abits,e);
   logInt("### result: " + r);
   return r;
}

function __int_encodeDouble(i,e) {
   logInt("### __int_encodeDouble: " + i + " " + e);
   var r = i * Math.pow(2,e);
   logInt("### result: " + r);
   return r;
}

function __int_encodeFloat(i,e) {
   logInt("### __int_encodeFloat: " + i + " " + e);
   var r = i * Math.pow(2,e);
   logInt("### result: " + r);
   return r;
}


