function h$hsprimitive_memcpy(dst_d, dst_o, doff, src_d, src_o, soff, len) {
  return h$primitive_memmove(dst_d, dst_o, doff, src_d, src_o, len);
}

function h$hsprimitive_memmove(dst_d, dst_o, doff, src_d, src_o, soff, len) {
  if(len === 0) return;
  var du8 = dst_d.u8, su8 = src_d.u8;
  for(var i=len-1;i>=0;i--) {
    du8[dst_o+i] = su8[src_o+i];
  }
}

#define MEMSET(TYPE, SIZE, PROP)                             \
function h$hsprimitive_memset_ ## TYPE (p_d, p_o, off, n, x) { \
  var start = (p_o >> SIZE) + off;                           \
  if(n > 0) p_d.PROP.fill(x, start, start + n);              \
}

MEMSET(Word8,  0, u8)
MEMSET(Word16, 1, u1)
MEMSET(Word32, 2, i3)
MEMSET(Word,   2, i3)
MEMSET(Float,  2, f3)
MEMSET(Double, 3, f6)
MEMSET(Char,   2, i3)

function h$hsprimitive_memset_Word64(p_d, p_o, off, n, x_1, x_2) {
  var start = (p_o >> 3) + off;
  if(n > 0) {
    var pi3 = p_d.i3;
    for(var i = 0; i < n; i++) {
      var o = (start + i) << 1;
      pi3[o]   = x_1;
      pi3[o+1] = x_2;
    }
  }
}

function h$hsprimitive_memset_Ptr(p_d, p_o, off, n, x_1, x_2) {
  if(n > 0) {
    if(!p_d.arr) p_d.arr = [];
    var a = p_d.arr;
    for(var i = 0; i < n; i++) {
      a[p_o + ((off + i) << 2)] = [x_1, x_2];
    }
  }
}
