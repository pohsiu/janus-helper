'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _class, _temp, _initialiseProps;

var _janus = require('./janus');

var _janus2 = _interopRequireDefault(_janus);

var _config = require('./config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JanusHelper = (_temp = _class = function JanusHelper(config) {
  _classCallCheck(this, JanusHelper);

  _initialiseProps.call(this);

  this.config = config;
  this.plugins = {}; // would be added later ...
  this.initPromise = null;
}, _initialiseProps = function _initialiseProps() {
  var _this = this;

  this.setConfig = function (config) {
    if (!_this.config && !_this.initPromise) {
      _this.config = config;
    }
  };

  this.init = function () {
    if (_this.initPromise) {
      return _this.initPromise;
    }
    return _this.initPromise = new Promise(function (resolve, reject) {
      // eslint-disable-line no-return-assign
      _janus2.default.init({
        debug: _this.config.debug || false,
        callback: function callback() {
          console.log('==== init success ====');
          _this.janus = new _janus2.default({
            server: _this.config.server || 'wss://' + _config.janusHost + ':' + _config.janusWSSPort + '/',
            success: function success() {
              console.log('==== create session success ====');
              resolve(200);
            },
            error: function error(_error) {
              reject(_error);
              _this.janus = null;
              _this.initPromise = null;
            }
          });
        }
      });
    });
  };

  this.injectPlugin = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(PlugIn, config, callbacks) {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.next = 3;
              return _this.init();

            case 3:
              if (!_this.plugins[PlugIn.$name]) {
                _context.next = 5;
                break;
              }

              return _context.abrupt('return', _this.plugins[PlugIn.$name].start());

            case 5:
              _this.plugins[PlugIn.$name] = new PlugIn(_this, config, callbacks);
              return _context.abrupt('return', _this.plugins[PlugIn.$name].start());

            case 9:
              _context.prev = 9;
              _context.t0 = _context['catch'](0);
              return _context.abrupt('return', _context.t0);

            case 12:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this, [[0, 9]]);
    }));

    return function (_x, _x2, _x3) {
      return _ref.apply(this, arguments);
    };
  }();

  this.destroy = function () {
    if (_this.destroyPromise) return _this.destroyPromise;
    // eslint-disable-next-line no-return-assign
    return _this.destroyPromise = new Promise(function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(resolve, reject) {
        var PlugIns;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                PlugIns = void 0;
                _context2.prev = 1;
                _context2.next = 4;
                return Promise.all(Object.keys(_this.plugins).map(function (pluginName) {
                  return Promise.resolve(_this.plugins[pluginName].destroy());
                }));

              case 4:
                PlugIns = _context2.sent;
                _context2.next = 10;
                break;

              case 7:
                _context2.prev = 7;
                _context2.t0 = _context2['catch'](1);

                PlugIns = _context2.t0;

              case 10:
                _this.plugins = {};
                _this.initPromise = null;
                _this.janus.destroy({
                  success: function success() {
                    return resolve({
                      session: 200,
                      plugins: PlugIns
                    });
                  },
                  error: function error(er) {
                    return reject(er);
                  }
                });

              case 13:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, _this, [[1, 7]]);
      }));

      return function (_x4, _x5) {
        return _ref2.apply(this, arguments);
      };
    }());
  };
}, _temp);
exports.default = new JanusHelper();