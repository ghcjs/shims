function u_towupper(ch) {
  return new String(ch).toUpperCase().charCodeAt(0);
}

function u_towlower(ch) {
  return new String(ch).toLowerCase().charCodeAt(0);
}

function u_iswspace(ch) {
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
   ret1 = 0; // offset 0
   return encodeUtf8("UTF-8");
}

// encode a javascript string to a zero terminated utf8 byte array
// fixme, high code points are a surrogate pair in js strings
function encodeUtf8(str) {
  var i;
  var n = 0;
  for(i=0;i<str.length;i++) {
    var c = str.charCodeAt(i);
    if(c <= 0x7F) {
      n++;
    } else if(c <= 0x7FF) {
      n+=2;
    } else if(c <= 0xFFFF) {
      n+=3;
    } else {
      n+=4;
    }
  }
  var v = new DataView(new ArrayBuffer(n+1));
  n = 0;
  for(i=0;i<str.length;i++) {
    var c = str.charCodeAt(i);
    if(c <= 0x7F) {
      v.setUint8(n, c);
      n++;
    } else if(c <= 0x7FF) {
      v.setUint8(n, (c >> 6) | 0xC0);
      v.setUint8(n+1, (c & 0x3F) | 0x80);
      n+=2;
    } else if (c <= 0xFFFF) {
      v.setUint8(n,   (c >> 12) | 0xC0);
      v.setUint8(n+1, ((c >> 6) & 0x3F) | 0x80);
      v.setUint8(n+2, (c & 0x3F) | 0x80);
      n+=3;
    } else { // fixme 5 and 6 byte decoding
      v.setUint8(n,   (c >> 18) | 0xC0);
      v.setUint8(n+1, ((c >> 12) & 0x3F) | 0x80);
      v.setUint8(n+2, ((c >> 6) & 0x3F) | 0x80);
      v.setUint8(n+3, (c & 0x3F) | 0x80);
      n+=4;
    }
  }
  v.setUint8(v.byteLength-1,0); // terminator
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

// decode a DataView with Utf8 chars to a JS string
// invalid characters are ignored
// fixme encode big codepoints as surrogate pair
function decodeUtf8(v,n0,start) {
  var n = n0 || v.byteLength;
  var arr = [];
  var i = start || 0;
  while(i < n) {
    var c = v.getUint8(i);
    if((c & 0x80) === 0) {
      arr.push(c & 0x7F);
      i++;
    } else if((c & 0xC0) === 0xC0) {
      arr.push( ((c & 0x1F) << 6)
              | (v.getUint8(i+1) & 0x3F)
              );
      i+=2;
    } else if((c & 0xE0) === 0xE0) {
      arr.push( ((c & 0x0F) << 12)
              | ((v.getUint8(i+1) & 0x3F) << 6)
              | (v.getUint8(i+2) & 0x3F)
              );
      i+=3;
    } else {
      arr.push( ((c & 0x07) << 18)
              | ((v.getUint8(i+1) & 0x3F) << 12)
              | ((v.getUint8(i+2) & 0x3F) <<  6)
              | (v.getUint8(i+3) & 0x3F)
              );
      i+=4;
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
//  log("#### " + fromStr + " -> " + toStr);
  return 1; // fixme?
}

function hs_iconv_close(iconv) {
  return 0;
}

function hs_iconv(iconv, inbuf,  inbuf_off, insize, insize_off,
                         outbuf, outbuf_off, outsize, outsize_off) {
  var inbuf2      = derefPtrA(inbuf, inbuf_off);
  var inbuf2_off  = derefPtrO(inbuf, inbuf_off);
  var outbuf2     = derefPtrA(outbuf, outbuf_off);
  var outbuf2_off = derefPtrO(outbuf, outbuf_off);
//  var insiz       = insize.getUint32(insize_off);
//  var outsiz      = outsize.getUint32(outsize_off);
  // fixme support other encodings
  return utf32leToUtf8(inbuf2, inbuf2_off, insize, insize_off,
                       outbuf2, outbuf2_off, outsize, outsize_off);
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
function utf32leToUtf8(inbuf, inbuf_off, insize, insize_off,
                       outbuf, outbuf_off, outsize, outsize_off) {
  var inbuf_left = insize.getUint32(insize_off);
  var outbuf_left = outsize.getUint32(outsize_off);
  var in_max  = inbuf_off + inbuf_left;
  var out_max = outbuf_off + outbuf_left;
  var in_off    = inbuf_off;
  var out_off   = outbuf_off;
  var n = 0;
//  log("### converting utf8");
//  log("### inbuf_off: " + inbuf_off);
//  log("### inbuf_left: " + inbuf_left);
//  log("### in_max: " + in_max);
//  log("### nbuf length: " + inbuf.byteLength);
  while(in_off + 3 < in_max) {
//    log("### converting: " + in_off);
    var codePoint = inbuf.getUint32(in_off);
    if(codePoint <= 0x7f) {
      if(out_off + 1 < out_max) {
//        log("### converted: " + String.fromCharCode(codePoint));
        outbuf.setUint8(out_off, codePoint);
        out_off++;
      } else {
        break;
      }
    } else if(codePoint <= 0x7ff) {
      if(out_off + 2 < out_max) {
  
      }
      throw "unimplemented";
    } else {
      throw "unimplemented";
    }
    in_off += 4;
  }
  outsize.setUint32(outsize_off, out_max - out_off);
  insize.setUint32(insize_off, in_max - in_off);
//  log("### converted chars: " + ((in_off - inbuf_off) / 4));
  return 0; // all conversions are reversible return (in_off - inbuf_off) / 4;
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

function writeConsole(buf, buf_offset, n) {
//  console.log("###writeConsole");
  var str = decodeUtf8(buf, n, buf_offset);
  if(typeof(process) !== 'undefined' && process && process.stdout) { /* node.js */
    process.stdout.write(str);
//    console.log("\n###/writeConsole");
    return n;
  } else if(typeof(putstr) !== 'undefined') { /* SpiderMonkey */
    putstr(str);
  } else if(typeof(console) !== 'undefined') {
    // we print too many newlines her is, it possible to fix that?
    console.log(str);
  }
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


