/* FNV-1 hash
 *
 * The FNV-1 hash description: http://isthe.com/chongo/tech/comp/fnv/
 * The FNV-1 hash is public domain: http://isthe.com/chongo/tech/comp/fnv/#public_domain
 */
function h$hashable_fnv_hash_offset(str_a, o, len, hash) {
  return h$hashable_fnv_hash(str_a, o, len, hash);
}

function h$hashable_fnv_hash(str_d, str_o, len, hash) {
  if(len > 0) {
    var d = str_d.u8;
    for(var i=0;i<len;i++) {
      hash = h$mulInt32(hash, 16777619) ^ d[str_o+i];
    }
  }
  return hash;
}

/*
 * These hash functions were developed by Thomas Wang.
 *
 * http://www.concentric.net/~ttwang/tech/inthash.htm
 */

function h$hashable_wang_32(a) {
  a = (a ^ 61) ^ (a >> 16);
  a = a + (a << 3);
  a = a ^ (a >> 4);
  a = a * 0x27d4eb2d;
  a = a ^ (a >> 15);
  return a;
}

/*
uint64_t hashable_wang_64(uint64_t key)
{
    key = (~key) + (key << 21); // key = (key << 21) - key - 1;
    key = key ^ ((key >> 24) | (key << 40));
    key = (key + (key << 3)) + (key << 8); // key * 265
    key = key ^ ((key >> 14) | (key << 50));
    key = (key + (key << 2)) + (key << 4); // key * 21
    key = key ^ ((key >> 28) | (key << 36));
    key = key + (key << 31);
    return key;
}
*/
