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

// these aren't added to the CAFs, so the list stays in mem indefinitely, is that a problem?
function h$strt(str) { return h$c1(h$lazy_e, function() { return h$toHsString(str); }); }
function h$strta(str) {return h$c1(h$lazy_e, function() { return h$toHsStringA(str); }); }
function h$strtb(arr) { return h$c1(h$lazy_e, function() { return h$toHsStringMU8(arr); }); }

// unpack strings without thunks
function h$ustra(str) { return h$toHsStringA(str); }  // ascii string, string argument
function h$ustr(str) { return h$toHsString(str); }    // utf8 string, string argument
function h$urstra(arr) { return h$toHsList(arr); }     // ascii string, array of codepoints argument
function h$urstr(arr) { return h$toHsStringMU8(arr); } // utf8 string, array of bytes argumnt


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

var h$unicodeCat = null;
function h$u_gencat(a) {
    if(h$unicodeCat == null) {
        h$unicodeCat = [];
        // concatMap (\run ->
        //    case run of
        //        [a]   -> [chr (a+64)]
        //        (a:_) -> show (length run) ++ [chr (a+64)]) . group $ map (fromEnum . generalCategory) ['\x00'..'\xFFFF']
        var s = "32YV3QS3QMNQRQL2Q10H2Q3R2Q26@MQNTKT26AMRNR33YVQ4S2UTUAORZUTUR2JTAUQTJAP3JQ23@R7@24AR8A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@2A@A@A@A@A@A@A@A@2A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A2@A@A@3A2@A@A2@A3@2A4@A2@A3@3A2@A2@A@A@A2@A@2A@A2@A3@A@A2@2AD@3A4D@BA@BA@BA@A@A@A@A@A@A@A@2A@A@A@A@A@A@A@A@A@2A@BA@A3@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@7A2@A2@2A@A4@A@A@A@A@69AD27A18C4T12C14T5C7TCTC17T112E@A@ACT@A2]C3AQ5]2T@Q3@]@]2@A17@]9@35A@2A3@3A@A@A@A@A@A@A@A@A@A@A@A@5A@AR@A2@2A51@48A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@AU5E2G@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A2@A@A@A@A@A@A@2A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A9]38@2]C6Q]39A]QL6]45ELEQ2EQ2EQE8]27D5]3D2Q11]4Z2]3R2QS2Q2U11EQ2]2Q32DC10D21E10H4Q2DE99DQD7EZU6E2C2EU4E2D10H3D2UD14Q]ZDE30D27E2]89D11ED14]10H33D9E2CU3QC5]22D4EC9EC3EC5E2]15Q]25D3E2]Q161]3EF54DEFED3F8E4FE2FD7E10D2E2Q10HQC6D]7D]E2F]8D2]2D2]22D]7D]D3]4D2]ED3F4E2]2F2]2FED8]F4]2D]3D2E2]10H2D2S6JUS5]2EF]6D4]2D2]22D]7D]2D]2D]2D2]E]3F2E4]2E2]3E3]E7]4D]D7]10H2E3DE11]2EF]9D]3D]22D]7D]2D]5D2]ED3F5E]2EF]2FE2]D15]2D2E2]10H]S15]E2F]8D2]2D2]22D]7D]2D]5D2]EDFEF4E2]2F2]2FE8]EF4]2D]3D2E2]10HUD6J10]ED]6D3]3D]4D3]2D]D]2D3]2D3]3D3]12D4]2FE2F3]3F]3FE2]D6]F14]10H3J6USU6]3F]8D]3D]23D]10D]5D3]D3E4F]3E]4E7]2E]2D6]2D2E2]10H8]7JU2]2F]8D]3D]23D]10D]5D2]EDFE5F]E2F]2F2E7]2F7]D]2D2E2]10H]2D15]2F]8D]3D]41D2]D3F4E]3F]3FED8]F8]2D2E2]10H6J3]U6D2]2F]18D3]24D]9D]D2]7D3]E4]3F3E]E]8F18]2FQ12]48DE2D7E4]S6DC8EQ10H2Q37]2D]D2]2D]D2]D6]4D]7D]3D]D]D2]2D]4DE2D6E]2ED2]5D]C]6E2]10H2]2D34]D3U15Q5U2E6U10H10JUEUEUEMNMN2F8D]36D4]14EF5EQ2E5D11E]36E]8UE6U]2U5Q4U2Q37]43D2F4EF6EF2E2F2ED10H6Q6D2F2E4D3ED3F2D7F3D4E13DE2F2E6FEDF10H3FE2U38@10]43DQC3]329D]4D2]7D]D]4D2]41D]4D2]33D]4D2]7D]D]4D2]15D]57D]4D2]67D2]3EU8Q20J3]16D10U6]85D11]L620D2Q17DV26DMN3]75D3Q3I15]13D]4D3E11]18D3E2Q9]18D2E12]13D]3D]2E12]52D2ZF7E8FE2F11E3QC3QSDE2]10H6]10J6]6QL4Q3EV]10H6]35DC52D8]41DED5]70D10]29D3]3E4F2E3F4]2FE6F3E4]U3]2Q10H30D2]5D11]44D4]17F7D2F6]10HJ3]34U23D2E3F2]2Q53DFEF7E]EFE2F8E6F10E2]E10H6]10H6]7QC6Q82]4EF47DEF5EFE5FE2F7D4]10H7Q10U9E9U3]2EF30DF4E2F2EF3]2D10H6]38DEF2E3FEF3E2F8]4Q36D8F8E2F2E3]5Q10H3]3D10H30D6C2Q80]3EQ13EF7E4DE4DF13]44A54C22AC34A37C39E21]4E@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@9A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@9A8@6A2]6@2]8A8@8A8@6A2]6@2]8A]@]@]@]@8A8@14A2]8A8B8A8B8A8B5A]2A4@BTA3T3A]2A4@B3T4A2]2A4@]3T8A5@3T2]3A]2A4@B2T]11V5Z6L2QOPM2OPMO8QWX5ZV9QOP4Q2K3QRMN11QRQK10QV5Z5]6ZJC2]6J3RMNC10J3RMN]13C3]26S22]13E4GE3G12E15]2U@4U@2UA3@2A3@AU@2UR5@6U@U@U@U4@UA4@A4DA2U2A2@5R@4AUR2UAU16J35I@A4IJ6]5R5U2R4UR2UR2UR7UR31U2R2URUR31U268R8U4R20U2R7UMN81UR30U25R40U6R18U12]39U25]11U21]60J78U22J183UR9UR54U8R111UR144U]103UMNMNMNMNMNMNMN30J44U5RMN4R]R]24RMNMNMNMNMN16R256U131RMNMNMNMNMNMNMNMNMNMNMN63RMNMN32RMN258R48U21R2U6R3]10U166]47@]47A]@A3@2A@A@A@A4@A@2A@7AC3@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@2A6U@A@A3E7]4QJ2Q38A10]54D9]CQ14]E23D9]7D]7D]7D]7D]7D]7D]7D]7D]32E2QOPOP3QOPQOP9QL2QLQOP2QOPMNMNMNMN5QC2Q78]26U]89U12]214U26]12U4]V3QUCDIMNMNMNMNMN2UMNMNMNMNLM2NU9I6EL5C2U3ICDQ2U]86D2]2E2T2CDL90DQ3CD5]41D3]94D]2U4J10U27D5]36U12]16D31U]10J39U15J32U10J39U15J63U]256U6582D10]64U20940D52]21DC1143D3]55U9]40D6C2Q268DC3Q16D10H2D20]@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@ADE3GQ8]2EQC@A@A@A@A@A@A@A@A@A@A@A@A8]70D10I2E6Q8]23T9C2T@A@A@A@A@A@A@3A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@A@AC8A@A@A2@A@A@A@A@AC2T@A@A]@A14]@A@A@A@A@A80]A7DE3DE4DE23D2F2EF4U4]6J2USU6]52D4Q8]2F50D16FE9]2Q10H6]18E6D3QD4]10H28D8E2Q23D11E2F11]Q29D3]3EF47DE2F4E2FE4F13Q]C10H4]2Q32]41D6E2F2E2F2E9]3DE8DEF2]10H2]4Q16DC6D3UDF4]48DED3E2D2E5D2EDED24]2DC2Q33]6D2]6D2]6D9]7D]7D145]35D2FE2FE2FQFE2]10H6]11172D12]23D4]49D4]2048[6400\\302D2]62D2]106D38]7A12]5A5]DE10DR13D]5D]D]2D]2D]108D16T17]363DMN16]64D2]54D40]12DSU2]16E7QMNQ6]7E9]Q2L2KMNMNMNMNMNMNMNMN2QMN4Q3K3Q]4QLMNMNMN3QRL3R]QS2Q4]5D]135D2]Z]3QS3QMNQRQL2Q10H2Q3R2Q26@MQNTKT26AMRNRMNQMN2Q10DC45D2C31D3]6D2]6D2]6D2]3D3]2SRTU2S]U4R2U10]3Z2U2]";
        for(var n = 0; n != s.length; n++) {
            var l = '';
            while(strIsNumericAt(s,n)) {
                l = l + s[n++];
            }
            l = (l === '') ? 1 : (l | 0);
            var c = s[n].charCodeAt() - 64;
            for(var x = 0; x !== l; x++)
                h$unicodeCat[h$unicodeCat.length] = c;
        }
    }
    function strIsNumericAt(s,n) { var ch = s.charCodeAt(n); return ch >= 48 && ch <= 57; }
    return h$unicodeCat[a]|0;
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

// string must have been completely forced first
function h$fromHsString(str) {
    var xs = '';
    while(str.f.a === 2) {
        xs += String.fromCharCode(str.d1);
        str = str.d2;
    }
    return xs;
}

// list of JSRef to array, list must have been completely forced first
function h$fromHsListJSRef(xs) {
    var arr = [];
    while(xs.f.a === 2) {
        arr.push(xs.d1.d1);
        xs = xs.d2;
    }
    return arr;
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

// convert array with modified UTF-8 encoded text
function h$toHsStringMU8(arr) {
    var accept = false, b, n = 0, cp = 0, r = h$ghczmprimZCGHCziTypesziZMZN, i = arr.length - 1;
    while(i >= 0) {
        b = arr[i];
        if(!(b & 128)) {
            cp = b;
            accept = true;
        } else if((b & 192) === 128) {
            cp += (b & 32) * Math.pow(64, n)
        } else {
            cp += (b&((1<<(6-n))-1)) * Math.pow(64, n);
            accept = true;
        }
        if(accept) {
            r  = h$c2(h$ghczmprimZCGHCziTypesziZC_con_e, cp, r);
            cp = 0
            n  = 0;
        } else {
            n++;
        }
        accept = false;
        i--;
    }
    return r;
}

// array of JS values to Haskell list of JSRef
function h$toHsListJSRef(arr) {
    var r = h$ghczmprimZCGHCziTypesziZMZN;
    for(var i=arr.length-1;i>=0;i--) {
        r = h$c2(h$ghczmprimZCGHCziTypesziZC_con_e, h$mkJSRef(arr[i]), r);
    }
    return r;
}

// array of heap objects to Haskell list
function h$toHsList(arr) {
    var r = h$ghczmprimZCGHCziTypesziZMZN;
    for(var i=arr.length-1;i>=0;i--) {
        r = h$c2(h$ghczmprimZCGHCziTypesziZC_con_e, arr[i], r);
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


