'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _class, _temp, _initialiseProps;

var _janus = require('./janus');

var _janus2 = _interopRequireDefault(_janus);

var _config2 = require('./config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

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
      var _config = _this.config,
          debug = _config.debug,
          _config$server = _config.server,
          server = _config$server === undefined ? 'wss://' + _config2.janusHost + ':' + _config2.janusWSSPort + '/' : _config$server,
          extras = _objectWithoutProperties(_config, ['debug', 'server']);

      _janus2.default.init({
        debug: _this.config.debug || false,
        callback: function callback() {
          console.log('==== init success ====');
          _this.janus = new _janus2.default(_extends({
            server: server
          }, extras, {
            // No "iceServers" is provided, meaning janus.js will use a default STUN server
            // Here are some examples of how an iceServers field may look like to support TURN
            // 		iceServers: [{url: "turn:yourturnserver.com:3478", username: "janususer", credential: "januspwd"}],
            // 		iceServers: [{url: "turn:yourturnserver.com:443?transport=tcp", username: "janususer", credential: "januspwd"}],
            // 		iceServers: [{url: "turns:yourturnserver.com:443?transport=tcp", username: "janususer", credential: "januspwd"}],
            // Should the Janus API require authentication, you can specify either the API secret or user token here too
            //		token: "mytoken",
            //	or
            //		apisecret: "serversecret",
            success: function success() {
              console.log('==== create session success ====');
              resolve(200);
            },
            error: function error(_error) {
              reject(_error);
              _this.janus = null;
              _this.initPromise = null;
            }
          }));
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
                if (!_this.janus) {
                  resolve({
                    session: 200,
                    plugins: PlugIns
                  });
                }
                _this.janus.destroy({
                  success: function success() {
                    resolve({
                      session: 200,
                      plugins: PlugIns
                    });
                    _this.plugins = {};
                    _this.initPromise = null;
                    _this.destroyPromise = null;
                  },
                  error: function error(er) {
                    return reject(er);
                  }
                });

              case 12:
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
exports.default = JanusHelper;