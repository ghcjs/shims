// JS Objects stuff

function h$isFloat (n) {
  return n===+n && n!==(n|0);
}

function h$isInteger (n) {
  return n===+n && n===(n|0);
}

function h$typeOf(o) {
    if (!(o instanceof Object)) {
        if (o == null) { 
            return 'null'; 
        } else if (typeof o == 'number') {
            if (h$isInteger(o)) {
                return 'integer';
            } else {
                return 'float';
            }
        } else {
            return (typeof o);
        }
    } else {
        if (Object.prototype.toString.call(o) == '[object Array]') {
            // it's an array
            return 'array';
        } else if (!o) {
            // null 
            return 'null';
        } else {
            // it's an object
            return 'object';
        }
    }
}

function h$listprops(o) {
    if (!(o instanceof Object)) {
        return [];
    }
    var l = [];
    for (var prop in o) {
        l.push(prop);
    }
    return l;
}

function h$flattenObj(o) {
    var l = [];
    for (var prop in o) {
        l.push([prop, o[prop]]);
    }
    return l;
}
