function u_towupper(ch) {
//  log("### u_towupper: " + ch);
  var r = new String(ch).toUpperCase().charCodeAt(0);
//  log("### result: " + r);
  return r;
}

function u_towlower(ch) {
//  log("### u_towlower: " + ch);
  var r = new String(ch).toLowerCase().charCodeAt(0);
//  log("### result: " + r);
  return r;
}

function u_iswspace(ch) {
//  log("### u_iswspace: " + ch);
  return /^\s$/.test(new String(ch)) ? 1 : 0;
}


function u_iswalpha(a) {
    return goog.string.isAlpha(String.fromCharCode(a)) ? 1 : 0;
}

function u_iswalnum(a) {
    return goog.string.isAlphaNumeric(String.fromCharCode(a)) ? 1 : 0;
}

function u_iswspace(a) {
    return '\t\n\v\f\r \u0020\u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
        .indexOf(String.fromCharCode(a)) !== -1 ? 1 : 0;
}

function u_iswlower(a) {
    return a !== u_towupper(a) ? 1 : 0;
}

function u_iswupper(a) {
    return a !== u_towlower(a) ? 1 : 0;
}

function localeEncoding() {
    //   log("### localeEncoding");
   ret1 = 0; // offset 0
   return encodeUtf8("UTF-8");
}

// encode a javascript string to a zero terminated utf8 byte array
// fixme, high code points are a surrogate pair in js strings
function encodeUtf8(str) {
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
  var v = new DataView(new ArrayBuffer(n+1));
  n = 0;
  for(i=0;i<str.length;i++) {
    var c = str.charCodeAt(i);
    // non-BMP encoded as surrogate pair in JavaScript string, get actual codepoint
    if (0xD800 <= c && c <= 0xDBFF) {
      low = str.charCodeAt(i+1);
      c = ((c - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
      i++;
    }
//    log("### encoding char " + c + " to UTF-8: " + String.fromCodePoint(c));
    if(c <= 0x7F) {
      v.setUint8(n, c);
      n++;
    } else if(c <= 0x7FF) {
      v.setUint8(n, (c >> 6) | 0xC0);
      v.setUint8(n+1, (c & 0x3F) | 0x80);
      n+=2;
    } else if(c <= 0xFFFF) {
      v.setUint8(n,   (c >> 12) | 0xE0);
      v.setUint8(n+1, ((c >> 6) & 0x3F) | 0x80);
      v.setUint8(n+2, (c & 0x3F) | 0x80);
      n+=3;
    } else if(c <= 0x1FFFFF) {
      v.setUint8(n,   (c >> 18) | 0xF0);
      v.setUint8(n+1, ((c >> 12) & 0x3F) | 0x80);
      v.setUint8(n+2, ((c >> 6) & 0x3F) | 0x80);
      v.setUint8(n+3, (c & 0x3F) | 0x80);
      n+=4;
    } else if(c <= 0x3FFFFFF) {
      v.setUint8(n,   (c >> 24) | 0xF8);
      v.setUint8(n+1, ((c >> 18) & 0x3F) | 0x80);
      v.setUint8(n+2, ((c >> 12) & 0x3F) | 0x80);
      v.setUint8(n+3, ((c >> 6) & 0x3F) | 0x80);
      v.setUint8(n+4, (c & 0x3F) | 0x80);
      n+=5;
    } else {
      v.setUint8(n,   (c >>> 30) | 0xFC);
      v.setUint8(n+1, ((c >> 24) & 0x3F) | 0x80);
      v.setUint8(n+2, ((c >> 18) & 0x3F) | 0x80);
      v.setUint8(n+3, ((c >> 12) & 0x3F) | 0x80);
      v.setUint8(n+4, ((c >> 6) & 0x3F) | 0x80);
      v.setUint8(n+5, (c & 0x3F) | 0x80);
      n+=6;
    }
  }
  v.setUint8(v.byteLength-1,0); // terminator
//  log("### encodeUtf8: " + str);
//  log(v);
  return v;
}

// encode a javascript string to a zero terminated utf16 byte array
function encodeUtf16(str) {
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
  var v = new DataView(new ArrayBuffer(n+1));
  n = 0;
  for(i=0;i<str.length;i++) {
    var c = str.charCodeAt(i);
    if(c <= 0xFFFF) {
      v.setUint16(n, c);
      n+=2;
    } else {
      var c0 = c - 0x10000;
      v.setUint16(n,   c0 >> 10);
      v.setUint16(n+2, c0 & 0x3FF);
      n+=4;
    }
  }
  v.setUint8(v.byteLength-1,0);  // terminator
  return v;
}

// decode a DataView with UTF-8 chars to a JS string
// stop at the first zero
function decodeUtf8z(v,start) {
  var n = start;
  var max = v.byteLength;
  while(n < max) {
    if(v.getUint8(n) === 0) { break; }
    n++;
  }
  return decodeUtf8(v,n,start);
}

// decode a DataView with Utf8 chars to a JS string
// invalid characters are ignored
function decodeUtf8(v,n0,start) {
//  log("### decodeUtf8");
//  log(v);
  var n = n0 || v.byteLength;
  var arr = [];
  var i = start || 0;
  var code;
//  log("### decoding, starting at:  " + start);
  while(i < n) {
    var c = v.getUint8(i);
    while((c & 0xC0) === 0x80) {
      c = v.getUint8(++i);
    }
//    log("### lead char: " + c);
    if((c & 0x80) === 0) {
      code = (c & 0x7F);
      i++;
    } else if((c & 0xE0) === 0xC0) {
      code = ( ((c & 0x1F) << 6)
             | (v.getUint8(i+1) & 0x3F)
             );
      i+=2;
    } else if((c & 0xF0) === 0xE0) {
      code = ( ((c & 0x0F) << 12)
             | ((v.getUint8(i+1) & 0x3F) << 6)
             | (v.getUint8(i+2) & 0x3F)
             );
      i+=3;
    } else if ((c & 0xF8) === 0xF0) {
      code = ( ((c & 0x07) << 18)
             | ((v.getUint8(i+1) & 0x3F) << 12)
             | ((v.getUint8(i+2) & 0x3F) <<  6)
             | (v.getUint8(i+3) & 0x3F)
             );
      i+=4;
    } else if((c & 0xFC) === 0xF8) {
      code = ( ((c & 0x03) << 24)
             | ((v.getUint8(i+1) & 0x3F) << 18)
             | ((v.getUint8(i+2) & 0x3F) << 12)
             | ((v.getUint8(i+3) & 0x3F) <<  6)
             | (v.getUint8(i+4) & 0x3F)
             );
      i+=5;
    } else {
      code = ( ((c & 0x01) << 30)
             | ((v.getUint8(i+1) & 0x3F) << 24)
             | ((v.getUint8(i+2) & 0x3F) << 18)
             | ((v.getUint8(i+3) & 0x3F) << 12)
             | ((v.getUint8(i+4) & 0x3F) <<  6)
             | (v.getUint8(i+5) & 0x3F)
             );
      i+=6;
    }
//    log("### decoded codePoint: " + code + " - " + String.fromCodePoint(code));
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
function decodeUtf16(v) {
  var n = v.byteLength;
  var arr = [];
  for(var i=0;i<n;i+=2) {
    arr.push(v.getUint16(i));
  }
  return String.fromCharCode.apply(this, arr);
}

// var charsets = ["UTF-8"] -> UTF-32LE 


function hs_iconv_open(to,to_off,from,from_off) {
  var fromStr = decodeUtf8(from, from_off);
  var toStr = decodeUtf8(to, to_off);
//  log("#### hs_iconv_open: " + fromStr + " -> " + toStr);
  return 1; // fixme?
}

function hs_iconv_close(iconv) {
  return 0;
}

function hs_iconv(iconv, inbuf,  inbuf_off, insize, insize_off,
                         outbuf, outbuf_off, outsize, outsize_off) {
//  var inbuf2      = derefPtrA(inbuf, inbuf_off);
//  var inbuf2_off  = derefPtrO(inbuf, inbuf_off);
//  var outbuf2     = derefPtrA(outbuf, outbuf_off);
//  var outbuf2_off = derefPtrO(outbuf, outbuf_off);
//  var insiz       = insize.getUint32(insize_off);
//  var outsiz      = outsize.getUint32(outsize_off);
  // fixme support other encodings
//  log("### hs_iconv");
  return utf32leToUtf8(inbuf, inbuf_off, insize, insize_off,
                       outbuf, outbuf_off, outsize, outsize_off);
}

// ptr* -> ptr (array)
function derefPtrA(ptr, ptr_off) {
  return ptr.arr[ptr_off][0];
}
// ptr* -> ptr (offset)
function derefPtrO(ptr, ptr_off) {
  return ptr.arr[ptr_off][1];
}

// word** -> word    ptr[x][y]
function readPtrPtrU32(ptr, ptr_off, x, y) {
  x = x || 0;
  y = y || 0;
  var arr = ptr.arr[ptr_off + 4 * x];
  return arr[0].getUint32(arr[1] + 4 * y);
}

// char** -> char   ptr[x][y]
function readPtrPtrU8(ptr, ptr_off, x, y) {
  x = x || 0;
  y = y || 0;
  var arr = ptr.arr[ptr_off + 4 * x];
  return arr[0].getUint8(arr[1] + y);
}

// word**   ptr[x][y] = v
function writePtrPtrU32(ptr, ptr_off, v, x, y) {
  x = x || 0;
  y = y || 0;
  var arr = ptr.arr[ptr_off+ 4 * x];
  arr[0].putUint8(arr[1] + y, v);
}

// unsigned char** ptr[x][y] = v
function writePtrPtrU8(ptr, ptr_off, v, x, y) {
  x = x || 0;
  y = y || 0;
  var arr = ptr.arr[ptr_off+ 4 * x];
  arr[0].putUint8(arr[1] + y, v);
}

// function encodeSame(inbuf, inbuf_off, insize, insize_off

/* specialized implementations of utf8 <-> utf32, utf8 <-> utf16
 * since utf8 is the most used interchange format and utf32
 * is used by haskell internally, utf16 for the Text package
 */
function utf32leToUtf8(inbuf0, inbuf_off0, insize, insize_off,
                       outbuf0, outbuf_off0, outsize, outsize_off) {

  var inbuf      = derefPtrA(inbuf0, inbuf_off0);
  var inbuf_off  = derefPtrO(inbuf0, inbuf_off0);
  var outbuf     = derefPtrA(outbuf0, outbuf_off0);
  var outbuf_off = derefPtrO(outbuf0, outbuf_off0);

  var inbuf_left = insize.getUint32(insize_off);
  var outbuf_left = outsize.getUint32(outsize_off);
  var in_max  = inbuf_off + inbuf_left;
  var out_max = outbuf_off + outbuf_left;
  var in_off    = inbuf_off;
  var out_off   = outbuf_off;
  var n = 0;
  var partial = false;
//  log("### converting utf8");
//  log("### inbuf_off: " + inbuf_off);
//  log("### inbuf_left: " + inbuf_left);
//  log("### in_max: " + in_max);
//  log("### nbuf length: " + inbuf.byteLength);
  while(in_off + 3 < in_max) {
//    log("### converting: " + in_off);
    var codePoint = inbuf.getUint32(in_off);
//    log("### converting " + codePoint + " to UTF-8: " + String.fromCodePoint(codePoint));
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
//        log("### encoded triple: " + outbuf.getUint8(out_off) + ", " + outbuf.getUint8(out_off+1) + ", " + outbuf.getUint8(out_off+2));
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
//  log("### converted chars: " + ((in_off - inbuf_off) / 4));
//  return 0; // all conversions are reversible return (in_off - inbuf_off) / 4;
  if(partial) {
    inbuf0.arr[inbuf_off0][1] = in_off;
    $hs_errno = $hs_E2BIG;
    return -1;
  } else {
    return 0;
  }
}

function $hs_prim_WriteOffAddrOp_Addr(a,o,i,av,ov) {
  if(!a.arr) a.arr = [];
  a.arr[o+i] = [av,ov];
}

function $hs_prim_ReadOffAddrOp_Addr(a,o,i) {
  var addr = a.arr[o+i];
  ret1 = addr[1];
  return addr[0];
}

function fdReady(fd, write) {
//  console.log("### fdReady");
  if(write && fds[fd].writable) return 1;
  return 0;
};

function rtsSupportsBoundThreads() {
    return 1;
}

// function ghc_wrapper_d2ep_

function write(fd, buf, buf_offset, n) {
  return fds[fd].write(buf, buf_offset,n);
}

// fixme remove wrappers
var ghczuwrapperZC17ZCbaseZCSystemziPosixziInternalsZCwrite = write;
var ghczuwrapperZC16ZCbaseZCSystemziPosixziInternalsZCwrite = write;
var ghczuwrapperZC19ZCbaseZCSystemziPosixziInternalsZCwrite = write;
function writeConsole(buf, buf_offset, n) {
//  log("###writeConsole: " + n);
  var str = decodeUtf8(buf, n, buf_offset);
  if(typeof(process) !== 'undefined' && process && process.stdout) { /* node.js */
    process.stdout.write(str);
  } else if(typeof(putstr) !== 'undefined') { /* SpiderMonkey */
    putstr(str);
  } else if(typeof(console) !== 'undefined') {
    // we print too many newlines here, is it possible to fix that?
    console.log(str);
  }
  return n;
}

var stdout = { writable: true
             , readable: false
             , write: writeConsole
             };

var stdin = { writable: false
            , readable: true
            , read: function() { throw "unimplemented read: stdin"; }
            };

var stderr = { writable: true
             , readable: false
             , write: writeConsole
             };

var fds = [stdin, stdout, stderr];


