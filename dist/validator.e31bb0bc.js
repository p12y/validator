// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"validator.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * All available validator functions
 */
var validatorFunctions = {
  /**
   * Return true if it has length
   * If trim option is present, ignore whitespace
   */
  notEmpty: function notEmpty(value, options) {
    if (options.trim) {
      value = value.trim();
    }

    return Boolean(value);
  },

  /**
   * Return true if matches regexp
   */
  regexp: function regexp(value, options) {
    return options.regexp.test(value);
  },

  /**
   * Return true if matches stringLength
   * If min option is present, check min length
   * If max option is present, check max length
   * If trim option is present, ignore whitespace
   */
  stringLength: function stringLength(value, options) {
    var min = options.min,
        max = options.max,
        trim = options.trim;
    var isValid = false;

    if (trim) {
      value = value.trim();
    }

    if (options.min) {
      isValid = value.length >= min;
    }

    if (options.max) {
      isValid = isValid && value.length <= max;
    }

    return isValid;
  },

  /**
   * Return true if numeric
   */
  numeric: function numeric(value) {
    return /\d+/.test(value);
  },

  /**
   * Run a custom validator
   */
  custom: function custom(value, options) {
    return options.validatorFunction(value);
  }
};

var throwOnCondition = function throwOnCondition(condition, message) {
  if (condition) {
    throw new Error("Validator: ".concat(message));
  }
};

var Validator =
/*#__PURE__*/
function () {
  function Validator(rootElement, config) {
    _classCallCheck(this, Validator);

    this.rootElement = rootElement;
    this.config = config;
    this.validateOnBlur = true;
    this.validateOnInput = false;
    this.validateOnSubmit = true;
    this.submitButton = config.submitButton;
    this.fields = [];
    this.isValid = true;

    if (this.config.hasOwnProperty("validateOnBlur")) {
      this.validateOnBlur = Boolean(config.validateOnBlur);
    }

    if (this.config.hasOwnProperty("validateOnInput")) {
      this.validateOnInput = Boolean(config.validateOnInput);
    }

    if (this.config.hasOwnProperty("validateOnSubmit")) {
      this.validateOnSubmit = Boolean(config.validateOnSubmit);
    }

    throwOnCondition(!rootElement || !(rootElement instanceof Element), "Root element is not an Element.");
    throwOnCondition(this.config.submitButton && !(this.config.submitButton instanceof Element), "Submit button is not an Element.");
    this.addValidatorsToElements();
  }
  /**
   * Add validator configs directly to field DOM elements
   */


  _createClass(Validator, [{
    key: "addValidatorsToElements",
    value: function addValidatorsToElements() {
      var _this = this;

      var fieldNames = Object.keys(this.config.fields || {});
      throwOnCondition(!fieldNames.length, "No fields provided in config.");
      fieldNames.forEach(function (fieldName) {
        var field = _this.rootElement.querySelector("input[name=\"".concat(fieldName, "\"]"));

        if (!field) {
          return;
        }

        var validators = _this.config.fields[fieldName].validators;
        field.validators = validators; // Add the fields to an array, so we can access them later

        _this.fields.push(field);
      });
      this.attachListeners();
    }
  }, {
    key: "getFields",
    value: function getFields() {
      return this.fields;
    }
    /**
     * Validate a single element
     * @param {Element} field
     */

  }, {
    key: "validateField",
    value: function validateField(field) {
      // Get the validators attached to the element
      var fieldValidators = field.validators;
      var validatorKeys = Object.keys(fieldValidators);
      var errorMessages = [];
      var isFieldValid = true;
      validatorKeys.forEach(function (key) {
        // Exit this iteration if the key is not a valid validator functinon
        if (key === "callback" || typeof validatorFunctions[key] !== "function") {
          return;
        } // Determine if the field passes the single validator


        var isValidatorPassing = validatorFunctions[key](field.value, field.validators[key]);
        /**
         * If the field fails a single validation,
         * Set the field to invalid and add error message to array
         */

        if (!isValidatorPassing) {
          isFieldValid = false;
          var message = field.validators[key].message;

          if (message) {
            errorMessages.push(message);
          }
        }
      }); // Run the field validator callback, if it exists

      if (field.validators.callback && typeof field.validators.callback === "function") {
        field.validators.callback(field, errorMessages, isFieldValid);
      }

      return isFieldValid;
    }
  }, {
    key: "attachListeners",
    value: function attachListeners() {
      var _this2 = this;

      var fields = this.getFields();
      fields.forEach(function (field) {
        if (_this2.config.validateOnInput) {
          field.addEventListener("input", function () {
            return _this2.validateField(field);
          });
        }

        if (_this2.config.validateOnBlur) {
          field.addEventListener("blur", function () {
            return _this2.validateField(field);
          });
        }
      });
      /**
       * Validate all fields on submit button press, if configured
       */

      if (this.config.submitButton && this.validateOnSubmit) {
        this.config.submitButton.addEventListener("click", function (event) {
          _this2.validateAll();
          /**
           * Run the on submit callback, passing the click event
           * and form validity as parameters.
           *
           * This way, we can do things like prevent form submits
           * when the form is invalid.
           */


          _this2.config.onSubmit(event, _this2.isValid);
        });
      }
    }
    /**
     * Loop through each field and run the validator functions.
     * Set the total validity of the form based on the result.
     */

  }, {
    key: "validateAll",
    value: function validateAll() {
      var _this3 = this;

      var fields = this.getFields();
      this.isValid = true;
      fields.forEach(function (field) {
        var isFieldValid = _this3.validateField(field);

        _this3.isValid = _this3.isValid && isFieldValid;
      });
      return this.isValid;
    }
  }]);

  return Validator;
}();

exports.default = Validator;
},{}],"index.js":[function(require,module,exports) {
"use strict";

var _validator = _interopRequireDefault(require("./validator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fieldValidationCallback = function fieldValidationCallback(field, errors, isValid) {
  var containerEl = field.closest(".form-field");
  var messageContainer = containerEl.querySelector(".message");
  containerEl.classList.remove("has-error");
  messageContainer.innerHTML = "";

  if (!isValid) {
    containerEl.classList.add("has-error");
  }

  errors.forEach(function (message) {
    var errorText = document.createElement("span");
    errorText.className = "error-text";
    errorText.innerText = message;
    messageContainer.appendChild(errorText);
  });
};

var validator = new _validator.default(document.querySelector(".form"), {
  fields: {
    bsb: {
      validators: {
        notEmpty: {
          message: "You must enter a BSB",
          trim: true
        },
        numeric: {
          message: "BSB must be numeric"
        },
        stringLength: {
          min: 6,
          max: 9,
          trim: true,
          message: "BSB should be between 6 and 9 characters"
        },
        callback: fieldValidationCallback
      }
    },
    password: {
      validators: {
        notEmpty: {
          message: "You must enter a password",
          trim: false
        },
        regexp: {
          regexp: /^password$/,
          message: 'Password should be "password"'
        },
        custom: {
          message: "Must be more than 2 characters",
          validatorFunction: function validatorFunction(value) {
            return value.length > 2;
          }
        },
        callback: fieldValidationCallback
      }
    }
  },
  submitButton: document.querySelector("button"),
  validateOnBlur: true,
  validateOnInput: true,
  validateOnSubmit: true,
  onSubmit: function onSubmit(event, isValid) {
    // Block form submit if invalid
    if (!isValid) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
});
document.querySelector("button").addEventListener("click", function () {
  console.log("clicked");
});
},{"./validator":"validator.js"}],"../../../.config/yarn/global/node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "51866" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../../../.config/yarn/global/node_modules/parcel-bundler/src/builtins/hmr-runtime.js","index.js"], null)
//# sourceMappingURL=/validator.e31bb0bc.js.map