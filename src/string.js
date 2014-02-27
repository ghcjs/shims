// encode a string constant
function h$str(s) {
  var enc = null;
  return function() {
    if(enc === null) {
      enc = h$encodeUtf8(s);
    }
    return enc;
  }
}

// encode a raw string from bytes
function h$rstr(d) {
  var enc = null;
  return function() {
    if(enc === null) {
      enc = h$rawStringData(d);
    }
    return enc;
  }
}

var h$toUpper = null;
function h$u_towupper(ch) {
  if(h$toUpper == null) { h$toUpper = h$decodeMapping(h$toUpperMapping); }
  var r = h$toUpper[ch];
  return (r !== null && r !== undefined) ? r : ch;
}

var h$toLower = null;
function h$u_towlower(ch) {
  if(h$toLower == null) { h$toLower = h$decodeMapping(h$toLowerMapping); }
  var r = h$toLower[ch];
  return (r !== null && r !== undefined) ? r : ch;
}

function h$u_iswspace(ch) {
//  h$log("### u_iswspace: " + ch);
  return /^\s$/.test(new String(ch)) ? 1 : 0;
}

var h$alpha = null;
function h$u_iswalpha(a) {
  if(h$alpha == null) { h$alpha = h$decodeRle(h$alphaRanges); }
  return h$alpha[a] == 1 ? 1 : 0;

}

var h$alnum = null;
function h$u_iswalnum(a) {
  if(h$alnum == null) { h$alnum = h$decodeRle(h$alnumRanges); }
  return h$alnum[a] == 1 ? 1 : 0;
}

function h$u_iswspace(a) {
    return '\t\n\v\f\r \u0020\u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
        .indexOf(String.fromCharCode(a)) !== -1 ? 1 : 0;
}

var h$lower = null;
function h$u_iswlower(a) {
  if(h$lower == null) { h$lower = h$decodeRle(h$lowerRanges); }
  return h$lower[a] == 1 ? 1 : 0;
}

var h$upper = null;
function h$u_iswupper(a) {
  if(h$upper == null) { h$upper = h$decodeRle(h$upperRanges); }
  return h$upper[a] == 1 ? 1 : 0;
}


var h$cntrl = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159];
function h$u_iswcntrl(a) {
  return (h$cntrl.indexOf(a) !== -1) ? 1 : 0;
}

// rle: start,length pairs
var h$print = null;
function h$u_iswprint(a) {
  if(h$print == null) { h$print = h$decodeRle(h$printRanges); }
  return h$print[a] === 1 ? 1 : 0;
}

// decode rle array of start/length pairs
function h$decodeRle(arr) {
  var r = [];
  for(var i=0;i<arr.length;i+=2) {
    var start = arr[i];
    var length = arr[i+1];
    for(var j=start;j<start+length;j++) {
      r[j] = 1;
    }
  }
  return r;
}

// decode a mapping array of from/to pairs
function h$decodeMapping(arr) {
  var r = [];
  for(var i=0;i<arr.length;i+=2) {
    var from = arr[i];
    var to   = arr[i+1];
    r[from] = to;
  }
  return r;
}

function h$localeEncoding() {
    //   h$log("### localeEncoding");
   h$ret1 = 0; // offset 0
   return h$encodeUtf8("UTF-8");
}

function h$rawStringData(str) {
    var v = h$newByteArray(str.length+1);
    var u8 = v.u8;
    for(var i=0;i<str.length;i++) {
       u8[i] = str[i];
    }
    u8[str.length] = 0;
    return v;
}

// encode a javascript string to a zero terminated utf8 byte array
function h$encodeUtf8(str) {
  var i, low;
  var n = 0;
  for(i=0;i<str.length;i++) {
    // non-BMP encoded as surrogate pair in JavaScript string, get actual codepoint
    var c = str.charCodeAt(i);
    if (0xD800 <= c && c <= 0xDBFF) {
      low = str.charCodeAt(i+1);
      c = ((c - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
      i++;
    }
    if(c <= 0x7F) {
      n++;
    } else if(c <= 0x7FF) {
      n+=2;
    } else if(c <= 0xFFFF) {
      n+=3;
    } else if(c <= 0x1FFFFF) {
      n+=4;
    } else if(c <= 0x3FFFFFF) {
      n+=5;
    } else {
      n+=6;
    }
  }
  var v = h$newByteArray(n+1);
  var u8 = v.u8;
  n = 0;
  for(i=0;i<str.length;i++) {
    var c = str.charCodeAt(i);
    // non-BMP encoded as surrogate pair in JavaScript string, get actual codepoint
    if (0xD800 <= c && c <= 0xDBFF) {
      low = str.charCodeAt(i+1);
      c = ((c - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
      i++;
    }
//    h$log("### encoding char " + c + " to UTF-8: " + String.fromCodePoint(c));
    if(c <= 0x7F) {
      u8[n] = c;
      n++;
    } else if(c <= 0x7FF) {
      u8[n] = (c >> 6) | 0xC0;
      u8[n+1] = (c & 0x3F) | 0x80;
      n+=2;
    } else if(c <= 0xFFFF) {
      u8[n]   = (c >> 12) | 0xE0;
      u8[n+1] = ((c >> 6) & 0x3F) | 0x80;
      u8[n+2] = (c & 0x3F) | 0x80;
      n+=3;
    } else if(c <= 0x1FFFFF) {
      u8[n]   = (c >> 18) | 0xF0;
      u8[n+1] = ((c >> 12) & 0x3F) | 0x80;
      u8[n+2] = ((c >> 6) & 0x3F) | 0x80;
      u8[n+3] = (c & 0x3F) | 0x80;
      n+=4;
    } else if(c <= 0x3FFFFFF) {
      u8[n]   = (c >> 24) | 0xF8;
      u8[n+1] = ((c >> 18) & 0x3F) | 0x80;
      u8[n+2] = ((c >> 12) & 0x3F) | 0x80;
      u8[n+3] = ((c >> 6) & 0x3F) | 0x80;
      u8[n+4] = (c & 0x3F) | 0x80;
      n+=5;
    } else {
      u8[n]   = (c >>> 30) | 0xFC;
      u8[n+1] = ((c >> 24) & 0x3F) | 0x80;
      u8[n+2] = ((c >> 18) & 0x3F) | 0x80;
      u8[n+3] = ((c >> 12) & 0x3F) | 0x80;
      u8[n+4] = ((c >> 6) & 0x3F) | 0x80;
      u8[n+5] = (c & 0x3F) | 0x80;
      n+=6;
    }
  }
  u8[v.len-1] = 0; // terminator
//  h$log("### encodeUtf8: " + str);
//  h$log(v);
  return v;
}

// encode a javascript string to a zero terminated utf16 byte array
function h$encodeUtf16(str) {
  var n = 0;
  var i;
  for(i=0;i<str.length;i++) {
    var c = str.charCodeAt(i);
    if(c <= 0xFFFF) {
      n += 2;
    } else {
      n += 4;
    }
  }
  var v = h$newByteArray(n+1);
  var dv = v.dv;
  n = 0;
  for(i=0;i<str.length;i++) {
    var c = str.charCodeAt(i);
    if(c <= 0xFFFF) {
      dv.setUint16(n, c, true);
      n+=2;
    } else {
      var c0 = c - 0x10000;
      dv.setUint16(n,   c0 >> 10, true);
      dv.setUint16(n+2, c0 & 0x3FF, true);
      n+=4;
    }
  }
  dv.setUint8(v.len-1,0);  // terminator
  return v;
}

// convert a string to a buffer, set second field in
// Addr# to length
function h$fromStr(s) {
  var l = s.length;
  var b = h$newByteArray(l * 2);
  var dv = b.dv;
  for(var i=l-1;i>=0;i--) {
    dv.setUint16(i<<1, s.charCodeAt(i), true);
  }
  h$ret1 = l;
  return b;
}

// convert a Data.Text buffer with offset/length to a
// JS string
function h$toStr(b,o,l) {
  var a = [];
  var end = 2*(o+l);
  var k = 0;
  var dv = b.dv;
  for(var i=2*o;i<end;i+=2) {
    var cc = dv.getUint16(i,true);
    a[k++] = cc;
  }
  return String.fromCharCode.apply(this, a);
}

/*
function h$encodeUtf16(str) {
  var b = new DataView(new ArrayBuffer(str.length * 2));
  for(var i=str.length-1;i>=0;i--) {
    b.setUint16(i<<1, str.charCodeAt(i));
  }
  h$ret1 = 0;
  return b;
}
var h$eU16 = h$encodeUtf16;

function h$decodeUtf16(v,start) {
  return h$decodeUtf16(v, v.byteLength - start, start);
}

function h$decodeUtf16z(v,start) {
  var len = v.byteLength - start;
  for(var i=start;i<l;i+=2) {
    if(v.getUint16(i) === 0) {
      len = i;
      break;
    }
  }
  return h$decodeUtf16l(v,l,start)
}
*/

function h$decodeUtf16l(v, byteLen, start) {
  // perhaps we can apply it with an Uint16Array view, but that might give us endianness problems
  var a = [];
  for(var i=0;i<byteLen;i+=2) {
    a[i>>1] = v.dv.getUint16(i+start,true);
  }
  return String.fromCharCode.apply(this, a);
}
var h$dU16 = h$decodeUtf16;

// decode a buffer with UTF-8 chars to a JS string
// stop at the first zero
function h$decodeUtf8z(v,start) {
//  h$log("h$decodeUtf8z");
  var n = start;
  var max = v.len;
  while(n < max) {
//    h$log("### " + n + " got char: " + v.u8[n]);
    if(v.u8[n] === 0) { break; }
    n++;
  }
  return h$decodeUtf8(v,n,start);
}

// decode a buffer with Utf8 chars to a JS string
// invalid characters are ignored
function h$decodeUtf8(v,n0,start) {
//  h$log("### decodeUtf8");
//  h$log(v);
  var n = n0 || v.len;
  var arr = [];
  var i = start || 0;
  var code;
  var u8 = v.u8;
//  h$log("### decoding, starting at:  " + i);
  while(i < n) {
    var c = u8[i];
    while((c & 0xC0) === 0x80) {
      c = u8[++i];
    }
//    h$log("### lead char: " + c);
    if((c & 0x80) === 0) {
      code = (c & 0x7F);
      i++;
    } else if((c & 0xE0) === 0xC0) {
      code = ( ((c & 0x1F) << 6)
             | (u8[i+1] & 0x3F)
             );
      i+=2;
    } else if((c & 0xF0) === 0xE0) {
      code = ( ((c & 0x0F) << 12)
             | ((u8[i+1] & 0x3F) << 6)
             | (u8[i+2] & 0x3F)
             );
      i+=3;
    } else if ((c & 0xF8) === 0xF0) {
      code = ( ((c & 0x07) << 18)
             | ((u8[i+1] & 0x3F) << 12)
             | ((u8[i+2] & 0x3F) <<  6)
             | (u8[i+3] & 0x3F)
             );
      i+=4;
    } else if((c & 0xFC) === 0xF8) {
      code = ( ((c & 0x03) << 24)
             | ((u8[i+1] & 0x3F) << 18)
             | ((u8[i+2] & 0x3F) << 12)
             | ((u8[i+3] & 0x3F) <<  6)
             | (u8[i+4] & 0x3F)
             );
      i+=5;
    } else {
      code = ( ((c & 0x01) << 30)
             | ((u8[i+1] & 0x3F) << 24)
             | ((u8[i+2] & 0x3F) << 18)
             | ((u8[i+3] & 0x3F) << 12)
             | ((u8[i+4] & 0x3F) <<  6)
             | (u8[i+5] & 0x3F)
             );
      i+=6;
    }
    // h$log("### decoded codePoint: " + code + " - " + String.fromCharCode(code)); // String.fromCodePoint(code));
    // need to deal with surrogate pairs
    if(code > 0xFFFF) {
      var offset = code - 0x10000;
      arr.push(0xD800 + (offset >> 10), 0xDC00 + (offset & 0x3FF));
    } else {
      arr.push(code);
    }
  }
  return String.fromCharCode.apply(this, arr);
}

// fixme what if terminator, then we read past end
function h$decodeUtf16(v) {
  var n = v.len;
  var arr = [];
  var dv = v.dv;
  for(var i=0;i<n;i+=2) {
    arr.push(dv.getUint16(i,true));
  }
  return String.fromCharCode.apply(this, arr);
}

// var charsets = ["UTF-8"] -> UTF-32LE 


function h$hs_iconv_open(to,to_off,from,from_off) {
  h$errno = h$EINVAL; // no encodings supported
  return -1;
//  var fromStr = decodeUtf8(from, from_off);
//  var toStr = decodeUtf8(to, to_off);
//  h$log("#### hs_iconv_open: " + fromStr + " -> " + toStr);
//  return 1; // fixme?
}

function h$hs_iconv_close(iconv) {
  return 0;
}

function h$hs_iconv(iconv, inbuf,  inbuf_off, insize, insize_off,
                           outbuf, outbuf_off, outsize, outsize_off) {
//  var inbuf2      = derefPtrA(inbuf, inbuf_off);
//  var inbuf2_off  = derefPtrO(inbuf, inbuf_off);
//  var outbuf2     = derefPtrA(outbuf, outbuf_off);
//  var outbuf2_off = derefPtrO(outbuf, outbuf_off);
//  var insiz       = insize.getUint32(insize_off);
//  var outsiz      = outsize.getUint32(outsize_off);
  // fixme support other encodings
//  h$log("### hs_iconv");
  return utf32leToUtf8(inbuf, inbuf_off, insize, insize_off,
                       outbuf, outbuf_off, outsize, outsize_off);
}

// ptr* -> ptr (array)
function h$derefPtrA(ptr, ptr_off) {
  return ptr.arr[ptr_off][0];
}
// ptr* -> ptr (offset)
function h$derefPtrO(ptr, ptr_off) {
  return ptr.arr[ptr_off][1];
}

// word** -> word    ptr[x][y]
function h$readPtrPtrU32(ptr, ptr_off, x, y) {
  x = x || 0;
  y = y || 0;
  var arr = ptr.arr[ptr_off + 4 * x];
  return arr[0].dv.getInt32(arr[1] + 4 * y, true);
}

// char** -> char   ptr[x][y]
function h$readPtrPtrU8(ptr, ptr_off, x, y) {
  x = x || 0;
  y = y || 0;
  var arr = ptr.arr[ptr_off + 4 * x];
  return arr[0].dv.getUint8(arr[1] + y);
}

// word**   ptr[x][y] = v
function h$writePtrPtrU32(ptr, ptr_off, v, x, y) {
  x = x || 0;
  y = y || 0;
  var arr = ptr.arr[ptr_off + 4 * x];
  arr[0].dv.putInt32(arr[1] + y, v);
}

// unsigned char** ptr[x][y] = v
function h$writePtrPtrU8(ptr, ptr_off, v, x, y) {
  x = x || 0;
  y = y || 0;
  var arr = ptr.arr[ptr_off+ 4 * x];
  arr[0].dv.putUint8(arr[1] + y, v);
}

// allocate a list
function h$cl(arr) {
  var r = h$ghczmprimZCGHCziTypesziZMZN;
  var i = arr.length - 1;
  while(i>=0) {
    r = h$c2(h$ghczmprimZCGHCziTypesziZC_con_e, arr[i], r);
    --i;
  }
  return r;
}

// allocate a list, prepended to r
function h$clr(arr, r) {
  var i = arr.length - 1;
  while(i>=0) {
    r = h$c2(h$ghczmprimZCGHCziTypesziZC_con_e, arr[i], r);
    --i;
  }
  return r;
}

// convert JavaScript String to a Haskell String
function h$toHsString(str) {
  var i = str.length - 1;
  var r = h$ghczmprimZCGHCziTypesziZMZN;
  while(i>=0) {
    var cp = str.charCodeAt(i);
    if(cp >= 0xDC00 && cp <= 0xDFFF && i > 0) {
      --i;
      cp = (cp - 0xDC00) + (str.charCodeAt(i) - 0xD800) * 1024 + 0x10000;
    }
    r = h$c2(h$ghczmprimZCGHCziTypesziZC_con_e, cp, r);
    --i;
  }
  return r;
}

// ascii only version of the above
function h$toHsStringA(str) {
  var i = str.length - 1;
  var r = h$ghczmprimZCGHCziTypesziZMZN;
  while(i>=0) {
    r = h$c2(h$ghczmprimZCGHCziTypesziZC_con_e, str.charCodeAt(i), r);
    --i;
  }
  return r;
}

// unpack ascii string, append to existing Haskell string
function h$appendToHsStringA(str, appendTo) {
  var i = str.length - 1;
  var r = appendTo;
  while(i>=0) {
    r = h$c2(h$ghczmprimZCGHCziTypesziZC_con_e, str.charCodeAt(i), r);
    --i;
  }
  return r;
}

// throw e wrapped in a GHCJS.Prim.JSException  in the current thread
function h$throwJSException(e) {
  // a GHCJS.Prim.JSException
  var jsE = h$c2(h$ghcjszmprimZCGHCJSziPrimziJSException_con_e,e,h$toHsString(e.toString()));
  // wrap it in a SomeException, adding the Exception dictionary
  var someE = h$c2(h$baseZCGHCziExceptionziSomeException_con_e,
     h$ghcjszmprimZCGHCJSziPrimzizdfExceptionJSException, jsE);
  return h$throw(someE, true);
}

// function encodeSame(inbuf, inbuf_off, insize, insize_off

/* specialized implementations of utf8 <-> utf32, utf8 <-> utf16
 * since utf8 is the most used interchange format and utf32
 * is used by haskell internally, utf16 for the Text package
 */
/* outdated, need to update to little endian if used again
function h$utf32leToUtf8(inbuf0, inbuf_off0, insize, insize_off,
                       outbuf0, outbuf_off0, outsize, outsize_off) {

  var inbuf      = h$derefPtrA(inbuf0, inbuf_off0);
  var inbuf_off  = h$derefPtrO(inbuf0, inbuf_off0);
  var outbuf     = h$derefPtrA(outbuf0, outbuf_off0);
  var outbuf_off = h$derefPtrO(outbuf0, outbuf_off0);

  var inbuf_left = insize.getUint32(insize_off);
  var outbuf_left = outsize.getUint32(outsize_off);
  var in_max  = inbuf_off + inbuf_left;
  var out_max = outbuf_off + outbuf_left;
  var in_off    = inbuf_off;
  var out_off   = outbuf_off;
  var n = 0;
  var partial = false;
//  h$log("### converting utf8");
//  h$log("### inbuf_off: " + inbuf_off);
//  h$log("### inbuf_left: " + inbuf_left);
//  h$log("### in_max: " + in_max);
//  h$log("### nbuf length: " + inbuf.byteLength);
  while(in_off + 3 < in_max) {
//    h$log("### converting: " + in_off);
    var codePoint = inbuf.getUint32(in_off);
//    h$log("### converting " + codePoint + " to UTF-8: " + String.fromCodePoint(codePoint));
    if(codePoint <= 0x7F) {
      if(out_off + 1 < out_max) {
        outbuf.setUint8(out_off, codePoint);
        out_off++;
      } else {
        partial = true;
        break;
      }
    } else if(codePoint <= 0x7FF) {
      if(out_off + 2 < out_max) {
        outbuf.setUint8(out_off, (codePoint >> 6) | 0xC0);
        outbuf.setUint8(out_off+1, (codePoint & 0x3F) | 0x80);
        out_off += 2;
      } else {
        partial = true;
        break;
      }
    } else if(codePoint <= 0xFFFF) {
      if(out_off + 3 < out_max) {
        outbuf.setUint8(out_off, (codePoint >> 12) | 0xE0);
        outbuf.setUint8(out_off+1, ((codePoint >> 6) & 0x3F) | 0x80);
        outbuf.setUint8(out_off+2, (codePoint & 0x3F) | 0x80);
//        h$log("### encoded triple: " + outbuf.getUint8(out_off) + ", " + outbuf.getUint8(out_off+1) + ", " + outbuf.getUint8(out_off+2));
        out_off += 3;
      } else {
        partial = true;
        break;
      }
    } else if(codePoint <= 0x1FFFFF) {
      if(out_off + 4 < out_max) {
        outbuf.setUint8(out_off, (codePoint >> 18) | 0xF0);
        outbuf.setUint8(out_off+1, ((codePoint >> 12) & 0x3F) | 0x80);
        outbuf.setUint8(out_off+2, ((codePoint >> 6) & 0x3F) | 0x80);
        outbuf.setUint8(out_off+3, (codePoint & 0x3F) | 0x80);
        out_off += 4;
      } else {
        partial = true;
        break;
      }
    } else if(codePoint <= 0x3FFFFFF) {
      if(out_off + 5 < out_max) {
        outbuf.setUint8(out_off, (codePoint >> 24) | 0xF8);
        outbuf.setUint8(out_off+1, ((codePoint >> 18) & 0x3F) | 0x80);
        outbuf.setUint8(out_off+2, ((codePoint >> 12) & 0x3F) | 0x80);
        outbuf.setUint8(out_off+3, ((codePoint >> 6) & 0x3F) | 0x80);
        outbuf.setUint8(out_off+4, (codePoint & 0x3F) | 0x80);
        out_off += 5;
      } else {
        partial = true;
        break;
      }
    } else {
      if(out_off + 6 < out_max) {
        outbuf.setUint8(out_off, (codePoint >>> 30) | 0xFC);
        outbuf.setUint8(out_off+1, ((codePoint >> 24) & 0x3F) | 0x80);
        outbuf.setUint8(out_off+2, ((codePoint >> 18) & 0x3F) | 0x80);
        outbuf.setUint8(out_off+3, ((codePoint >> 12) & 0x3F) | 0x80);
        outbuf.setUint8(out_off+4, ((codePoint >> 6) & 0x3F) | 0x80);
        outbuf.setUint8(out_off+5, (codePoint & 0x3F) | 0x80);
        out_off += 6;
      } else {
        partial = true;
        break;
      }
    }
    in_off += 4;
  }
  outsize.setUint32(outsize_off, out_max - out_off);
  insize.setUint32(insize_off, in_max - in_off);
//  h$log("### converted chars: " + ((in_off - inbuf_off) / 4));
//  return 0; // all conversions are reversible return (in_off - inbuf_off) / 4;
  if(partial) {
    inbuf0.arr[inbuf_off0][1] = in_off;
    h$errno = h$E2BIG;
    return -1;
  } else {
    return 0;
  }
}
*/


