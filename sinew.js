'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var F = require('fluture');
var F__default = _interopDefault(F);
var ramda = require('ramda');
var getStdin = _interopDefault(require('get-stdin'));
var path$1 = _interopDefault(require('path'));
var fs = _interopDefault(require('fs'));
var cliui = _interopDefault(require('cliui'));
var color = _interopDefault(require('kleur'));
var stripAnsi = _interopDefault(require('strip-ansi'));
var debug = _interopDefault(require('debug'));
var execa = _interopDefault(require('execa'));

var relativePathWithCWD = ramda.curryN(2, path$1.relative);

var _path = /*#__PURE__*/Object.freeze({
  relativePathWithCWD: relativePathWithCWD
});

var readRaw = ramda.curryN(3, fs.readFile);
var readUTF8 = readRaw(ramda.__, "utf8");
var readFile = ramda.pipe(readUTF8, F.node);
var writeRaw = ramda.curryN(4, fs.writeFile);
var writeUTF8 = writeRaw(ramda.__, ramda.__, "utf8");
var writeFile = ramda.curry(function (to, data) {
  return ramda.pipe(writeUTF8(to), F.node)(data);
});

var _io = /*#__PURE__*/Object.freeze({
  readRaw: readRaw,
  readUTF8: readUTF8,
  readFile: readFile,
  writeRaw: writeRaw,
  writeUTF8: writeUTF8,
  writeFile: writeFile
});

var readRelative = ramda.pipe(relativePathWithCWD(process.cwd()), readFile);
var readStdin = F__default.encaseP(getStdin);
var readWithOpts = ramda.curry(function (opts, source) {
  return (
    opts.stdin ?
    readStdin()
    : F__default.of(source)
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
var processAsync = ramda.curry(function (fn, opts, source) {
  return ramda.pipe(
  opts.file ? readRelative : readWithOpts(opts),
  ensureBinary(fn)(opts),
  opts.output ? ramda.chain(writeFile(opts.output)) : ramda.identity)(source);
});

var _cli = /*#__PURE__*/Object.freeze({
  readRelative: readRelative,
  readStdin: readStdin,
  readWithOpts: readWithOpts,
  processAsync: processAsync
});

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

var _map = [color.red, color.yellow, color.bold, color.underline].map(function (z) {
  return function (withColor) {
    return function () {
      return (withColor ? z : ramda.identity).apply(void 0, arguments);
    };
  };
}),
    _map2 = _slicedToArray(_map, 4),
    red = _map2[0],
    yellow = _map2[1],
    bold = _map2[2],
    underline = _map2[3];
var matchesTypeFromConfig = ramda.curry(function (config, type, x) {
  return ramda.pipe(ramda.propOr([], type), ramda.find(ramda.equals(x)))(config);
});
var flag = function flag(z) {
  return (stripAnsi(z).length === 1 ? "-" : "--") + z;
};
var flagify = ramda.curry(function (useColors, flags) {
  return ramda.pipe(ramda.map(ramda.pipe(yellow(useColors), flag)), ramda.join(", "))(flags);
});
var wrapChars = ramda.curry(function (a, b) {
  return a[0] + b + a[1];
});
var TYPES = ["string", "boolean", "array", "number"];
var getRawDescriptionsOrThrow = ramda.curry(function (w, x) {
  return ramda.pipe(ramda.pathOr("TBD", ["raw", "descriptions", x.name]), function (d) {
    if (d === "TBD") {
      throw new Error("".concat(x.name, " needs a description!"));
    }
    return d;
  })(w);
});
var getDefaults = ramda.curry(function (w, x) {
  return ramda.pathOr(" ", ["raw", "yargsOpts", "default", x.name], w);
});
var getType = ramda.curry(function (w, x) {
  var matcher = matchesTypeFromConfig(w.raw.yargsOpts);
  var findFlag = function findFlag(t) {
    return ramda.find(matcher(t), x.flags) ? t : false;
  };
  var type = TYPES.map(findFlag).find(ramda.identity);
  return type;
});
var convertFlag = ramda.curry(function (w, x) {
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
  return ramda.pipe(ramda.path(["yargsOpts", "alias"]), ramda.toPairs, ramda.map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        k = _ref2[0],
        v = _ref2[1];
    return {
      flags: [k].concat(_toConsumableArray(v)),
      name: k
    };
  }), ramda.reduce(function (_ref3, y) {
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
    return ramda.map(convertFlag(w), w.data);
  })(conf);
};
var getDefaultDiv = function getDefaultDiv(def) {
  return def !== " " ? {
    text: "(default: ".concat(def, ")"),
    align: "right",
    padding: [0, 2, 0, 0]
  } : def;
};
var helpWithOptions = ramda.curry(function (conf, argv) {
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
      text: ramda.pipe(red(useColors), wrapChars("[]"))(type),
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
var makeInspector = ramda.pipe(function (k) {
  return "inspector:".concat(k);
}, make(callBinaryWithScope));

var _log = /*#__PURE__*/Object.freeze({
  makeTracer: makeTracer,
  makeInspector: makeInspector
});

var is = ramda.curry(function (expected, actual) {
  return expect(actual).toEqual(expected);
});
var matches = function matches(x) {
  return expect(x).toMatchSnapshot();
};
var testHook = ramda.curry(function (property, done, assertion, x) {
  return ramda.pipe(ramda.prop(property), assertion, function () {
    return done();
  })(x);
});
var testHookStdout = testHook("stdout");
var testHookStderr = testHook("stderr");
var testShell = ramda.curry(function (cmd, testName, assertion) {
  test(testName, function (done) {
    execa.shell(cmd)["catch"](done).then(testHookStdout(done, assertion));
  });
});
var testCLI = ramda.curry(function (_ref, testName, assertion) {
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
var testCommand = ramda.curry(function (args, assertion) {
  return testCLI(args, args.join(" "), assertion);
});

var _testing = /*#__PURE__*/Object.freeze({
  is: is,
  matches: matches,
  testHook: testHook,
  testHookStdout: testHookStdout,
  testHookStderr: testHookStderr,
  testShell: testShell,
  testCLI: testCLI,
  resolveFrom: resolveFrom,
  testCommand: testCommand
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

exports.cli = cli;
exports.default = index;
exports.help = help;
exports.io = io;
exports.log = log;
exports.path = path;
exports.testing = testing;
