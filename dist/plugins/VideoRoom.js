'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _class, _temp;

var _janus = require('../janus');

var _janus2 = _interopRequireDefault(_janus);

var _PluginBase2 = require('./PluginBase');

var _PluginBase3 = _interopRequireDefault(_PluginBase2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// video room var
var mypvtid = null;
var opaqueId = 'videoroom-' + _janus2.default.randomString(12);

var VideoRoom = (_temp = _class = function (_PluginBase) {
  _inherits(VideoRoom, _PluginBase);

  function VideoRoom(mgr, config, callbacks) {
    var _this2 = this;

    _classCallCheck(this, VideoRoom);

    var _this = _possibleConstructorReturn(this, (VideoRoom.__proto__ || Object.getPrototypeOf(VideoRoom)).call(this));

    _this.onStart = function () {
      return _this.attachVideoRoomPlugin();
    };

    _this.checkPropertyAndWork = function (msg, property) {
      var value = msg[property];
      if (value && value !== null) {
        switch (property) {
          case 'publishers':
            {
              _janus2.default.log('[VideoRoom] Got a list of available publishers/feeds:', value);
              value.forEach(function (each) {
                var id = each.id,
                    display = each.display,
                    audio_codec = each.audio_codec,
                    video_codec = each.video_codec;

                _janus2.default.log('[VideoRoom] >> [' + id + '] ' + display + ' (audio: ' + audio_codec + ', video: ' + video_codec + ')');
                _this.newRemoteFeed(id, display, audio_codec, video_codec);
              });
              return;
            }
          case 'leaving':
            {
              _janus2.default.log('[VideoRoom] Publisher left: ' + value);
              var numLeaving = value;
              if (Object.prototype.hasOwnProperty.call(_this.remoteList, numLeaving)) {
                // this.remoteList.hasOwnProperty(numLeaving)
                delete _this.remoteList[numLeaving];
                _this.callbacks.onremotestream(_this.remoteList);
              }
              return;
            }
          case 'unpublished':
            {
              // One of the publishers has unpublished?
              _janus2.default.log('[VideoRoom] unPublisher left: ' + value);
              if (value === 'ok') {
                // That's us
                _this.sfutest.hangup();
                return;
              }
              var _numLeaving = value;
              if (Object.prototype.hasOwnProperty.call(_this.remoteList, _numLeaving)) {
                // this.remoteList.hasOwnProperty(numLeaving)
                delete _this.remoteList[_numLeaving];
                _this.callbacks.onremotestream(_this.remoteList);
              }
              return;
            }
          case 'error':
            {
              if (msg.error_code === 426) {
                // This is a "no such room" error: give a more meaningful description
                _janus2.default.warn('[VideoRoom] This is a no such room error');
                _this.createRoom(_this.sfutest);
                return;
              }
              _janus2.default.log('Error', msg.error);
              break;
            }
          default:
            {
              break;
            }
        }
      }
    };

    _this.createRoom = function (handler) {
      var defaultRoomInfo = {
        request: 'create',
        room: _this.roomInfo.id,
        notify_joining: true,
        bitrate: 128000,
        publishers: 2, // default is 3,
        record: true,
        rec_dir: _this.extras.rec_dir ? _this.extras.rec_dir : '/path/to/recordings-folder/' + _this.roomInfo.unigueRoomId
      };

      handler.send({
        message: _this.extras.createRoomConfig ? _this.extras.createRoomConfig : defaultRoomInfo,
        error: function error(_error) {
          return _janus2.default.error('[VideoRoom] er', _error);
        }
      });
    };

    _this.attachVideoRoomPlugin = function () {
      if (_this.pluginPromise) return _this.pluginPromise;
      _this.janus = _this.mgr.janus;

      var _this$callbacks = _this.callbacks,
          _this$callbacks$conse = _this$callbacks.consentDialog,
          _consentDialog = _this$callbacks$conse === undefined ? function () {} : _this$callbacks$conse,
          _this$callbacks$media = _this$callbacks.mediaState,
          _mediaState = _this$callbacks$media === undefined ? function () {} : _this$callbacks$media,
          _this$callbacks$webrt = _this$callbacks.webrtcState,
          _webrtcState = _this$callbacks$webrt === undefined ? function () {} : _this$callbacks$webrt,
          _this$callbacks$onmes = _this$callbacks.onmessage,
          _onmessage = _this$callbacks$onmes === undefined ? function () {} : _this$callbacks$onmes,
          _this$callbacks$onloc = _this$callbacks.onlocalstream,
          _onlocalstream = _this$callbacks$onloc === undefined ? function () {} : _this$callbacks$onloc,
          _this$callbacks$onrem = _this$callbacks.onremotestream,
          _onremotestream = _this$callbacks$onrem === undefined ? function () {} : _this$callbacks$onrem,
          _this$callbacks$oncle = _this$callbacks.oncleanup,
          _oncleanup = _this$callbacks$oncle === undefined ? function () {} : _this$callbacks$oncle;

      _this.pluginPromise = new Promise(function (resolve, reject) {
        _this.janus.attach({
          plugin: 'janus.plugin.videoroom',
          opaqueId: opaqueId,
          success: function success(pluginHandle) {
            _this.sfutest = pluginHandle;
            _this.createRoom(_this.sfutest);
            _janus2.default.log('[VideoRoom] Plugin attached! (' + _this.sfutest.getPlugin() + ', id=' + _this.sfutest.getId() + ')');
            _janus2.default.log('[VideoRoom]  -- This is a publisher/manager');
            var register = {
              request: 'join',
              room: _this.roomInfo.id,
              ptype: 'publisher',
              display: _this.userInfo.name,
              id: _this.sfutest.getId()
            };
            _this.sfutest.send({ message: register });
            resolve(pluginHandle);
          },
          error: function error(_error2) {
            _janus2.default.error('[VideoRoom]  -- Error attaching plugin...', _error2);
            reject(_error2);
          },
          consentDialog: function consentDialog(on) {
            _janus2.default.log('[VideoRoom] Consent dialog should be ' + (on ? 'on' : 'off') + ' now');
            if (on) {
              // Darken screen and show hint
            } else {
                // Restore screen
              }
            _consentDialog(on);
          },
          mediaState: function mediaState(medium, on) {
            _janus2.default.log('[VideoRoom] ' + (on ? 'started' : 'stopped') + ' receiving our ' + medium);
            _mediaState(medium, on);
          },
          webrtcState: function webrtcState(on) {
            _janus2.default.log('[VideoRoom] says our WebRTC PeerConnection is ' + (on ? 'up' : 'down') + ' now');
            _webrtcState(on);
          },

          onmessage: function onmessage(msg, jsep) {
            var event = msg.videoroom;
            _janus2.default.log('[VideoRoom] ::: Got a message (publisher) :::', msg, event);
            var myid = void 0;
            if (event !== undefined && event !== null) {
              switch (event) {
                case 'joined':
                  {
                    myid = msg.id;
                    mypvtid = msg.private_id;
                    _janus2.default.log('[VideoRoom] Successfully joined room ' + msg.room + ' with ID ' + myid);
                    _this.publishOwnFeed(true);
                    _this.checkPropertyAndWork(msg, 'publishers');
                    break;
                  }
                case 'event':
                  {
                    _this.checkPropertyAndWork(msg, 'publishers'); // if publishers property exists then work
                    _this.checkPropertyAndWork(msg, 'leaving');
                    _this.checkPropertyAndWork(msg, 'unpublished');
                    _this.checkPropertyAndWork(msg, 'error');
                    break;
                  }
                case 'destroyed':
                  {
                    _janus2.default.warn('[VideoRoom] The room has been destroyed!');
                    break;
                  }
                default:
                  {
                    return;
                  }
              }
            }
            if (jsep !== undefined && jsep !== null) {
              _janus2.default.log('[VideoRoom] ::: Got a Jsep  :::', jsep);
              _this.sfutest.handleRemoteJsep({ jsep: jsep }); // that would trigger event with publishers (add jsep to publisher),
              // Check if any of the media we wanted to publish has
              // been rejected (e.g., wrong or unsupported codec)
            }
            _onmessage(msg, jsep);
          },
          onlocalstream: function onlocalstream(stream) {
            _janus2.default.log('[VideoRoom] ::: Got a local stream :::', stream);
            _onlocalstream(stream);
          },
          onremotestream: function onremotestream(stream) {
            // The publisher stream is sendonly, we don't expect anything here
            _onremotestream(stream);
          },
          oncleanup: function oncleanup() {
            _janus2.default.log('[VideoRoom] ::: Got a cleanup notification: we are unpublished now :::');
            _oncleanup();
          },
          detached: function detached(re) {
            console.log('detached', re);
          }
        });
      });
      return _this.pluginPromise;
    };

    _this.newRemoteFeed = function (id, display, audio, video) {
      // A new feed has been published, create a new plugin handle and attach to it as a subscriber
      var remoteFeed = null;
      _this.janus.attach({
        plugin: 'janus.plugin.videoroom',
        opaqueId: opaqueId,
        success: function success(pluginHandle) {
          remoteFeed = pluginHandle;
          remoteFeed.simulcastStarted = false;
          _janus2.default.log('[VideoRoom][Remote] Plugin attached! (' + remoteFeed.getPlugin() + ', id=' + remoteFeed.getId() + ')');
          _janus2.default.log('[VideoRoom][Remote] -- This is a subscriber');
          // We wait for the plugin to send us an offer
          var subscribe = {
            request: 'join', room: _this.roomInfo.id, ptype: 'subscriber', feed: id, private_id: mypvtid
          };
          // In case you don't want to receive audio, video or data, even if the
          // publisher is sending them, set the 'offer_audio', 'offer_video' or
          // 'offer_data' properties to false (they're true by default), e.g.:
          // subscribe["offer_video"] = false;
          // For example, if the publisher is VP8 and this is Safari, let's avoid video
          if (_janus2.default.webRTCAdapter.browserDetails.browser === 'safari' && (video === 'vp9' || video === 'vp8' && !_janus2.default.safariVp8)) {
            if (video) {
              video = video.toUpperCase();
            }
            // toastr.warning("Publisher is using " + video + ", but Safari doesn't support it: disabling video");
            subscribe.offer_video = false;
          }
          remoteFeed.videoCodec = video;
          remoteFeed.send({ message: subscribe });
        },
        error: function error(_error3) {
          _janus2.default.error('[VideoRoom][Remote]  -- Error attaching plugin...', _error3);
          // bootbox.alert("Error attaching plugin... " + error);
        },
        onmessage: function onmessage(msg, jsep) {
          var event = msg.videoroom;
          _janus2.default.log('[VideoRoom][Remote] ::: Got a message (publisher) :::', msg, event);
          if (msg.error && msg.error !== null) {
            _janus2.default.log('[VideoRoom][Remote][ERROR]', msg.error);
          } else if (event && event !== null) {
            if (event === 'attached') {
              // Subscriber created and attached
              _janus2.default.log('[VideoRoom][Remote] Successfully attached to feed ' + remoteFeed.rfid + ' (' + remoteFeed.rfdisplay + ') in room ' + msg.room);
            }
          }
          if (jsep !== undefined && jsep !== null) {
            _janus2.default.debug('[VideoRoom][Remote] Handling SDP as well...');
            _janus2.default.debug(jsep);
            // Answer and attach
            remoteFeed.createAnswer({
              jsep: jsep,
              // Add data:true here if you want to subscribe to datachannels as well
              // (obviously only works if the publisher offered them in the first place)
              media: { audioSend: false, videoSend: false }, // We want recvonly audio/video
              success: function success(jsep) {
                _janus2.default.debug('[VideoRoom][Remote] Got SDP!');
                _janus2.default.debug('[VideoRoom][Remote] ' + jsep);
                var body = { request: 'start', room: _this.roomInfo.id };
                remoteFeed.send({ message: body, jsep: jsep });
              },
              error: function error(_error4) {
                _janus2.default.error('[VideoRoom][Remote] WebRTC error:', _error4);
              }
            });
          }
        },
        webrtcState: function webrtcState(on) {
          _janus2.default.log('[VideoRoom][Remote] says this WebRTC PeerConnection (feed #\' ' + remoteFeed.rfindex + ' \') is \'' + (on ? 'up' : 'down') + '\' now\')');
        },
        onlocalstream: function onlocalstream(stream) {
          // The subscriber stream is recvonly, we don't expect anything here
          _janus2.default.log('[VideoRoom][Remote] === local stream === ', stream);
        },
        onremotestream: function onremotestream(stream) {
          _janus2.default.log('[VideoRoom][Remote] Remote feed #' + remoteFeed.rfindex);
          // var videoTracks = stream.getVideoTracks();
          // if(videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
          //   // No remote video
          // } else {
          // }
          _this.remoteList[id] = stream;
          _this.callbacks.onremotestream(_this.remoteList);
        },
        oncleanup: function oncleanup() {
          _janus2.default.log('[VideoRoom][Remote] ::: Got a cleanup notification (remote feed ' + id + ') :::');
        }
      });
    };

    _this.publishOwnFeed = function (useAudio) {
      // Publish our stream
      _this.sfutest.createOffer({
        // Add data:true here if you want to publish datachannels as well
        media: {
          audioRecv: false, videoRecv: false, audioSend: useAudio, videoSend: true
        }, // Publishers are sendonly
        forced: true,
        // If you want to test simulcasting (Chrome and Firefox only), then
        // pass a ?simulcast=true when opening this demo page: it will turn
        // the following 'simulcast' property to pass to janus.js to true
        success: function success(jsep) {
          _janus2.default.log('[VideoRoom][Own] Got publisher SDP!', jsep);
          var publish = {
            // request: 'configure', audio: useAudio, video: true, bitrate: 12800,
            request: 'configure',
            audio: useAudio,
            video: true,
            bitrate: 0,
            filename: _this.extras.filename ? _this.extras.filename : _this.userInfo.id
          };
          // // You can force a specific codec to use when publishing by using the
          // // audiocodec and videocodec properties, for instance:
          // // publish["audiocodec"] = "opus"
          // // to force Opus as the audio codec to use, or:
          // // publish["videocodec"] = "vp9"
          // // to force VP9 as the videocodec to use. In both case, though, forcing
          // // a codec will only work if: (1) the codec is actually in the SDP (and
          // // so the browser supports it), and (2) the codec is in the list of
          // // allowed codecs in a room. With respect to the point (2) above,
          // // refer to the text in janus.plugin.videoroom.cfg for more details
          _this.sfutest.send({ message: publish, jsep: jsep });
        },
        error: function error(_error5) {
          _janus2.default.error('[VideoRoom][Own] WebRTC error:', _error5);
          if (useAudio) {
            _this.publishOwnFeed(false);
          } else {
            _janus2.default.error('[VideoRoom][Own] webRtc error', _error5);
          }
        }
      });
    };

    _this.leave = function () {
      if (_this.leaving) return _this.leaving;
      var leaveRequest = {
        request: 'leave'
      };
      // eslint-disable-next-line no-return-assign
      return _this.leaving = new Promise(function (resolve, reject) {
        _this.sfutest.send({
          message: leaveRequest,
          success: function success(re) {
            resolve(re);
            _this.sfutest.hangup();
          },
          error: function error(er) {
            return reject(er);
          }
        });
      });
    };

    _this.onDestroy = function () {
      if (_this.destroyPromise) return _this.destroyPromise;
      _this.destroyPromise = new Promise(function () {
        var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(resolve, reject) {
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return _this.leave();

                case 2:
                  _this.pluginPromise = null;
                  _this.remoteList = {};
                  _this.sfutest.send({
                    message: {
                      request: 'destroy',
                      room: _this.roomInfo.id
                    },
                    success: function success(re) {
                      _janus2.default.log('Destroy The Room', re);
                      _this.sfutest.detach({
                        success: function success() {
                          resolve(200);
                          _this.sfutest = null;
                          _this.leaving = null;
                        }
                      });
                    },
                    error: function error(e) {
                      return reject(e);
                    }
                  });

                case 5:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this2);
        }));

        return function (_x, _x2) {
          return _ref.apply(this, arguments);
        };
      }());
      return _this.destroyPromise;
    };

    _this.mgr = mgr;

    var roomInfo = config.roomInfo,
        userInfo = config.userInfo,
        extras = _objectWithoutProperties(config, ['roomInfo', 'userInfo']);

    _this.roomInfo = roomInfo;
    _this.userInfo = userInfo;
    _this.extras = extras;
    _this.callbacks = callbacks;
    _this.pluginPromise = null;
    _this.remoteList = {};
    _this.sfutest = null;
    return _this;
  }

  return VideoRoom;
}(_PluginBase3.default), _class.$name = 'videoroom', _temp);
exports.default = VideoRoom;