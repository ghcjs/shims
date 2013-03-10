
function h$MD5Init(ctx, ctx_off) {
  if(!ctx.arr) { ctx.arr = []; }
  ctx.arr[ctx_off] = new goog.crypt.Md5();
}

function h$MD5Update(ctx, ctx_off, data, data_off, len) {
  var arr = new Uint8Array(data.buffer, data_off);
  ctx.arr[ctx_off].update(arr, len);
}

function h$MD5Final(dst, dst_off, ctx, ctx_off) {
  var digest = ctx.arr[ctx_off].digest();
  for(var i=0;i<16;i++) {
    dst.setUint8(dst_off+i, digest[i]);
  }
}

