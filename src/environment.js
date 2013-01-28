function getProgArgv(pid,pio,psd,pso) {
  pid.setInt32(pio, 0);
}

var $hs_errno = 0;
function __hscore_get_errno() {
  log("### __hscore_get_errno: " + $hs_errno);
  return $hs_errno; 
}

function strerror(err) {
  ret1 = 0;
  return encodeUtf8("error");
}
