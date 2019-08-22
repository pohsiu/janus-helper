import Janus from '../janus';
import PluginBase from './PluginBase';

const opaqueId = `sip-${Janus.randomString(12)}`;

class Sip extends PluginBase {
  static $name = 'sip';

  constructor(mgr, config, callbacks) {
    super();
    this.mgr = mgr;
    this.config = config;
    const { userInfo, ...extras } = config;
    this.userInfo = userInfo;
    this.extras = extras;
    this.callbacks = callbacks;
    this.sipcall = null;
    this.registered = false;
  }

  onStart = () => this.attachSipPlugin()

  // sip part ...
  registerUsername = (username, password, sipserver, authuser, displayname) => {
    // if (password === '') {
    //   alert('Insert the username secret (e.g., mypassword)');
    //   return;
    // }
    Janus.log('[SIP] registering');
    const register = {
      request: 'register',
      username,
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
    this.sipcall.send({ message: register });
  }

  doCall = (toCall, doAudio = true, doVideo = false) => {
    // this.doHangup(); // clean up confirmation
    // Call someone
    const phoneCall = `${toCall}`;
    const uri = `sip:${phoneCall}@${this.config.sipServer}`;
    // Call this URI
    Janus.log(`[SIP] This is a SIP ${doVideo ? 'video' : 'audio'} call (dovideo=${doVideo})`);
    this.sipcall.createOffer(
      {
        media: {
          audioSend: doAudio,
          audioRecv: doAudio, // We DO want audio
          videoSend: doVideo,
          videoRecv: doVideo, // We MAY want video
        },
        success: (jsep) => {
          Janus.debug('[SIP] Got Offer SDP!', jsep);
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
          const body = { request: 'call', uri };
          // Note: you can also ask the plugin to negotiate SDES-SRTP, instead of the
          // default plain RTP, by adding a "srtp" attribute to the request. Valid
          // values are "sdes_optional" and "sdes_mandatory", e.g.:
          // var body = { request: "call", uri: $('#peer').val(), srtp: "sdes_optional" };
          // "sdes_optional" will negotiate RTP/AVP and add a crypto line,
          // "sdes_mandatory" will set the protocol to RTP/SAVP instead.
          // Just beware that some endpoints will NOT accept an INVITE
          // with a crypto line in it if the protocol is not RTP/SAVP,
          // so if you want SDES use "sdes_optional" with care.
          this.sipcall.send({ message: body, jsep });
        },
        error: (error) => {
          Janus.error('[SIP]WebRTC error...', error);
        },
      }
    );
  }

  regist = () => {
    const userName = `sip:${this.userInfo.id}@${this.config.sipServer}`;
    const { secret } = this.userInfo;
    const sipServer = `sip:${this.config.sipServer}:${this.config.sipPort}`;
    this.registerUsername(userName, secret, sipServer, this.userInfo.id, this.userInfo.id);
  }

  attachSipPlugin = () => {
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

    // eslint-disable-next-line no-return-assign
    return this.pluginPromise = new Promise((resolve, reject) => {
      this.janus.attach(
        {
          plugin: 'janus.plugin.sip',
          opaqueId,
          success: (pluginHandle) => {
            this.sipcall = pluginHandle;
            Janus.log(`[SIP] Plugin attached! (${this.sipcall.getPlugin()}, id=${this.sipcall.getId()})`);
            // Prepare the username registration
            this.regist();
            resolve(pluginHandle);
          },
          error: (error) => {
            Janus.error('[SIP] -- Error attaching plugin...', error);
            reject(error);
          },
          consentDialog: (on) => {
            Janus.debug(`[SIP] Consent dialog should be ${on ? 'on' : 'off'} now`);
            if (on) {
              // Darken screen and show hin
            } else {
              // Restore screen
            }
            consentDialog(on);
          },
          mediaState: (medium, on) => {
            Janus.log(`[SIP] Janus ${on ? 'started' : 'stopped'} receiving our ${medium}`);
            mediaState(medium, on);
          },
          webrtcState: (on) => {
            Janus.log(`[SIP] Janus says our WebRTC PeerConnection is ${on ? 'up' : 'down'} now`);
            webrtcState(on);
          },
          onmessage: (msg, jsep) => {
            Janus.debug('[SIP] ::: Got a message :::');
            Janus.debug(msg);
            // Any error?
            const { error } = msg;
            if (error != null && error !== undefined) {
              if (this.registered) {
                // Reset status
                this.sipcall.hangup();
              }
              return;
            }
            const { result } = msg;
            if (result !== null && result !== undefined && result.event !== undefined && result.event !== null) {
              const { event } = result;
              if (event === 'registration_failed') {
                Janus.warn(`[SIP] Registration failed: ${result.code} ${result.reason}`);
                errorCallback(result.reason);
                return;
              }
              if (event === 'registered') {
                if (this.registered) return;
                Janus.log(`[SIP] Successfully registered as ${result.username}!`);
                // TODO Enable buttons to call now
                this.registered = true;
                onmessage.registered();
              } else if (event === 'calling') {
                Janus.log('[SIP] Waiting for the peer to answer...');
                onmessage.calling();
                // TODO Any ringtone?
              } else if (event === 'incomingcall') {
                Janus.log(`[SIP] Incoming call from ${result.displayname} (${result.username})!`);

                let offerlessInvite = false;
                let doAudio = true;
                let doVideo = true;
                if (jsep !== null && jsep !== undefined) {
                  // What has been negotiated?
                  doAudio = (jsep.sdp.indexOf('m=audio ') > -1);
                  doVideo = (jsep.sdp.indexOf('m=video ') > -1);
                  Janus.debug(`[SIP] Audio ${doAudio ? 'has' : 'has NOT'} been negotiated`);
                  Janus.debug(`[SIP] Video ${doVideo ? 'has' : 'has NOT'} been negotiated`);
                } else {
                  Janus.log("[SIP] This call doesn't contain an offer... we'll need to provide one ourselves");
                  offerlessInvite = true;
                  // In case you want to offer video when reacting to an offerless call, set this to true
                  doVideo = false;
                }

                onmessage.incomingcall(result, {
                  jsep, srtp: result.srtp, offerlessInvite, doAudio, doVideo,
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
                Janus.log(`[SIP] There's early media from ${result.username}, wairing for the call!`);
                Janus.log(`[SIP]${jsep}`);
                // Call can start already: handle the remote answer
                if (jsep !== null && jsep !== undefined) {
                  this.sipcall.handleRemoteJsep({
                    jsep,
                    error: this.doHangup,
                  });
                }
              } else if (event === 'accepted') {
                Janus.log(`[SIP] ${result.username} accepted the call!`, result, msg);
                Janus.log(`[SIP] ${jsep}`);
                // Call can start, now: handle the remote answer
                if (jsep !== null && jsep !== undefined) {
                  this.sipcall.handleRemoteJsep({
                    jsep,
                    error: this.doHangup,
                  });
                }

                onmessage.accepted();
                // toastr.success("Call accepted!");
              } else if (event === 'hangup') {
                Janus.log(`[SIP] Call hung up (${result.code} ${result.reason})!`);
                // Reset status

                if (result.code === 200) {
                  onmessage.hangup();
                }
                if (result.code === 487) {
                  Janus.log(`[SIP] user terminated ${result.reason}`);
                  onmessage.hangup();
                }
                if (result.code === 480) { // user offline for now
                  Janus.log(`[SIP] user can't reach right now ${result.reason}`);
                  onmessage.unavailable();
                }
                if (result.code === 503) {
                  onmessage.unavailable();
                }
                if (result.code === 404) { // user doesn't exist
                  onmessage.unavailable();
                }
                if (result.code === 408) { // request timeout
                  onmessage.unavailable();
                }
                if (result.code === 486) {
                  onmessage.reject();
                }
                this.sipcall.hangup();
              }
            }
          },
          onlocalstream(stream) {
            Janus.debug('[SIP] ::: Got a local stream :::');
            onlocalstream(stream);
          },
          onremotestream: (stream) => {
            Janus.debug('[SIP] ::: Got a remote stream :::');
            Janus.debug(stream);
            onremotestream(stream);
          },
          oncleanup() {
            Janus.log('[SIP] ::: Got a cleanup notification :::');
            oncleanup();
          },
        }
      );
    });
  }

  phoneCallAction = (accepted, config) => {
    const {
      jsep,
      offerlessInvite,
      doAudio = true,
      doVideo = false,
    } = config;

    if (accepted) {
      const sipcallAction = (offerlessInvite ? this.sipcall.createOffer : this.sipcall.createAnswer);
      sipcallAction(
        {
          jsep,
          media: { audio: doAudio, video: doVideo },
          success: (jsep) => {
            Janus.debug(`[SIP] Got SDP ${jsep.type}! audio=${doAudio}, video=${doVideo}`);
            Janus.debug(`[SIP]${jsep}`);
            const body = { request: 'accept' };
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
            this.sipcall.send({ message: body, jsep });
          },
          error: (error) => {
            Janus.error('[SIP] WebRTC error:', error);
            // Don't keep the caller waiting any longer, but use a 480 instead of the default 486 to clarify the cause
            const body = { request: 'decline', code: 480 };
            this.sipcall.send({ message: body });
          },
        }
      );
    } else {
      const body = { request: 'decline' };
      this.sipcall.send({ message: body });
    }
  }

  doHangup = () => {
    if (this.hangingUp) return this.hangingUp;
    const hangup = { request: 'hangup' };
    this.hangingUp = new Promise((resolve, reject) => {
      this.sipcall.send({
        message: hangup,
        success: (result) => {
          this.sipcall.hangup();
          resolve(result);
        },
        error: er => reject(er),
      });
    });
    return this.hangingUp;
  }

  onDestroy = () => {
    if (this.destroyPromise) return this.destroyPromise;
    this.destroyPromise = new Promise(async (resolve, reject) => {
      await this.doHangup();
      this.sipcall.detach({
        success: () => {
          resolve(200);
          this.registered = false;
          this.sipcall = null;
          this.hangingUp = null;
        },
        error: er => reject(er),
      });
    });
    return this.destroyPromise;
  };
}

export default Sip;
