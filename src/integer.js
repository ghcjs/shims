/* Integer and integer-gmp support
   partial GMP emulation

   note: sign behaves different from real gmp sign,
         value is always zero, don't use it for comparisons

*/

// var logInt = log;
var logInt = function() { }

function integer_cmm_cmpIntegerzh(sa, abits, sb, bbits) {
  logInt("### integer_cmm_cmpIntegerzh:" + abits.toString() + " " + bbits.toString());
  return abits.compare(bbits);
}

function integer_cmm_cmpIntegerIntzh(sa, abits, b) {
  logInt("### integer_cmm_cmpIntegerIntzh: " + abits.toString() + " " + b);
  logInt("### result: " + abits.compare(goog.math.Integer.fromInt(b)));
  return abits.compare(goog.math.Integer.fromInt(b));
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
    return 0; // ret1.getSign();
}

function integer_cmm_quotRemIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_quotRemIntegerzh");
    var q = abits.divide(bbits);
    var r = abits.subtract(q.multiply(bbits));
    ret1 = q;
    ret2 = 0; // r.getSign();
    ret3 = r;
    return 0; // q.getSign();
}

function integer_cmm_quotIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_quotIntegerzh");
    ret1 = abits.divide(bbits);
    return 0; // ret1.getSign();
}

function integer_cmm_remIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_remIntegerzh");
    ret1 = abits.modulo(bbits);
    return 0; // ret1.getSign();
}

function integer_cmm_divModIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_divModIntegerzh");
    var d = abits.divide(bbits);
    var m = abits.subtract(d.multiply(bbits));
    if(abits.isNegative()!==bbits.isNegative() && !m.isZero()) {
        // Take one off d and add b onto m
        d = d.add(goog.math.Integer.fromInt(-1));
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
    if(abits.isNegative()!==bbits.isNegative() && !m.isZero()) {
        // Take one off d and add b onto m
        d = d.add(goog.math.Integer.fromInt(-1));
    }
    ret1 = d;
    return 0; // d.getSign();
}

function integer_cmm_modIntegerzh(sa, abits, sb, bbits) {
    logInt("### integer_cmm_modIntegerzh");
    var d = abits.divide(bbits);
    var m = abits.subtract(d.multiply(bbits));
    if(abits.isNegative()!==bbits.isNegative() && !m.isZero()) {
        // Take one off d and add b onto m
        m = m.add(b);
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
    var x = a.isNegative() ? a.negate() : a;
    var y = b.isNegative() ? b.negate() : b;
    var big, small;
    if(x.lessThan(y)) {
        small = x;
        big = y;
    }
    else {
        small = x;
        big = y;
    }
    while(!small.isZero()) {
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
    ret1 = $hs_gcd(abits, goog.math.Integer.fromInt(b));
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

function integer_cmm_decodeDoublezh(x) {
    logInt("### integer_cmm_decodeDoublezh");
    if( x < 0 ) {
        var result = integer_cmm_decodeDoublezh(-x);
        ret2 = ret2.negate();
        ret1 = ret2.getSign();
        return result;
    }
    var negExponent = 52-Math.floor(Math.log(x) * 1.4426950408889634); // 1/log(2)
    ret2 = goog.math.Integer.fromNumber(x * Math.pow(2, negExponent));
    ret1 = 0; // ret2.getSign();
    return -negExponent;
}

function integer_cmm_int2Integerzh(i) {
    logInt("### integer_cmm_int2Integerzh: " + i);
    ret1 = goog.math.Integer.fromInt(i);
    logInt("result: " + ret1.toString());
    return 0; // ret1.getSign();
}

function integer_cmm_word2Integerzh(i) {
    logInt("### integer_cmm_word2Integerzh: " + i);
    ret1 = new goog.math.Integer([i], 0);
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
    ret1 = goog.math.Integer.fromBits([a1,a0]);
    logInt("### result: " + ret1.toString());
    return 0; // ret1.getSign();
}

function integer_cmm_word64ToIntegerzh(a0, a1) {
    logInt("### integer_cmm_word64ToIntegerzh: " + a0 + " " + a1);
    ret1 = new goog.math.Integer([a1,a0], 0);
    logInt("### result: " + ret1.toString());
    return 0; // ret1.getSign();
}

function hs_integerToInt64(as, abits) {
    logInt("### integer_cmm_integerToInt64zh: " + abits.toString());
    ret1 = abits.getBits(0);
    return abits.getBits(1);
}

function hs_integerToWord64(as, abits) {
    logInt("### integer_cmm_integerToWord64zh: " + abits.toString());
    ret1 = abits.getBits(0);
    return abits.getBits(1);
}

function integer_cmm_integer2Intzh(as, abits) {
   logInt("### integer_cmm_integer2Intzh: " + abits.toString() + " -> " + abits.getBits(0));
   return abits.getBits(0);
}

function integer_cbits_encodeDouble(as,abits,e) {
   logInt("### integer_cbits_encodeDouble: " + abits.toString() + " " + e);
   return abits.toNumber() * Math.pow(2,e);
}

function integer_cbits_encodeFloat(as,abits,e) {
   logInt("### integer_cbits_encodeFloat: " + abits.toString() + " " + e);
   return abits.toNumber() * Math.pow(2,e);
}
