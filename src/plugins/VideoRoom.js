import Janus from '../janus';
import PluginBase from './PluginBase';

// video room var
let mypvtid = null;
const opaqueId = `videoroom-${Janus.randomString(12)}`;

class VideoRoom extends PluginBase {
  static $name = 'videoroom';

  constructor(mgr, config, callbacks) {
    super();
    this.mgr = mgr;
    const { roomInfo, userInfo, ...extras } = config;
    this.roomInfo = roomInfo;
    this.userInfo = userInfo;
    this.extras = extras;
    this.callbacks = callbacks;
    this.pluginPromise = null;
    this.remoteList = {};
    this.sfutest = null;
  }

  onStart = () => this.attachVideoRoomPlugin()

  checkPropertyAndWork = (msg, property) => {
    const value = msg[property];
    if (value && value !== null) {
      switch (property) {
        case 'publishers': {
          Janus.log('[VideoRoom] Got a list of available publishers/feeds:', value);
          value.forEach((each) => {
            const {
              id, display, audio_codec, video_codec,
            } = each;
            Janus.log(`[VideoRoom] >> [${id}] ${display} (audio: ${audio_codec}, video: ${video_codec})`);
            this.newRemoteFeed(id, display, audio_codec, video_codec);
          });
          return;
        }
        case 'leaving': {
          Janus.log(`[VideoRoom] Publisher left: ${value}`);
          const numLeaving = value;
          if (Object.prototype.hasOwnProperty.call(this.remoteList, numLeaving)) { // this.remoteList.hasOwnProperty(numLeaving)
            delete this.remoteList[numLeaving];
            this.callbacks.onremotestream(this.remoteList);
          }
          return;
        }
        case 'unpublished': {
          // One of the publishers has unpublished?
          Janus.log(`[VideoRoom] unPublisher left: ${value}`);
          if (value === 'ok') {
            // That's us
            this.sfutest.hangup();
            return;
          }
          const numLeaving = value;
          if (Object.prototype.hasOwnProperty.call(this.remoteList, numLeaving)) { // this.remoteList.hasOwnProperty(numLeaving)
            delete this.remoteList[numLeaving];
            this.callbacks.onremotestream(this.remoteList);
          }
          return;
        }
        case 'error': {
          if (msg.error_code === 426) {
            // This is a "no such room" error: give a more meaningful description
            Janus.warn('[VideoRoom] This is a no such room error');
            this.createRoom(this.sfutest);
            return;
          }
          Janus.log('Error', msg.error);
          break;
        }
        default: {
          break;
        }
      }
    }
  }

  createRoom = (handler) => {
    handler.send({
      message: {
        request: 'create',
        room: this.roomInfo.id,
        notify_joining: true,
        bitrate: 128000,
        publishers: 2, // default is 3,
        record: true,
        rec_dir: this.extras.rec_dir ? this.extras.rec_dir : `/path/to/recordings-folder/${this.roomInfo.unigueRoomId}`,
      },
      error: error => Janus.error('[VideoRoom] er', error),
    });
  }

  attachVideoRoomPlugin = () => {
    if (this.pluginPromise) return this.pluginPromise;
    this.janus = this.mgr.janus;
    const {
      consentDialog = () => {},
      mediaState = () => {},
      webrtcState = () => {},
      onmessage = () => {},
      onlocalstream = () => {},
      onremotestream = () => {},
      oncleanup = () => {},
    } = this.callbacks;
    this.pluginPromise = new Promise((resolve, reject) => {
      this.janus.attach(
        {
          plugin: 'janus.plugin.videoroom',
          opaqueId,
          success: (pluginHandle) => {
            this.sfutest = pluginHandle;
            this.createRoom(this.sfutest);
            Janus.log(`[VideoRoom] Plugin attached! (${this.sfutest.getPlugin()}, id=${this.sfutest.getId()})`);
            Janus.log('[VideoRoom]  -- This is a publisher/manager');
            const register = {
              request: 'join',
              room: this.roomInfo.id,
              ptype: 'publisher',
              display: this.userInfo.name,
              id: this.sfutest.getId(),
            };
            this.sfutest.send({ message: register });
            resolve(pluginHandle);
          },
          error(error) {
            Janus.error('[VideoRoom]  -- Error attaching plugin...', error);
            reject(error);
          },
          consentDialog(on) {
            Janus.log(`[VideoRoom] Consent dialog should be ${on ? 'on' : 'off'} now`);
            if (on) {
              // Darken screen and show hint
            } else {
              // Restore screen
            }
            consentDialog(on);
          },
          mediaState(medium, on) {
            Janus.log(`[VideoRoom] ${on ? 'started' : 'stopped'} receiving our ${medium}`);
            mediaState(medium, on);
          },
          webrtcState(on) {
            Janus.log(`[VideoRoom] says our WebRTC PeerConnection is ${on ? 'up' : 'down'} now`);
            webrtcState(on);
          },
          onmessage: (msg, jsep) => {
            const event = msg.videoroom;
            Janus.log('[VideoRoom] ::: Got a message (publisher) :::', msg, event);
            let myid;
            if (event !== undefined && event !== null) {
              switch (event) {
                case 'joined': {
                  myid = msg.id;
                  mypvtid = msg.private_id;
                  Janus.log(`[VideoRoom] Successfully joined room ${msg.room} with ID ${myid}`);
                  this.publishOwnFeed(true);
                  this.checkPropertyAndWork(msg, 'publishers');
                  break;
                }
                case 'event': {
                  this.checkPropertyAndWork(msg, 'publishers'); // if publishers property exists then work
                  this.checkPropertyAndWork(msg, 'leaving');
                  this.checkPropertyAndWork(msg, 'unpublished');
                  this.checkPropertyAndWork(msg, 'error');
                  break;
                }
                case 'destroyed': {
                  Janus.warn('[VideoRoom] The room has been destroyed!');
                  break;
                }
                default: {
                  return;
                }
              }
            }
            if (jsep !== undefined && jsep !== null) {
              Janus.log('[VideoRoom] ::: Got a Jsep  :::', jsep);
              this.sfutest.handleRemoteJsep({ jsep }); // that would trigger event with publishers (add jsep to publisher),
              // Check if any of the media we wanted to publish has
              // been rejected (e.g., wrong or unsupported codec)
            }
            onmessage(msg, jsep);
          },
          onlocalstream(stream) {
            Janus.log('[VideoRoom] ::: Got a local stream :::', stream);
            onlocalstream(stream);
          },
          onremotestream(stream) {
            // The publisher stream is sendonly, we don't expect anything here
            onremotestream(stream);
          },
          oncleanup() {
            Janus.log('[VideoRoom] ::: Got a cleanup notification: we are unpublished now :::');
            oncleanup();
          },
          detached(re) {
            console.log('detached', re);
          },
        }
      );
    });
    return this.pluginPromise;
  }

  newRemoteFeed = (id, display, audio, video) => {
    // A new feed has been published, create a new plugin handle and attach to it as a subscriber
    let remoteFeed = null;
    this.janus.attach(
      {
        plugin: 'janus.plugin.videoroom',
        opaqueId,
        success: (pluginHandle) => {
          remoteFeed = pluginHandle;
          remoteFeed.simulcastStarted = false;
          Janus.log(`[VideoRoom][Remote] Plugin attached! (${remoteFeed.getPlugin()}, id=${remoteFeed.getId()})`);
          Janus.log('[VideoRoom][Remote] -- This is a subscriber');
          // We wait for the plugin to send us an offer
          const subscribe = {
            request: 'join', room: this.roomInfo.id, ptype: 'subscriber', feed: id, private_id: mypvtid,
          };
          // In case you don't want to receive audio, video or data, even if the
          // publisher is sending them, set the 'offer_audio', 'offer_video' or
          // 'offer_data' properties to false (they're true by default), e.g.:
          // subscribe["offer_video"] = false;
          // For example, if the publisher is VP8 and this is Safari, let's avoid video
          if (Janus.webRTCAdapter.browserDetails.browser === 'safari'
              && (video === 'vp9' || (video === 'vp8' && !Janus.safariVp8))) {
            if (video) { video = video.toUpperCase(); }
            // toastr.warning("Publisher is using " + video + ", but Safari doesn't support it: disabling video");
            subscribe.offer_video = false;
          }
          remoteFeed.videoCodec = video;
          remoteFeed.send({ message: subscribe });
        },
        error: (error) => {
          Janus.error('[VideoRoom][Remote]  -- Error attaching plugin...', error);
          // bootbox.alert("Error attaching plugin... " + error);
        },
        onmessage: (msg, jsep) => {
          const event = msg.videoroom;
          Janus.log('[VideoRoom][Remote] ::: Got a message (publisher) :::', msg, event);
          if (msg.error && msg.error !== null) {
            Janus.log('[VideoRoom][Remote][ERROR]', msg.error);
          } else if (event && event !== null) {
            if (event === 'attached') {
              // Subscriber created and attached
              Janus.log(`[VideoRoom][Remote] Successfully attached to feed ${remoteFeed.rfid} (${remoteFeed.rfdisplay}) in room ${msg.room}`);
            }
          }
          if (jsep !== undefined && jsep !== null) {
            Janus.debug('[VideoRoom][Remote] Handling SDP as well...');
            Janus.debug(jsep);
            // Answer and attach
            remoteFeed.createAnswer(
              {
                jsep,
                // Add data:true here if you want to subscribe to datachannels as well
                // (obviously only works if the publisher offered them in the first place)
                media: { audioSend: false, videoSend: false },	// We want recvonly audio/video
                success: (jsep) => {
                  Janus.debug('[VideoRoom][Remote] Got SDP!');
                  Janus.debug(`[VideoRoom][Remote] ${jsep}`);
                  const body = { request: 'start', room: this.roomInfo.id };
                  remoteFeed.send({ message: body, jsep });
                },
                error: (error) => {
                  Janus.error('[VideoRoom][Remote] WebRTC error:', error);
                },
              }
            );
          }
        },
        webrtcState: (on) => {
          Janus.log(`[VideoRoom][Remote] says this WebRTC PeerConnection (feed #' ${remoteFeed.rfindex} ') is '${(on ? 'up' : 'down')}' now')`);
        },
        onlocalstream: (stream) => {
          // The subscriber stream is recvonly, we don't expect anything here
          Janus.log('[VideoRoom][Remote] === local stream === ', stream);
        },
        onremotestream: (stream) => {
          Janus.log(`[VideoRoom][Remote] Remote feed #${remoteFeed.rfindex}`);
          // var videoTracks = stream.getVideoTracks();
          // if(videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
          //   // No remote video
          // } else {
          // }
          this.remoteList[id] = stream;
          this.callbacks.onremotestream(this.remoteList);
        },
        oncleanup: () => {
          Janus.log(`[VideoRoom][Remote] ::: Got a cleanup notification (remote feed ${id}) :::`);
        },
      }
    );
  }

  publishOwnFeed = (useAudio) => {
    // Publish our stream
    this.sfutest.createOffer(
      {
        // Add data:true here if you want to publish datachannels as well
        media: {
          audioRecv: false, videoRecv: false, audioSend: useAudio, videoSend: true,
        }, // Publishers are sendonly
        forced: true,
        // If you want to test simulcasting (Chrome and Firefox only), then
        // pass a ?simulcast=true when opening this demo page: it will turn
        // the following 'simulcast' property to pass to janus.js to true
        success: (jsep) => {
          Janus.log('[VideoRoom][Own] Got publisher SDP!', jsep);
          const publish = {
            // request: 'configure', audio: useAudio, video: true, bitrate: 12800,
            request: 'configure',
            audio: useAudio,
            video: true,
            bitrate: 0,
            filename: this.extras.filename ? this.extras.filename : this.userInfo.id,
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
          this.sfutest.send({ message: publish, jsep });
        },
        error: (error) => {
          Janus.error('[VideoRoom][Own] WebRTC error:', error);
          if (useAudio) {
            this.publishOwnFeed(false);
          } else {
            Janus.error('[VideoRoom][Own] webRtc error', error);
          }
        },
      }
    );
  }

  leave = () => {
    if (this.leaving) return this.leaving;
    const leaveRequest = {
      request: 'leave',
    };
    // eslint-disable-next-line no-return-assign
    return this.leaving = new Promise((resolve, reject) => {
      this.sfutest.send({
        message: leaveRequest,
        success: (re) => {
          resolve(re);
          this.sfutest.hangup();
        },
        error: er => reject(er),
      });
    });
  };

  onDestroy = () => {
    if (this.destroyPromise) return this.destroyPromise;
    this.destroyPromise = new Promise(async (resolve, reject) => {
      await this.leave();
      this.pluginPromise = null;
      this.remoteList = {};
      this.sfutest.send({
        message: {
          request: 'destroy',
          room: this.roomInfo.id,
        },
        success: (re) => {
          Janus.log('Destroy The Room', re);
          this.sfutest.detach({
            success: () => {
              resolve(200);
              this.sfutest = null;
              this.leaving = null;
            },
          });
        },
        error: e => reject(e),
      });
    });
    return this.destroyPromise;
  }
}

export default VideoRoom;
