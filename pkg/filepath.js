function h$filepath_isWindows() {
  if(typeof process !== undefined && process.platform === 'win32') return true;
  return false;
}
