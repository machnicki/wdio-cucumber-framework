'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.__RewireAPI__ = exports.__ResetDependency__ = exports.__set__ = exports.__Rewire__ = exports.__GetDependency__ = exports.__get__ = undefined;

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

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _cucumber = require('cucumber');

var _cucumber2 = _interopRequireDefault(_cucumber);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SETTLE_TIMEOUT = 5000;
var CUCUMBER_EVENTS = ['handleBeforeFeatureEvent', 'handleAfterFeatureEvent', 'handleBeforeScenarioEvent', 'handleAfterScenarioEvent', 'handleBeforeStepEvent', 'handleStepResultEvent'];

/**
 * Custom Cucumber Reporter
 */

var CucumberReporter = function () {
    function CucumberReporter(BaseListener, options, cid, specs) {
        (0, _classCallCheck3.default)(this, CucumberReporter);

        this.listener = BaseListener;
        this.capabilities = options.capabilities;
        this.tagsInTitle = options.tagsInTitle || false;
        this.options = options;
        this.cid = cid;
        this.specs = specs;
        this.failedCount = 0;

        this.sentMessages = 0; // number of messages sent to the parent
        this.receivedMessages = 0; // number of messages received by the parent

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = (0, _getIterator3.default)(_get__('CUCUMBER_EVENTS')), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var fnName = _step.value;

                this.listener[fnName] = _get__('CucumberReporter').prototype[fnName].bind(this);
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }

    (0, _createClass3.default)(CucumberReporter, [{
        key: 'handleBeforeFeatureEvent',
        value: function handleBeforeFeatureEvent(event, callback) {
            var feature = event.getUri ? event : event.getPayloadItem('feature');
            this.featureStart = new Date();
            this.runningFeature = feature;

            this.emit('suite:start', {
                uid: this.getUniqueIdentifier(feature),
                title: this.getTitle(feature),
                type: 'suite',
                file: this.getUriOf(feature)
            });

            process.nextTick(callback);
        }
    }, {
        key: 'handleBeforeScenarioEvent',
        value: function handleBeforeScenarioEvent(event, callback) {
            var scenario = event.getUri ? event : event.getPayloadItem('scenario');
            this.runningScenario = scenario;
            this.scenarioStart = new Date();
            this.testStart = new Date();

            this.emit('suite:start', {
                uid: this.getUniqueIdentifier(scenario),
                title: this.getTitle(scenario),
                parent: this.getUniqueIdentifier(this.runningFeature),
                type: 'suite',
                file: this.getUriOf(scenario)
            });

            process.nextTick(callback);
        }
    }, {
        key: 'handleBeforeStepEvent',
        value: function handleBeforeStepEvent(event, callback) {
            var step = event.getUri ? event : event.getPayloadItem('step');
            this.testStart = new Date();

            this.emit('test:start', {
                uid: this.getUniqueIdentifier(step),
                title: step.getName(),
                type: 'test',
                file: step.getUri(),
                parent: this.getUniqueIdentifier(this.runningScenario),
                duration: new Date() - this.testStart
            });

            process.nextTick(callback);
        }
    }, {
        key: 'handleStepResultEvent',
        value: function handleStepResultEvent(event, callback) {
            var stepResult = event.getStep ? event : event.getPayloadItem('stepResult');
            var step = stepResult.getStep();
            var e = 'undefined';

            switch (stepResult.getStatus()) {
                case _get__('Cucumber').Status.FAILED:
                case _get__('Cucumber').Status.UNDEFINED:
                    e = 'fail';
                    break;
                case _get__('Cucumber').Status.PASSED:
                    e = 'pass';
                    break;
                case _get__('Cucumber').Status.PENDING:
                case _get__('Cucumber').Status.SKIPPED:
                case _get__('Cucumber').Status.AMBIGUOUS:
                    e = 'pending';
            }
            var error = {};
            var stepTitle = step.getName() || step.getKeyword() || 'Undefined Step';

            /**
             * if step name is undefined we are dealing with a hook
             * don't report hooks if no error happened
             */
            if (!step.getName() && stepResult.getStatus() !== _get__('Cucumber').Status.FAILED) {
                return process.nextTick(callback);
            }

            if (stepResult.getStatus() === _get__('Cucumber').Status.UNDEFINED) {
                if (this.options.ignoreUndefinedDefinitions) {
                    /**
                     * mark test as pending
                     */
                    e = 'pending';
                    stepTitle += ' (undefined step)';
                } else {
                    /**
                     * mark test as failed
                     */
                    this.failedCount++;

                    error = {
                        message: 'Step "' + stepTitle + '" is not defined. You can ignore this error by setting\n                              cucumberOpts.ignoreUndefinedDefinitions as true.',
                        stack: step.getUri() + ':' + step.getLine()
                    };
                }
            } else if (stepResult.getStatus() === _get__('Cucumber').Status.FAILED) {
                /**
                 * cucumber failure exception can't get send to parent process
                 * for some reasons
                 */
                var err = stepResult.getFailureException();
                error = {
                    message: err.message,
                    stack: err.stack
                };
                this.failedCount++;
            } else if (stepResult.getStatus() === _get__('Cucumber').Status.AMBIGUOUS && this.options.failAmbiguousDefinitions) {
                e = 'fail';
                this.failedCount++;
                error = {
                    message: 'Step "' + stepTitle + '" is ambiguous. The following steps matched the step definition',
                    stack: stepResult.getAmbiguousStepDefinitions().map(function (step) {
                        return step.getPattern().toString() + ' in ' + step.getUri() + ':' + step.getLine();
                    }).join('\n')
                };
            }

            this.emit('test:' + e, {
                uid: this.getUniqueIdentifier(step),
                title: stepTitle.trim(),
                type: 'test',
                file: this.getUriOf(step),
                parent: this.getUniqueIdentifier(this.runningScenario),
                error: error,
                duration: new Date() - this.testStart
            });

            process.nextTick(callback);
        }
    }, {
        key: 'handleAfterScenarioEvent',
        value: function handleAfterScenarioEvent(event, callback) {
            var scenario = event.getUri ? event : event.getPayloadItem('scenario');
            this.emit('suite:end', {
                uid: this.getUniqueIdentifier(scenario),
                title: scenario.getName(),
                parent: this.getUniqueIdentifier(this.runningFeature),
                type: 'suite',
                file: this.getUriOf(scenario),
                duration: new Date() - this.scenarioStart
            });

            process.nextTick(callback);
        }
    }, {
        key: 'handleAfterFeatureEvent',
        value: function handleAfterFeatureEvent(event, callback) {
            var feature = event.getUri ? event : event.getPayloadItem('feature');
            this.emit('suite:end', {
                uid: this.getUniqueIdentifier(feature),
                title: feature.getName(),
                type: 'suite',
                file: this.getUriOf(feature),
                duration: new Date() - this.featureStart
            });

            process.nextTick(callback);
        }
    }, {
        key: 'emit',
        value: function emit(event, payload) {
            var _this = this;

            var message = {
                event: event,
                cid: this.cid,
                uid: payload.uid,
                title: payload.title,
                pending: payload.pending || false,
                parent: payload.parent || null,
                type: payload.type,
                file: payload.file,
                err: payload.error || {},
                duration: payload.duration,
                runner: {},
                specs: this.specs
            };

            message.runner[this.cid] = this.capabilities;

            this.send(message, null, {}, function () {
                return ++_this.receivedMessages;
            });
            this.sentMessages++;
        }
    }, {
        key: 'send',
        value: function send() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            return process.send.apply(process, args);
        }

        /**
         * wait until all messages were sent to parent
         */

    }, {
        key: 'waitUntilSettled',
        value: function waitUntilSettled() {
            var _this2 = this;

            return new _promise2.default(function (resolve) {
                var start = new Date().getTime();
                var interval = setInterval(function () {
                    var now = new Date().getTime();

                    if (_this2.sentMessages !== _this2.receivedMessages && now - start < _get__('SETTLE_TIMEOUT')) return;
                    clearInterval(interval);
                    resolve();
                }, 100);
            });
        }
    }, {
        key: 'getTitle',
        value: function getTitle(featureOrScenario) {
            var name = featureOrScenario.getName();
            var tags = featureOrScenario.getTags();
            if (!this.tagsInTitle || !tags.length) return name;
            return tags.map(function (tag) {
                return tag.getName();
            }).join(', ') + ': ' + name;
        }
    }, {
        key: 'getListener',
        value: function getListener() {
            return this.listener;
        }
    }, {
        key: 'getUriOf',
        value: function getUriOf(type) {
            if (!type || !type.getUri()) {
                return;
            }

            return type.getUri().replace(process.cwd(), '');
        }
    }, {
        key: 'getUniqueIdentifier',
        value: function getUniqueIdentifier(target) {
            return target.getName() + (target.getLine() || '');
        }
    }]);
    return CucumberReporter;
}();

exports.default = _get__('CucumberReporter');

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
        case 'CUCUMBER_EVENTS':
            return CUCUMBER_EVENTS;

        case 'CucumberReporter':
            return CucumberReporter;

        case 'Cucumber':
            return _cucumber2.default;

        case 'SETTLE_TIMEOUT':
            return SETTLE_TIMEOUT;
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

var _typeOfOriginalExport = typeof CucumberReporter === 'undefined' ? 'undefined' : (0, _typeof3.default)(CucumberReporter);

function addNonEnumerableProperty(name, value) {
    (0, _defineProperty2.default)(CucumberReporter, name, {
        value: value,
        enumerable: false,
        configurable: true
    });
}

if ((_typeOfOriginalExport === 'object' || _typeOfOriginalExport === 'function') && (0, _isExtensible2.default)(CucumberReporter)) {
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