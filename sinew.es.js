import F, { node } from 'fluture';
import { curryN, __, pipe as pipe$1, curry as curry$1, chain, identity, propOr, find, equals, map, join, pathOr, path as path$1, toPairs, reduce, prop as prop$1 } from 'ramda';
import getStdin from 'get-stdin';
import path from 'path';
import fs from 'fs';
import cliui from 'cliui';
import color from 'kleur';
import stripAnsi from 'strip-ansi';
import debug from 'debug';
import execa from 'execa';

var relativePathWithCWD = curryN(2, path.relative);

var _path = /*#__PURE__*/Object.freeze({
  relativePathWithCWD: relativePathWithCWD
});

var readRaw = curryN(3, fs.readFile);
var readUTF8 = readRaw(__, "utf8");
var readFile = pipe$1(readUTF8, node);
var writeRaw = curryN(4, fs.writeFile);
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
  return pipe$1(path$1(["yargsOpts", "alias"]), toPairs, map(function (_ref) {
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
var testShell = curry$1(function (cmd, testName, assertion) {
  test(testName, function (done) {
    execa.shell(cmd)["catch"](done).then(testHookStdout(done, assertion));
  });
});
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
    return path.resolve.apply(path, [dir].concat(x));
  };
};
var testCommand = curry$1(function (args, assertion) {
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

var index = {
  cli: _cli,
  help: _help,
  io: _io,
  log: _log,
  path: _path,
  testing: _testing
};

export default index;
