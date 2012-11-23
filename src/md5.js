
function MD5Init(ctx) {
  ctx.md5ctx = new goog.crypt.Md5();
}

function MD5Update(ctx, data, len) {
  ctx.md5ctx.update(new Uint8Array(data), len);
}

function MD5Final(dst, ctx) {
  var digest = ctx.md5ctx.digest();
  var dv = new DataView(digest);
  dst.putUint32(0, dv.getUint32(0));
  dst.putUint32(4, dv.getUint32(4));
}

