function hs_eqWord64(v1a,v1b,v2a,v2b) {
  return (v1a===v2a && v1b===v2b) ? 1 : 0;
}

function hs_word64ToWord(wa,wb) {
  return wb;
}

function hswordToWord64(w) {
  ret1 = w;
  return 0;
}

// always nonnegative n?
function hs_uncheckedShiftL64(wa,wb,n) {
  n &= 63;
  if(n == 0) {
    ret1 = wb;
    return wa;
  } else if(n < 32) {
    ret1 = wb << n;
    return (wa << n) | (wb >>> (32-n));
  } else {
    ret1 = 0;
    return ((wb << (n-32))|0);
  }
}

// this does an unsigned shift, is that ok?
function hs_uncheckedShiftRL64(wa,wb,n) {
  if(n < 0) throw "unexpected right shift";
  n &= 63;
  if(n == 0) {
    ret1 = wb;
    return wa;
  } else if(n < 32) {
    ret1 = (wb >>> n) | (wa << (32 - n));
    return (wa >>> n);
  } else {
    ret1 = wb >>> (n - 32);
    return 0;
  }
}
