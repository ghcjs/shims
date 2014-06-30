var BigInteger = function() {

var dbits, DV, BI_FP;

#include "jsbn.js"
#include "jsbn2.js"

// customization for GHCJS
BigInteger.prototype.am = am3;
dbits = 28;
DV = (1<<dbits);
BigInteger.prototype.DB = dbits;
BigInteger.prototype.DM = ((1<<dbits)-1);
BigInteger.prototype.DV = (1<<dbits);
BI_FP = 52;
BigInteger.prototype.FV = Math.pow(2,BI_FP);
BigInteger.prototype.F1 = BI_FP-dbits;
BigInteger.prototype.F2 = 2*dbits-BI_FP;

BigInteger.nbv = nbv;
BigInteger.nbi = nbi;

return BigInteger;

}();

// fixme prefix this
var h$nbv = BigInteger.nbv;
var h$nbi = BigInteger.nbi;
