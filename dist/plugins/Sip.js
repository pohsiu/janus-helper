'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _class, _temp, _initialiseProps;

var _janus = require('../janus');

var _janus2 = _interopRequireDefault(_janus);

var _PluginBase2 = require('./PluginBase');

var _PluginBase3 = _interopRequireDefault(_PluginBase2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var opaqueId = 'sip-' + _janus2.default.randomString(12);

var Sip = (_temp = _class = function (_PluginBase) {
  _inherits(Sip, _PluginBase);

  function Sip(mgr, config, callbacks) {
    _classCallCheck(this, Sip);

    var _this = _possibleConstructorReturn(this, (Sip.__proto__ || Object.getPrototypeOf(Sip)).call(this));

    _initialiseProps.call(_this);

    _this.mgr = mgr;
    _this.config = config;

    var userInfo = config.userInfo,
        extras = _objectWithoutProperties(config, ['userInfo']);

    _this.userInfo = userInfo;
    _this.extras = extras;
    _this.callbacks = callbacks;
    _this.sipcall = null;
    _this.registered = false;
    return _this;
  }

  // sip part ...


  return Sip;
}(_PluginBase3.default), _class.$name = 'sip', _initialiseProps = function _initialiseProps() {
  var _this2 = this;

  this.onStart = function () {
    return _this2.attachSipPlugin();
  };

  this.registerUsername = function (username, password, sipserver, authuser, displayname) {
    // if (password === '') {
    //   alert('Insert the username secret (e.g., mypassword)');
    //   return;
    // }
    _janus2.default.log('[SIP] registering');
    var register = {
      request: 'register',
      username: username
    };
    // By default, the SIPre plugin tries to extract the username part from the SIP
    // identity to register; if the username is different, you can provide it here
    if (authuser !== '') {
      register.authuser = authuser;
    }
    // The display name is only needed when you want a friendly name to appear when you call someone
    if (displayname !== '') {
      register.display_name = displayname;
    }
    // Use the plain secret
    register.secret = password;
    register.proxy = sipserver;
    _this2.sipcall.send({ message: register });
  };

  this.doCall = function (toCall) {
    var doAudio = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var doVideo = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    // this.doHangup(); // clean up confirmation
    // Call someone
    var phoneCall = '' + toCall;
    var uri = 'sip:' + phoneCall + '@' + _this2.config.sipServer;
    // Call this URI
    _janus2.default.log('[SIP] This is a SIP ' + (doVideo ? 'video' : 'audio') + ' call (dovideo=' + doVideo + ')');
    _this2.sipcall.createOffer({
      media: {
        audioSend: doAudio,
        audioRecv: doAudio, // We DO want audio
        videoSend: doVideo,
        videoRecv: doVideo // We MAY want video
      },
      success: function success(jsep) {
        _janus2.default.debug('[SIP] Got Offer SDP!', jsep);
        // Janus.debug(jsep);
        /*
          By default, you only pass the SIP URI to call as an
          argument to a "call" request. Should you want the
          SIP stack to add some custom headers to the INVITE,
          you can do so by adding an additional "headers" object,
          containing each of the headers as key-value, e.g.:
          var body = { request: "call", uri: $('#peer').val(),
            headers: {
              "My-Header": "value",
              "AnotherHeader": "another string"
            }
          };
        */
        var body = { request: 'call', uri: uri };
        // Note: you can also ask the plugin to negotiate SDES-SRTP, instead of the
        // default plain RTP, by adding a "srtp" attribute to the request. Valid
        // values are "sdes_optional" and "sdes_mandatory", e.g.:
        // var body = { request: "call", uri: $('#peer').val(), srtp: "sdes_optional" };
        // "sdes_optional" will negotiate RTP/AVP and add a crypto line,
        // "sdes_mandatory" will set the protocol to RTP/SAVP instead.
        // Just beware that some endpoints will NOT accept an INVITE
        // with a crypto line in it if the protocol is not RTP/SAVP,
        // so if you want SDES use "sdes_optional" with care.
        _this2.sipcall.send({ message: body, jsep: jsep });
      },
      error: function error(_error) {
        _janus2.default.error('[SIP]WebRTC error...', _error);
      }
    });
  };

  this.regist = function () {
    var userName = 'sip:' + _this2.userInfo.id + '@' + _this2.config.sipServer;
    var secret = _this2.userInfo.secret;

    var sipServer = 'sip:' + _this2.config.sipServer + ':' + _this2.config.sipPort;
    _this2.registerUsername(userName, secret, sipServer, _this2.userInfo.id, _this2.userInfo.id);
  };

  this.attachSipPlugin = function () {
    if (_this2.pluginPromise) return _this2.pluginPromise;

    _this2.janus = _this2.mgr.janus;

    var _callbacks = _this2.callbacks,
        _callbacks$consentDia = _callbacks.consentDialog,
        _consentDialog = _callbacks$consentDia === undefined ? function () {} : _callbacks$consentDia,
        _callbacks$mediaState = _callbacks.mediaState,
        _mediaState = _callbacks$mediaState === undefined ? function () {} : _callbacks$mediaState,
        _callbacks$webrtcStat = _callbacks.webrtcState,
        _webrtcState = _callbacks$webrtcStat === undefined ? function () {} : _callbacks$webrtcStat,
        _callbacks$onmessage = _callbacks.onmessage,
        _onmessage = _callbacks$onmessage === undefined ? function () {} : _callbacks$onmessage,
        _callbacks$onlocalstr = _callbacks.onlocalstream,
        _onlocalstream = _callbacks$onlocalstr === undefined ? function () {} : _callbacks$onlocalstr,
        _callbacks$onremotest = _callbacks.onremotestream,
        _onremotestream = _callbacks$onremotest === undefined ? function () {} : _callbacks$onremotest,
        _callbacks$oncleanup = _callbacks.oncleanup,
        _oncleanup = _callbacks$oncleanup === undefined ? function () {} : _callbacks$oncleanup;

    // eslint-disable-next-line no-return-assign


    return _this2.pluginPromise = new Promise(function (resolve, reject) {
      _this2.janus.attach({
        plugin: 'janus.plugin.sip',
        opaqueId: opaqueId,
        success: function success(pluginHandle) {
          _this2.sipcall = pluginHandle;
          _janus2.default.log('[SIP] Plugin attached! (' + _this2.sipcall.getPlugin() + ', id=' + _this2.sipcall.getId() + ')');
          // Prepare the username registration
          _this2.regist();
          resolve(pluginHandle);
        },
        error: function error(_error2) {
          _janus2.default.error('[SIP] -- Error attaching plugin...', _error2);
          reject(_error2);
        },
        consentDialog: function consentDialog(on) {
          _janus2.default.debug('[SIP] Consent dialog should be ' + (on ? 'on' : 'off') + ' now');
          if (on) {
            // Darken screen and show hin
          } else {
              // Restore screen
            }
          _consentDialog(on);
        },
        mediaState: function mediaState(medium, on) {
          _janus2.default.log('[SIP] Janus ' + (on ? 'started' : 'stopped') + ' receiving our ' + medium);
          _mediaState(medium, on);
        },
        webrtcState: function webrtcState(on) {
          _janus2.default.log('[SIP] Janus says our WebRTC PeerConnection is ' + (on ? 'up' : 'down') + ' now');
          _webrtcState(on);
        },
        onmessage: function onmessage(msg, jsep) {
          _janus2.default.debug('[SIP] ::: Got a message :::');
          _janus2.default.debug(msg);
          // Any error?
          var error = msg.error;

          if (error != null && error !== undefined) {
            if (_this2.registered) {
              // Reset status
              _this2.sipcall.hangup();
            }
            return;
          }
          var result = msg.result;

          if (result !== null && result !== undefined && result.event !== undefined && result.event !== null) {
            var event = result.event;

            if (event === 'registration_failed') {
              _janus2.default.warn('[SIP] Registration failed: ' + result.code + ' ' + result.reason);
              errorCallback(result.reason);
              return;
            }
            if (event === 'registered') {
              if (_this2.registered) return;
              _janus2.default.log('[SIP] Successfully registered as ' + result.username + '!');
              // TODO Enable buttons to call now
              _this2.registered = true;
              _onmessage.registered();
            } else if (event === 'calling') {
              _janus2.default.log('[SIP] Waiting for the peer to answer...');
              _onmessage.calling();
              // TODO Any ringtone?
            } else if (event === 'incomingcall') {
              _janus2.default.log('[SIP] Incoming call from ' + result.displayname + ' (' + result.username + ')!');

              var offerlessInvite = false;
              var doAudio = true;
              var doVideo = true;
              if (jsep !== null && jsep !== undefined) {
                // What has been negotiated?
                doAudio = jsep.sdp.indexOf('m=audio ') > -1;
                doVideo = jsep.sdp.indexOf('m=video ') > -1;
                _janus2.default.debug('[SIP] Audio ' + (doAudio ? 'has' : 'has NOT') + ' been negotiated');
                _janus2.default.debug('[SIP] Video ' + (doVideo ? 'has' : 'has NOT') + ' been negotiated');
              } else {
                _janus2.default.log("[SIP] This call doesn't contain an offer... we'll need to provide one ourselves");
                offerlessInvite = true;
                // In case you want to offer video when reacting to an offerless call, set this to true
                doVideo = false;
              }

              _onmessage.incomingcall(result, {
                jsep: jsep, srtp: result.srtp, offerlessInvite: offerlessInvite, doAudio: doAudio, doVideo: doVideo
              });
              // Any security offered? A missing "srtp" attribute means plain RTP
              // var rtpType = "";
              // var srtp = result["srtp"];
              // if(srtp === "sdes_optional")
              //   rtpType = " (SDES-SRTP offered)";
              // else if(srtp === "sdes_mandatory")
              //   rtpType = " (SDES-SRTP mandatory)";
            } else if (event === 'accepting') {
              // Response to an offerless INVITE, let's wait for an 'accepted'
            } else if (event === 'progress') {
              _janus2.default.log('[SIP] There\'s early media from ' + result.username + ', wairing for the call!');
              _janus2.default.log('[SIP]' + jsep);
              // Call can start already: handle the remote answer
              if (jsep !== null && jsep !== undefined) {
                _this2.sipcall.handleRemoteJsep({
                  jsep: jsep,
                  error: _this2.doHangup
                });
              }
            } else if (event === 'accepted') {
              _janus2.default.log('[SIP] ' + result.username + ' accepted the call!', result, msg);
              _janus2.default.log('[SIP] ' + jsep);
              // Call can start, now: handle the remote answer
              if (jsep !== null && jsep !== undefined) {
                _this2.sipcall.handleRemoteJsep({
                  jsep: jsep,
                  error: _this2.doHangup
                });
              }

              _onmessage.accepted();
              // toastr.success("Call accepted!");
            } else if (event === 'hangup') {
              _janus2.default.log('[SIP] Call hung up (' + result.code + ' ' + result.reason + ')!');
              // Reset status

              if (result.code === 200) {
                _onmessage.hangup();
              }
              if (result.code === 487) {
                _janus2.default.log('[SIP] user terminated ' + result.reason);
                _onmessage.hangup();
              }
              if (result.code === 480) {
                // user offline for now
                _janus2.default.log('[SIP] user can\'t reach right now ' + result.reason);
                _onmessage.unavailable();
              }
              if (result.code === 503) {
                _onmessage.unavailable();
              }
              if (result.code === 404) {
                // user doesn't exist
                _onmessage.unavailable();
              }
              if (result.code === 408) {
                // request timeout
                _onmessage.unavailable();
              }
              if (result.code === 486) {
                _onmessage.reject();
              }
              _this2.sipcall.hangup();
            }
          }
        },
        onlocalstream: function onlocalstream(stream) {
          _janus2.default.debug('[SIP] ::: Got a local stream :::');
          _onlocalstream(stream);
        },

        onremotestream: function onremotestream(stream) {
          _janus2.default.debug('[SIP] ::: Got a remote stream :::');
          _janus2.default.debug(stream);
          _onremotestream(stream);
        },
        oncleanup: function oncleanup() {
          _janus2.default.log('[SIP] ::: Got a cleanup notification :::');
          _oncleanup();
        }
      });
    });
  };

  this.phoneCallAction = function (accepted, config) {
    var jsep = config.jsep,
        offerlessInvite = config.offerlessInvite,
        _config$doAudio = config.doAudio,
        doAudio = _config$doAudio === undefined ? true : _config$doAudio,
        _config$doVideo = config.doVideo,
        doVideo = _config$doVideo === undefined ? false : _config$doVideo;


    if (accepted) {
      var sipcallAction = offerlessInvite ? _this2.sipcall.createOffer : _this2.sipcall.createAnswer;
      sipcallAction({
        jsep: jsep,
        media: { audio: doAudio, video: doVideo },
        success: function success(jsep) {
          _janus2.default.debug('[SIP] Got SDP ' + jsep.type + '! audio=' + doAudio + ', video=' + doVideo);
          _janus2.default.debug('[SIP]' + jsep);
          var body = { request: 'accept' };
          // Note: as with "call", you can add a "srtp" attribute to
          // negotiate/mandate SDES support for this incoming call.
          // The default behaviour is to automatically use it if
          // the caller negotiated it, but you may choose to require
          // SDES support by setting "srtp" to "sdes_mandatory", e.g.:
          // var body = { request: "accept", srtp: "sdes_mandatory" };
          // This way you'll tell the plugin to accept the call, but ONLY
          // if SDES is available, and you don't want plain RTP. If it
          // is not available, you'll get an error (452) back. You can
          // also specify the SRTP profile to negotiate by setting the
          // "srtp_profile" property accordingly (the default if not
          // set in the request is "AES_CM_128_HMAC_SHA1_80")
          _this2.sipcall.send({ message: body, jsep: jsep });
        },
        error: function error(_error3) {
          _janus2.default.error('[SIP] WebRTC error:', _error3);
          // Don't keep the caller waiting any longer, but use a 480 instead of the default 486 to clarify the cause
          var body = { request: 'decline', code: 480 };
          _this2.sipcall.send({ message: body });
        }
      });
    } else {
      var body = { request: 'decline' };
      _this2.sipcall.send({ message: body });
    }
  };

  this.doHangup = function () {
    if (_this2.hangingUp) return _this2.hangingUp;
    var hangup = { request: 'hangup' };
    _this2.hangingUp = new Promise(function (resolve, reject) {
      _this2.sipcall.send({
        message: hangup,
        success: function success(result) {
          _this2.sipcall.hangup();
          resolve(result);
        },
        error: function error(er) {
          return reject(er);
        }
      });
    });
    return _this2.hangingUp;
  };

  this.onDestroy = function () {
    if (_this2.destroyPromise) return _this2.destroyPromise;
    _this2.destroyPromise = new Promise(function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(resolve, reject) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _this2.doHangup();

              case 2:
                _this2.sipcall.detach({
                  success: function success() {
                    resolve(200);
                    _this2.registered = false;
                    _this2.sipcall = null;
                    _this2.hangingUp = null;
                  },
                  error: function error(er) {
                    return reject(er);
                  }
                });

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, _this2);
      }));

      return function (_x3, _x4) {
        return _ref.apply(this, arguments);
      };
    }());
    return _this2.destroyPromise;
  };
}, _temp);
exports.default = Sip;