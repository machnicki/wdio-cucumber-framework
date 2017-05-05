'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.__RewireAPI__ = exports.__ResetDependency__ = exports.__set__ = exports.__Rewire__ = exports.__GetDependency__ = exports.__get__ = exports.adapterFactory = exports.CucumberAdapter = undefined;

var _isExtensible = require('babel-runtime/core-js/object/is-extensible');

var _isExtensible2 = _interopRequireDefault(_isExtensible);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _defineProperty = require('babel-runtime/core-js/object/define-property');

var _defineProperty2 = _interopRequireDefault(_defineProperty);

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _cucumber = require('cucumber');

var _cucumber2 = _interopRequireDefault(_cucumber);

var _wdioSync = require('wdio-sync');

var _reporter = require('./reporter');

var _reporter2 = _interopRequireDefault(_reporter);

var _hookRunner = require('./hookRunner');

var _hookRunner2 = _interopRequireDefault(_hookRunner);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULT_TIMEOUT = 30000;
var DEFAULT_OPTS = {
    backtrace: false, // <boolean> show full backtrace for errors
    compiler: [], // <string[]> ("extension:module") require files with the given EXTENSION after requiring MODULE (repeatable)
    failFast: false, // <boolean> abort the run on first failure
    name: [], // <REGEXP[]> only execute the scenarios with name matching the expression (repeatable)
    snippets: true, // <boolean> hide step definition snippets for pending steps
    source: true, // <boolean> hide source uris
    profile: [], // <string> (name) specify the profile to use
    require: [], // <string> (file/dir) require files before executing features
    snippetSyntax: undefined, // <string> specify a custom snippet syntax
    strict: false, // <boolean> fail if there are any undefined or pending steps
    tags: [], // <string[]> (expression) only execute the features or scenarios with tags matching the expression
    timeout: _get__('DEFAULT_TIMEOUT'), // <number> timeout for step definitions in milliseconds
    tagsInTitle: false // <boolean> add cucumber tags to feature or scenario name
};

/**
 * Cucumber runner
 */

var CucumberAdapter = function () {
    function CucumberAdapter(cid, config, specs, capabilities) {
        (0, _classCallCheck3.default)(this, CucumberAdapter);

        this.cid = cid;
        this.config = config;
        this.specs = specs;
        this.capabilities = capabilities;

        this.cucumberOpts = (0, _assign2.default)(_get__('DEFAULT_OPTS'), config.cucumberOpts);

        this.origStepDefinition = _get__('Cucumber').SupportCode.StepDefinition;
        this.origLibrary = _get__('Cucumber').SupportCode.Library;
    }

    (0, _createClass3.default)(CucumberAdapter, [{
        key: 'run',
        value: function () {
            var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
                var _this = this;

                var reporterOptions, cucumberConf, runtime, reporter, hookRunner, result;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                reporterOptions = {
                                    capabilities: this.capabilities,
                                    ignoreUndefinedDefinitions: Boolean(this.cucumberOpts.ignoreUndefinedDefinitions),
                                    failAmbiguousDefinitions: Boolean(this.cucumberOpts.failAmbiguousDefinitions),
                                    tagsInTitle: Boolean(this.cucumberOpts.tagsInTitle)
                                };


                                _get__('wrapCommands')(global.browser, this.config.beforeCommand, this.config.afterCommand);

                                cucumberConf = _get__('Cucumber').Cli.Configuration(this.cucumberOpts, this.specs);
                                runtime = _get__('Cucumber').Runtime(cucumberConf);


                                _get__('Cucumber').SupportCode.StepDefinition = this.getStepDefinition();
                                _get__('Cucumber').SupportCode.Library = this.getLibrary();

                                reporter = new (_get__('CucumberReporter'))(_get__('Cucumber').Listener(), reporterOptions, this.cid, this.specs);

                                runtime.attachListener(reporter.getListener());

                                hookRunner = new (_get__('HookRunner'))(_get__('Cucumber').Listener(), this.config);

                                runtime.attachListener(hookRunner.getListener());

                                _context.next = 12;
                                return _get__('executeHooksWithArgs')(this.config.before, [this.capabilities, this.specs]);

                            case 12:
                                _context.next = 14;
                                return new _promise2.default(function (resolve) {
                                    runtime.start(function () {
                                        resolve(reporter.failedCount);
                                        _get__('Cucumber').SupportCode.StepDefinition = _this.origStepDefinition;
                                        _get__('Cucumber').SupportCode.Library = _this.origLibrary;
                                    });
                                });

                            case 14:
                                result = _context.sent;
                                _context.next = 17;
                                return _get__('executeHooksWithArgs')(this.config.after, [result, this.capabilities, this.specs]);

                            case 17:
                                _context.next = 19;
                                return reporter.waitUntilSettled();

                            case 19:
                                return _context.abrupt('return', result);

                            case 20:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function run() {
                return _ref.apply(this, arguments);
            }

            return run;
        }()

        /**
         * overwrites Cucumbers StepDefinition class to wrap step definiton code block in order
         * to enable retry and synchronous code execution using wdio-syncs fiber helpers
         */

    }, {
        key: 'getStepDefinition',
        value: function getStepDefinition() {
            var _this2 = this;

            var origStepDefinition = this.origStepDefinition;

            return function (pattern, options, code, uri, line) {
                var retryTest = isFinite(options.retry) ? parseInt(options.retry, 10) : 0;
                var wrappedCode = code.name === 'async' || _this2.config.sync === false ? _this2.wrapStepAsync(code, retryTest) : _this2.wrapStepSync(code, retryTest);

                var stepDefinition = origStepDefinition(pattern, options, wrappedCode, uri, line);
                stepDefinition.validCodeLengths = function () {
                    return [0];
                };
                return stepDefinition;
            };
        }

        /**
         * overwrites Cucumbers Library class to set default timeout for cucumber steps and hooks
         */

    }, {
        key: 'getLibrary',
        value: function getLibrary() {
            var _this3 = this;

            var origLibrary = this.origLibrary;

            return function (supportCodeDefinition) {
                var library = origLibrary(supportCodeDefinition);
                library.setDefaultTimeout(_this3.cucumberOpts.timeout);
                return library;
            };
        }

        /**
         * wrap step definition to enable retry ability
         * @param  {Function} code       step definitoon
         * @param  {Number}   retryTest  amount of allowed repeats is case of a failure
         * @return {Function}            wrapped step definiton for sync WebdriverIO code
         */

    }, {
        key: 'wrapStepSync',
        value: function wrapStepSync(code) {
            var retryTest = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

            return function () {
                var _this4 = this;

                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                return new _promise2.default(function (resolve, reject) {
                    return global.wdioSync(_get__('executeSync').bind(_this4, code, retryTest, args), function (resultPromise) {
                        return resultPromise.then(resolve, reject);
                    }).apply(_this4);
                });
            };
        }

        /**
         * wrap step definition to enable retry ability
         * @param  {Function} code       step definitoon
         * @param  {Number}   retryTest  amount of allowed repeats is case of a failure
         * @return {Function}            wrapped step definiton for async WebdriverIO code
         */

    }, {
        key: 'wrapStepAsync',
        value: function wrapStepAsync(code) {
            var retryTest = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

            return function () {
                for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                    args[_key2] = arguments[_key2];
                }

                return _get__('executeAsync').call(this, code, retryTest, args);
            };
        }
    }]);
    return CucumberAdapter;
}();

var _CucumberAdapter = _get__('CucumberAdapter');
var adapterFactory = {};

_get__('adapterFactory').run = function () {
    var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(cid, config, specs, capabilities) {
        var adapter, result;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        adapter = new (_get__('_CucumberAdapter'))(cid, config, specs, capabilities);
                        _context2.next = 3;
                        return adapter.run();

                    case 3:
                        result = _context2.sent;
                        return _context2.abrupt('return', result);

                    case 5:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));

    return function (_x3, _x4, _x5, _x6) {
        return _ref2.apply(this, arguments);
    };
}();

exports.default = _get__('adapterFactory');
exports.CucumberAdapter = CucumberAdapter;
exports.adapterFactory = adapterFactory;

function _getGlobalObject() {
    try {
        if (!!global) {
            return global;
        }
    } catch (e) {
        try {
            if (!!window) {
                return window;
            }
        } catch (e) {
            return this;
        }
    }
}

;
var _RewireModuleId__ = null;

function _getRewireModuleId__() {
    if (_RewireModuleId__ === null) {
        var globalVariable = _getGlobalObject();

        if (!globalVariable.__$$GLOBAL_REWIRE_NEXT_MODULE_ID__) {
            globalVariable.__$$GLOBAL_REWIRE_NEXT_MODULE_ID__ = 0;
        }

        _RewireModuleId__ = __$$GLOBAL_REWIRE_NEXT_MODULE_ID__++;
    }

    return _RewireModuleId__;
}

function _getRewireRegistry__() {
    var theGlobalVariable = _getGlobalObject();

    if (!theGlobalVariable.__$$GLOBAL_REWIRE_REGISTRY__) {
        theGlobalVariable.__$$GLOBAL_REWIRE_REGISTRY__ = (0, _create2.default)(null);
    }

    return __$$GLOBAL_REWIRE_REGISTRY__;
}

function _getRewiredData__() {
    var moduleId = _getRewireModuleId__();

    var registry = _getRewireRegistry__();

    var rewireData = registry[moduleId];

    if (!rewireData) {
        registry[moduleId] = (0, _create2.default)(null);
        rewireData = registry[moduleId];
    }

    return rewireData;
}

(function registerResetAll() {
    var theGlobalVariable = _getGlobalObject();

    if (!theGlobalVariable['__rewire_reset_all__']) {
        theGlobalVariable['__rewire_reset_all__'] = function () {
            theGlobalVariable.__$$GLOBAL_REWIRE_REGISTRY__ = (0, _create2.default)(null);
        };
    }
})();

var INTENTIONAL_UNDEFINED = '__INTENTIONAL_UNDEFINED__';
var _RewireAPI__ = {};

(function () {
    function addPropertyToAPIObject(name, value) {
        (0, _defineProperty2.default)(_RewireAPI__, name, {
            value: value,
            enumerable: false,
            configurable: true
        });
    }

    addPropertyToAPIObject('__get__', _get__);
    addPropertyToAPIObject('__GetDependency__', _get__);
    addPropertyToAPIObject('__Rewire__', _set__);
    addPropertyToAPIObject('__set__', _set__);
    addPropertyToAPIObject('__reset__', _reset__);
    addPropertyToAPIObject('__ResetDependency__', _reset__);
    addPropertyToAPIObject('__with__', _with__);
})();

function _get__(variableName) {
    var rewireData = _getRewiredData__();

    if (rewireData[variableName] === undefined) {
        return _get_original__(variableName);
    } else {
        var value = rewireData[variableName];

        if (value === INTENTIONAL_UNDEFINED) {
            return undefined;
        } else {
            return value;
        }
    }
}

function _get_original__(variableName) {
    switch (variableName) {
        case 'DEFAULT_TIMEOUT':
            return DEFAULT_TIMEOUT;

        case 'DEFAULT_OPTS':
            return DEFAULT_OPTS;

        case 'Cucumber':
            return _cucumber2.default;

        case 'wrapCommands':
            return _wdioSync.wrapCommands;

        case 'CucumberReporter':
            return _reporter2.default;

        case 'HookRunner':
            return _hookRunner2.default;

        case 'executeHooksWithArgs':
            return _wdioSync.executeHooksWithArgs;

        case 'executeSync':
            return _wdioSync.executeSync;

        case 'executeAsync':
            return _wdioSync.executeAsync;

        case 'CucumberAdapter':
            return CucumberAdapter;

        case 'adapterFactory':
            return adapterFactory;

        case '_CucumberAdapter':
            return _CucumberAdapter;
    }

    return undefined;
}

function _assign__(variableName, value) {
    var rewireData = _getRewiredData__();

    if (rewireData[variableName] === undefined) {
        return _set_original__(variableName, value);
    } else {
        return rewireData[variableName] = value;
    }
}

function _set_original__(variableName, _value) {
    switch (variableName) {}

    return undefined;
}

function _update_operation__(operation, variableName, prefix) {
    var oldValue = _get__(variableName);

    var newValue = operation === '++' ? oldValue + 1 : oldValue - 1;

    _assign__(variableName, newValue);

    return prefix ? newValue : oldValue;
}

function _set__(variableName, value) {
    var rewireData = _getRewiredData__();

    if ((typeof variableName === 'undefined' ? 'undefined' : (0, _typeof3.default)(variableName)) === 'object') {
        (0, _keys2.default)(variableName).forEach(function (name) {
            rewireData[name] = variableName[name];
        });
    } else {
        if (value === undefined) {
            rewireData[variableName] = INTENTIONAL_UNDEFINED;
        } else {
            rewireData[variableName] = value;
        }

        return function () {
            _reset__(variableName);
        };
    }
}

function _reset__(variableName) {
    var rewireData = _getRewiredData__();

    delete rewireData[variableName];

    if ((0, _keys2.default)(rewireData).length == 0) {
        delete _getRewireRegistry__()[_getRewireModuleId__];
    }

    ;
}

function _with__(object) {
    var rewireData = _getRewiredData__();

    var rewiredVariableNames = (0, _keys2.default)(object);
    var previousValues = {};

    function reset() {
        rewiredVariableNames.forEach(function (variableName) {
            rewireData[variableName] = previousValues[variableName];
        });
    }

    return function (callback) {
        rewiredVariableNames.forEach(function (variableName) {
            previousValues[variableName] = rewireData[variableName];
            rewireData[variableName] = object[variableName];
        });
        var result = callback();

        if (!!result && typeof result.then == 'function') {
            result.then(reset).catch(reset);
        } else {
            reset();
        }

        return result;
    };
}

var _typeOfOriginalExport = typeof adapterFactory === 'undefined' ? 'undefined' : (0, _typeof3.default)(adapterFactory);

function addNonEnumerableProperty(name, value) {
    (0, _defineProperty2.default)(adapterFactory, name, {
        value: value,
        enumerable: false,
        configurable: true
    });
}

if ((_typeOfOriginalExport === 'object' || _typeOfOriginalExport === 'function') && (0, _isExtensible2.default)(adapterFactory)) {
    addNonEnumerableProperty('__get__', _get__);
    addNonEnumerableProperty('__GetDependency__', _get__);
    addNonEnumerableProperty('__Rewire__', _set__);
    addNonEnumerableProperty('__set__', _set__);
    addNonEnumerableProperty('__reset__', _reset__);
    addNonEnumerableProperty('__ResetDependency__', _reset__);
    addNonEnumerableProperty('__with__', _with__);
    addNonEnumerableProperty('__RewireAPI__', _RewireAPI__);
}

exports.__get__ = _get__;
exports.__GetDependency__ = _get__;
exports.__Rewire__ = _set__;
exports.__set__ = _set__;
exports.__ResetDependency__ = _reset__;
exports.__RewireAPI__ = _RewireAPI__;