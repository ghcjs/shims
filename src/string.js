function u_towupper(ch) {
  return new String(ch).toUpperCase().charCodeAt(0);
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
    } else {
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
function decodeUtf8(v) {
  var n = v.byteLength;
  var arr = [];
  var i = 0;
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
