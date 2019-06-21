import F, { node } from 'fluture';
import { curryN, __, pipe as pipe$1, curry as curry$1, chain, identity, propOr, find, equals, map, join, pathOr, path as path$2, toPairs, reduce, prop as prop$1 } from 'ramda';
import getStdin from 'get-stdin';
import path$1 from 'path';
import fs from 'fs';
import constants from 'constants';
import stream from 'stream';
import util from 'util';
import assert from 'assert';
import cliui from 'cliui';
import color from 'kleur';
import stripAnsi from 'strip-ansi';
import debug from 'debug';
import execa from 'execa';

var relativePathWithCWD = curryN(2, path$1.relative);

var _path = /*#__PURE__*/Object.freeze({
	relativePathWithCWD: relativePathWithCWD
});

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var origCwd = process.cwd;
var cwd = null;
var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
process.cwd = function () {
  if (!cwd) cwd = origCwd.call(process);
  return cwd;
};
try {
  process.cwd();
} catch (er) {}
var chdir = process.chdir;
process.chdir = function (d) {
  cwd = null;
  chdir.call(process, d);
};
var polyfills = patch;
function patch(fs) {
  if (constants.hasOwnProperty('O_SYMLINK') && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    patchLchmod(fs);
  }
  if (!fs.lutimes) {
    patchLutimes(fs);
  }
  fs.chown = chownFix(fs.chown);
  fs.fchown = chownFix(fs.fchown);
  fs.lchown = chownFix(fs.lchown);
  fs.chmod = chmodFix(fs.chmod);
  fs.fchmod = chmodFix(fs.fchmod);
  fs.lchmod = chmodFix(fs.lchmod);
  fs.chownSync = chownFixSync(fs.chownSync);
  fs.fchownSync = chownFixSync(fs.fchownSync);
  fs.lchownSync = chownFixSync(fs.lchownSync);
  fs.chmodSync = chmodFixSync(fs.chmodSync);
  fs.fchmodSync = chmodFixSync(fs.fchmodSync);
  fs.lchmodSync = chmodFixSync(fs.lchmodSync);
  fs.stat = statFix(fs.stat);
  fs.fstat = statFix(fs.fstat);
  fs.lstat = statFix(fs.lstat);
  fs.statSync = statFixSync(fs.statSync);
  fs.fstatSync = statFixSync(fs.fstatSync);
  fs.lstatSync = statFixSync(fs.lstatSync);
  if (!fs.lchmod) {
    fs.lchmod = function (path, mode, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lchmodSync = function () {};
  }
  if (!fs.lchown) {
    fs.lchown = function (path, uid, gid, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lchownSync = function () {};
  }
  if (platform === "win32") {
    fs.rename = function (fs$rename) {
      return function (from, to, cb) {
        var start = Date.now();
        var backoff = 0;
        fs$rename(from, to, function CB(er) {
          if (er && (er.code === "EACCES" || er.code === "EPERM") && Date.now() - start < 60000) {
            setTimeout(function () {
              fs.stat(to, function (stater, st) {
                if (stater && stater.code === "ENOENT") fs$rename(from, to, CB);else cb(er);
              });
            }, backoff);
            if (backoff < 100) backoff += 10;
            return;
          }
          if (cb) cb(er);
        });
      };
    }(fs.rename);
  }
  fs.read = function (fs$read) {
    return function (fd, buffer, offset, length, position, callback_) {
      var _callback;
      if (callback_ && typeof callback_ === 'function') {
        var eagCounter = 0;
        _callback = function callback(er, _, __) {
          if (er && er.code === 'EAGAIN' && eagCounter < 10) {
            eagCounter++;
            return fs$read.call(fs, fd, buffer, offset, length, position, _callback);
          }
          callback_.apply(this, arguments);
        };
      }
      return fs$read.call(fs, fd, buffer, offset, length, position, _callback);
    };
  }(fs.read);
  fs.readSync = function (fs$readSync) {
    return function (fd, buffer, offset, length, position) {
      var eagCounter = 0;
      while (true) {
        try {
          return fs$readSync.call(fs, fd, buffer, offset, length, position);
        } catch (er) {
          if (er.code === 'EAGAIN' && eagCounter < 10) {
            eagCounter++;
            continue;
          }
          throw er;
        }
      }
    };
  }(fs.readSync);
  function patchLchmod(fs) {
    fs.lchmod = function (path, mode, callback) {
      fs.open(path, constants.O_WRONLY | constants.O_SYMLINK, mode, function (err, fd) {
        if (err) {
          if (callback) callback(err);
          return;
        }
        fs.fchmod(fd, mode, function (err) {
          fs.close(fd, function (err2) {
            if (callback) callback(err || err2);
          });
        });
      });
    };
    fs.lchmodSync = function (path, mode) {
      var fd = fs.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode);
      var threw = true;
      var ret;
      try {
        ret = fs.fchmodSync(fd, mode);
        threw = false;
      } finally {
        if (threw) {
          try {
            fs.closeSync(fd);
          } catch (er) {}
        } else {
          fs.closeSync(fd);
        }
      }
      return ret;
    };
  }
  function patchLutimes(fs) {
    if (constants.hasOwnProperty("O_SYMLINK")) {
      fs.lutimes = function (path, at, mt, cb) {
        fs.open(path, constants.O_SYMLINK, function (er, fd) {
          if (er) {
            if (cb) cb(er);
            return;
          }
          fs.futimes(fd, at, mt, function (er) {
            fs.close(fd, function (er2) {
              if (cb) cb(er || er2);
            });
          });
        });
      };
      fs.lutimesSync = function (path, at, mt) {
        var fd = fs.openSync(path, constants.O_SYMLINK);
        var ret;
        var threw = true;
        try {
          ret = fs.futimesSync(fd, at, mt);
          threw = false;
        } finally {
          if (threw) {
            try {
              fs.closeSync(fd);
            } catch (er) {}
          } else {
            fs.closeSync(fd);
          }
        }
        return ret;
      };
    } else {
      fs.lutimes = function (_a, _b, _c, cb) {
        if (cb) process.nextTick(cb);
      };
      fs.lutimesSync = function () {};
    }
  }
  function chmodFix(orig) {
    if (!orig) return orig;
    return function (target, mode, cb) {
      return orig.call(fs, target, mode, function (er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      });
    };
  }
  function chmodFixSync(orig) {
    if (!orig) return orig;
    return function (target, mode) {
      try {
        return orig.call(fs, target, mode);
      } catch (er) {
        if (!chownErOk(er)) throw er;
      }
    };
  }
  function chownFix(orig) {
    if (!orig) return orig;
    return function (target, uid, gid, cb) {
      return orig.call(fs, target, uid, gid, function (er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      });
    };
  }
  function chownFixSync(orig) {
    if (!orig) return orig;
    return function (target, uid, gid) {
      try {
        return orig.call(fs, target, uid, gid);
      } catch (er) {
        if (!chownErOk(er)) throw er;
      }
    };
  }
  function statFix(orig) {
    if (!orig) return orig;
    return function (target, cb) {
      return orig.call(fs, target, function (er, stats) {
        if (!stats) return cb.apply(this, arguments);
        if (stats.uid < 0) stats.uid += 0x100000000;
        if (stats.gid < 0) stats.gid += 0x100000000;
        if (cb) cb.apply(this, arguments);
      });
    };
  }
  function statFixSync(orig) {
    if (!orig) return orig;
    return function (target) {
      var stats = orig.call(fs, target);
      if (stats.uid < 0) stats.uid += 0x100000000;
      if (stats.gid < 0) stats.gid += 0x100000000;
      return stats;
    };
  }
  function chownErOk(er) {
    if (!er) return true;
    if (er.code === "ENOSYS") return true;
    var nonroot = !process.getuid || process.getuid() !== 0;
    if (nonroot) {
      if (er.code === "EINVAL" || er.code === "EPERM") return true;
    }
    return false;
  }
}

var Stream = stream.Stream;
var legacyStreams = legacy;
function legacy(fs) {
  return {
    ReadStream: ReadStream,
    WriteStream: WriteStream
  };
  function ReadStream(path, options) {
    if (!(this instanceof ReadStream)) return new ReadStream(path, options);
    Stream.call(this);
    var self = this;
    this.path = path;
    this.fd = null;
    this.readable = true;
    this.paused = false;
    this.flags = 'r';
    this.mode = 438;
    this.bufferSize = 64 * 1024;
    options = options || {};
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }
    if (this.encoding) this.setEncoding(this.encoding);
    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.end === undefined) {
        this.end = Infinity;
      } else if ('number' !== typeof this.end) {
        throw TypeError('end must be a Number');
      }
      if (this.start > this.end) {
        throw new Error('start must be <= end');
      }
      this.pos = this.start;
    }
    if (this.fd !== null) {
      process.nextTick(function () {
        self._read();
      });
      return;
    }
    fs.open(this.path, this.flags, this.mode, function (err, fd) {
      if (err) {
        self.emit('error', err);
        self.readable = false;
        return;
      }
      self.fd = fd;
      self.emit('open', fd);
      self._read();
    });
  }
  function WriteStream(path, options) {
    if (!(this instanceof WriteStream)) return new WriteStream(path, options);
    Stream.call(this);
    this.path = path;
    this.fd = null;
    this.writable = true;
    this.flags = 'w';
    this.encoding = 'binary';
    this.mode = 438;
    this.bytesWritten = 0;
    options = options || {};
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }
    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.start < 0) {
        throw new Error('start must be >= zero');
      }
      this.pos = this.start;
    }
    this.busy = false;
    this._queue = [];
    if (this.fd === null) {
      this._open = fs.open;
      this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);
      this.flush();
    }
  }
}

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

function _toArray(arr) {
  return _arrayWithHoles(arr) || _iterableToArray(arr) || _nonIterableRest();
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  }
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

function _iterableToArrayLimit(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

var clone_1 = clone;
function clone(obj) {
  if (obj === null || _typeof(obj) !== 'object') return obj;
  if (obj instanceof Object) var copy = {
    __proto__: obj.__proto__
  };else var copy = Object.create(null);
  Object.getOwnPropertyNames(obj).forEach(function (key) {
    Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
  });
  return copy;
}

var gracefulFs = createCommonjsModule(function (module) {
  var queue = [];
  function noop() {}
  var debug = noop;
  if (util.debuglog) debug = util.debuglog('gfs4');else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) debug = function debug() {
    var m = util.format.apply(util, arguments);
    m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ');
    console.error(m);
  };
  if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
    process.on('exit', function () {
      debug(queue);
      assert.equal(queue.length, 0);
    });
  }
  module.exports = patch(clone_1(fs));
  if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs.__patched) {
    module.exports = patch(fs);
    fs.__patched = true;
  }
  module.exports.close = function (fs$close) {
    return function (fd, cb) {
      return fs$close.call(fs, fd, function (err) {
        if (!err) retry();
        if (typeof cb === 'function') cb.apply(this, arguments);
      });
    };
  }(fs.close);
  module.exports.closeSync = function (fs$closeSync) {
    return function (fd) {
      var rval = fs$closeSync.apply(fs, arguments);
      retry();
      return rval;
    };
  }(fs.closeSync);
  if (!/\bgraceful-fs\b/.test(fs.closeSync.toString())) {
    fs.closeSync = module.exports.closeSync;
    fs.close = module.exports.close;
  }
  function patch(fs) {
    polyfills(fs);
    fs.gracefulify = patch;
    fs.FileReadStream = ReadStream;
    fs.FileWriteStream = WriteStream;
    fs.createReadStream = createReadStream;
    fs.createWriteStream = createWriteStream;
    var fs$readFile = fs.readFile;
    fs.readFile = readFile;
    function readFile(path, options, cb) {
      if (typeof options === 'function') cb = options, options = null;
      return go$readFile(path, options, cb);
      function go$readFile(path, options, cb) {
        return fs$readFile(path, options, function (err) {
          if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([go$readFile, [path, options, cb]]);else {
            if (typeof cb === 'function') cb.apply(this, arguments);
            retry();
          }
        });
      }
    }
    var fs$writeFile = fs.writeFile;
    fs.writeFile = writeFile;
    function writeFile(path, data, options, cb) {
      if (typeof options === 'function') cb = options, options = null;
      return go$writeFile(path, data, options, cb);
      function go$writeFile(path, data, options, cb) {
        return fs$writeFile(path, data, options, function (err) {
          if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([go$writeFile, [path, data, options, cb]]);else {
            if (typeof cb === 'function') cb.apply(this, arguments);
            retry();
          }
        });
      }
    }
    var fs$appendFile = fs.appendFile;
    if (fs$appendFile) fs.appendFile = appendFile;
    function appendFile(path, data, options, cb) {
      if (typeof options === 'function') cb = options, options = null;
      return go$appendFile(path, data, options, cb);
      function go$appendFile(path, data, options, cb) {
        return fs$appendFile(path, data, options, function (err) {
          if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([go$appendFile, [path, data, options, cb]]);else {
            if (typeof cb === 'function') cb.apply(this, arguments);
            retry();
          }
        });
      }
    }
    var fs$readdir = fs.readdir;
    fs.readdir = readdir;
    function readdir(path, options, cb) {
      var args = [path];
      if (typeof options !== 'function') {
        args.push(options);
      } else {
        cb = options;
      }
      args.push(go$readdir$cb);
      return go$readdir(args);
      function go$readdir$cb(err, files) {
        if (files && files.sort) files.sort();
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([go$readdir, [args]]);else {
          if (typeof cb === 'function') cb.apply(this, arguments);
          retry();
        }
      }
    }
    function go$readdir(args) {
      return fs$readdir.apply(fs, args);
    }
    if (process.version.substr(0, 4) === 'v0.8') {
      var legStreams = legacyStreams(fs);
      ReadStream = legStreams.ReadStream;
      WriteStream = legStreams.WriteStream;
    }
    var fs$ReadStream = fs.ReadStream;
    if (fs$ReadStream) {
      ReadStream.prototype = Object.create(fs$ReadStream.prototype);
      ReadStream.prototype.open = ReadStream$open;
    }
    var fs$WriteStream = fs.WriteStream;
    if (fs$WriteStream) {
      WriteStream.prototype = Object.create(fs$WriteStream.prototype);
      WriteStream.prototype.open = WriteStream$open;
    }
    fs.ReadStream = ReadStream;
    fs.WriteStream = WriteStream;
    function ReadStream(path, options) {
      if (this instanceof ReadStream) return fs$ReadStream.apply(this, arguments), this;else return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
    }
    function ReadStream$open() {
      var that = this;
      open(that.path, that.flags, that.mode, function (err, fd) {
        if (err) {
          if (that.autoClose) that.destroy();
          that.emit('error', err);
        } else {
          that.fd = fd;
          that.emit('open', fd);
          that.read();
        }
      });
    }
    function WriteStream(path, options) {
      if (this instanceof WriteStream) return fs$WriteStream.apply(this, arguments), this;else return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
    }
    function WriteStream$open() {
      var that = this;
      open(that.path, that.flags, that.mode, function (err, fd) {
        if (err) {
          that.destroy();
          that.emit('error', err);
        } else {
          that.fd = fd;
          that.emit('open', fd);
        }
      });
    }
    function createReadStream(path, options) {
      return new ReadStream(path, options);
    }
    function createWriteStream(path, options) {
      return new WriteStream(path, options);
    }
    var fs$open = fs.open;
    fs.open = open;
    function open(path, flags, mode, cb) {
      if (typeof mode === 'function') cb = mode, mode = null;
      return go$open(path, flags, mode, cb);
      function go$open(path, flags, mode, cb) {
        return fs$open(path, flags, mode, function (err, fd) {
          if (err && (err.code === 'EMFILE' || err.code === 'ENFILE')) enqueue([go$open, [path, flags, mode, cb]]);else {
            if (typeof cb === 'function') cb.apply(this, arguments);
            retry();
          }
        });
      }
    }
    return fs;
  }
  function enqueue(elem) {
    debug('ENQUEUE', elem[0].name, elem[1]);
    queue.push(elem);
  }
  function retry() {
    var elem = queue.shift();
    if (elem) {
      debug('RETRY', elem[0].name, elem[1]);
      elem[0].apply(null, elem[1]);
    }
  }
});
var gracefulFs_1 = gracefulFs.close;
var gracefulFs_2 = gracefulFs.closeSync;

var readRaw = curryN(3, gracefulFs.readFile);
var readUTF8 = readRaw(__, "utf8");
var readFile = pipe$1(readUTF8, node);
var writeRaw = curryN(4, gracefulFs.writeFile);
var writeUTF8 = writeRaw(__, __, "utf8");
var writeFile = curry$1(function (to, data) {
  return pipe$1(writeUTF8(to), node)(data);
});

var _io = /*#__PURE__*/Object.freeze({
	readRaw: readRaw,
	readUTF8: readUTF8,
	readFile: readFile,
	writeRaw: writeRaw,
	writeUTF8: writeUTF8,
	writeFile: writeFile
});

var readRelative = pipe$1(relativePathWithCWD(process.cwd()), readFile);
var readStdin = F.encaseP(getStdin);
var readWithOpts = curry$1(function (opts, source) {
  return (
    opts.stdin ?
    readStdin()
    : F.of(source)
  );
});
var ensureBinary = function ensureBinary(fn) {
  if (process.env.NODE_ENV !== "production") {
    if (typeof fn !== "function" || typeof fn("test") !== "function") {
      throw new TypeError("Expected to be given a curried binary function!");
    }
  }
  return fn;
};
var processAsync = curry$1(function (fn, opts, source) {
  return pipe$1(
  opts.file ? readRelative : readWithOpts(opts),
  ensureBinary(fn)(opts),
  opts.output ? chain(writeFile(opts.output)) : identity)(source);
});

var _cli = /*#__PURE__*/Object.freeze({
	readRelative: readRelative,
	readStdin: readStdin,
	readWithOpts: readWithOpts,
	processAsync: processAsync
});

var _map = [color.red, color.yellow, color.bold, color.underline].map(function (z) {
  return function (withColor) {
    return function () {
      return (withColor ? z : identity).apply(void 0, arguments);
    };
  };
}),
    _map2 = _slicedToArray(_map, 4),
    red = _map2[0],
    yellow = _map2[1],
    bold = _map2[2],
    underline = _map2[3];
var matchesTypeFromConfig = curry$1(function (config, type, x) {
  return pipe$1(propOr([], type), find(equals(x)))(config);
});
var flag = function flag(z) {
  return (stripAnsi(z).length === 1 ? "-" : "--") + z;
};
var flagify = curry$1(function (useColors, flags) {
  return pipe$1(map(pipe$1(yellow(useColors), flag)), join(", "))(flags);
});
var wrapChars = curry$1(function (a, b) {
  return a[0] + b + a[1];
});
var TYPES = ["string", "boolean", "array", "number"];
var getRawDescriptionsOrThrow = curry$1(function (w, x) {
  return pipe$1(pathOr("TBD", ["raw", "descriptions", x.name]), function (d) {
    if (d === "TBD") {
      throw new Error("".concat(x.name, " needs a description!"));
    }
    return d;
  })(w);
});
var getDefaults = curry$1(function (w, x) {
  return pathOr(" ", ["raw", "yargsOpts", "default", x.name], w);
});
var getType = curry$1(function (w, x) {
  var matcher = matchesTypeFromConfig(w.raw.yargsOpts);
  var findFlag = function findFlag(t) {
    return find(matcher(t), x.flags) ? t : false;
  };
  var type = TYPES.map(findFlag).find(identity);
  return type;
});
var convertFlag = curry$1(function (w, x) {
  var type = getType(w, x);
  var description = getRawDescriptionsOrThrow(w, x);
  var def = getDefaults(w, x);
  return Object.assign({}, x, {
    type: type,
    description: description,
    "default": def
  });
});
var getFlagInformation = function getFlagInformation(conf) {
  return pipe$1(path$2(["yargsOpts", "alias"]), toPairs, map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        k = _ref2[0],
        v = _ref2[1];
    return {
      flags: [k].concat(_toConsumableArray(v)),
      name: k
    };
  }), reduce(function (_ref3, y) {
    var raw = _ref3.raw,
        data = _ref3.data;
    return {
      raw: raw,
      data: data.concat(y)
    };
  }, {
    raw: conf,
    data: []
  }), function (w) {
    return map(convertFlag(w), w.data);
  })(conf);
};
var getDefaultDiv = function getDefaultDiv(def) {
  return def !== " " ? {
    text: "(default: ".concat(def, ")"),
    align: "right",
    padding: [0, 2, 0, 0]
  } : def;
};
var helpWithOptions = curry$1(function (conf, argv) {
  var useColors = argv.color;
  var ui = cliui();
  var flags = getFlagInformation(conf);
  ui.div("\n".concat(underline(useColors)("Usage:"), " ").concat(bold(useColors)(conf.name), " <flags> [input]\n"));
  ui.div("".concat(underline(useColors)("Flags:"), "\n"));
  flags.forEach(function (_ref4) {
    var def = _ref4["default"],
        tags = _ref4.flags,
        description = _ref4.description,
        type = _ref4.type;
    return ui.div({
      text: flagify(useColors, tags),
      padding: [0, 0, 1, 1],
      align: "left"
    }, {
      text: pipe$1(red(useColors), wrapChars("[]"))(type),
      width: 15,
      padding: [0, 1, 0, 1],
      align: "center"
    }, {
      text: description,
      width: 36
    }, getDefaultDiv(def));
  });
  return ui.toString();
});

var _help = /*#__PURE__*/Object.freeze({
	matchesTypeFromConfig: matchesTypeFromConfig,
	flag: flag,
	flagify: flagify,
	wrapChars: wrapChars,
	getRawDescriptionsOrThrow: getRawDescriptionsOrThrow,
	getDefaults: getDefaults,
	convertFlag: convertFlag,
	getFlagInformation: getFlagInformation,
	helpWithOptions: helpWithOptions
});

var PLACEHOLDER = "🍛";
var $ = PLACEHOLDER;
var bindInternal3 = function bindInternal3(func, thisContext) {
  return function (a, b, c) {
    return func.call(thisContext, a, b, c);
  };
};
var some$1 = function fastSome(subject, fn, thisContext) {
  var length = subject.length,
      iterator = thisContext !== undefined ? bindInternal3(fn, thisContext) : fn,
      i;
  for (i = 0; i < length; i++) {
    if (iterator(subject[i], i, subject)) {
      return true;
    }
  }
  return false;
};
var curry = function curry(fn) {
  var test = function test(x) {
    return x === PLACEHOLDER;
  };
  return function curried() {
    var arguments$1 = arguments;
    var argLength = arguments.length;
    var args = new Array(argLength);
    for (var i = 0; i < argLength; ++i) {
      args[i] = arguments$1[i];
    }
    var countNonPlaceholders = function countNonPlaceholders(toCount) {
      var count = toCount.length;
      while (!test(toCount[count])) {
        count--;
      }
      return count;
    };
    var length = some$1(args, test) ? countNonPlaceholders(args) : args.length;
    function saucy() {
      var arguments$1 = arguments;
      var arg2Length = arguments.length;
      var args2 = new Array(arg2Length);
      for (var j = 0; j < arg2Length; ++j) {
        args2[j] = arguments$1[j];
      }
      return curried.apply(this, args.map(function (y) {
        return test(y) && args2[0] ? args2.shift() : y;
      }).concat(args2));
    }
    return length >= fn.length ? fn.apply(this, args) : saucy;
  };
};
var innerpipe = function innerpipe(args) {
  return function (x) {
    var first = args[0];
    var rest = args.slice(1);
    var current = first(x);
    for (var a = 0; a < rest.length; a++) {
      current = rest[a](current);
    }
    return current;
  };
};
function pipe() {
  var arguments$1 = arguments;
  var argLength = arguments.length;
  var args = new Array(argLength);
  for (var i = 0; i < argLength; ++i) {
    args[i] = arguments$1[i];
  }
  return innerpipe(args);
}
var prop = curry(function (property, o) {
  return o && property && o[property];
});
var _keys = Object.keys;
var keys = _keys;
var propLength = prop("length");
var objectLength = pipe(keys, propLength);
var delegatee = curry(function (method, arg, x) {
  return x[method](arg);
});
var filter = delegatee("filter");
function curryObjectN(arity, fn) {
  return function λcurryObjectN(args) {
    var joined = function joined(z) {
      return λcurryObjectN(Object.assign({}, args, z));
    };
    return args && Object.keys(args).length >= arity ? fn(args) : joined;
  };
}

var callWithScopeWhen = curry(function (effect, when, what, value) {
  var scope = what(value);
  if (when(scope)) effect(scope);
  return value;
});
var callBinaryWithScopeWhen = curry(function (effect, when, what, tag, value) {
  var scope = what(value);
  if (when(tag, scope)) effect(tag, scope);
  return value;
});
var always = function always() {
  return true;
};
var I = function I(x) {
  return x;
};
var callWhen = callWithScopeWhen($, $, I);
var call = callWithScopeWhen($, always, I);
var callWithScope = callWithScopeWhen($, always);
var callBinaryWhen = callBinaryWithScopeWhen($, $, I);
var callBinaryWithScope = callBinaryWithScopeWhen($, always);
var callBinary = callBinaryWithScopeWhen($, always, I);
var traceWithScopeWhen = callBinaryWithScopeWhen(console.log);
var traceWithScope = traceWithScopeWhen(always);
var inspect = traceWithScope;
var trace = inspect(I);
var traceWhen = callBinaryWithScopeWhen(console.log, $, I);
var segment = curryObjectN(3, function (_ref) {
  var _ref$what = _ref.what,
      what = _ref$what === void 0 ? I : _ref$what,
      _ref$when = _ref.when,
      when = _ref$when === void 0 ? always : _ref$when,
      tag = _ref.tag,
      value = _ref.value,
      effect = _ref.effect;
  if (when(tag, what(value))) {
    effect(tag, what(value));
  }
  return value;
});
var segmentTrace = segment({
  effect: console.log
});

var make = function make(maker) {
  return function (name) {
    var tagger = debug(name);
    return maker(tagger);
  };
};
var makeTracer = make(callBinary);
var makeInspector = pipe$1(function (k) {
  return "inspector:".concat(k);
}, make(callBinaryWithScope));

var _log = /*#__PURE__*/Object.freeze({
	makeTracer: makeTracer,
	makeInspector: makeInspector
});

var is = curry$1(function (expected, actual) {
  return expect(actual).toEqual(expected);
});
var matches = function matches(x) {
  return expect(x).toMatchSnapshot();
};
var testHook = curry$1(function (property, done, assertion, x) {
  return pipe$1(prop$1(property), assertion, function () {
    return done();
  })(x);
});
var testHookStdout = testHook("stdout");
var testHookStderr = testHook("stderr");
var testCLI = curry$1(function (_ref, testName, assertion) {
  var _ref2 = _toArray(_ref),
      exe = _ref2[0],
      args = _ref2.slice(1);
  test(testName, function (done) {
    return execa(exe, args)["catch"](done).then(testHookStdout(done, assertion));
  });
});
var resolveFrom = function resolveFrom(dir) {
  return function () {
    for (var _len = arguments.length, x = new Array(_len), _key = 0; _key < _len; _key++) {
      x[_key] = arguments[_key];
    }
    return path$1.resolve.apply(path$1, [dir].concat(x));
  };
};

var _testing = /*#__PURE__*/Object.freeze({
	is: is,
	matches: matches,
	testHook: testHook,
	testHookStdout: testHookStdout,
	testHookStderr: testHookStderr,
	testCLI: testCLI,
	resolveFrom: resolveFrom
});

var cli = _cli;
var help = _help;
var io = _io;
var log = _log;
var path = _path;
var testing = _testing;
var index = {
  cli: _cli,
  help: _help,
  io: _io,
  log: _log,
  path: _path,
  testing: _testing
};

export default index;
export { cli, help, io, log, path, testing };
