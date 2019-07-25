import React from 'react';
import { 
  plugins,
  JanusHelper,
} from '../../src';

import {
  janusHost,
  janusWSSPort,
  janusWssUrl,
} from '../../src/config';

const janusDevUrl = janusWssUrl || `wss://${janusHost}:${janusWSSPort}/`;

class ComposeSip extends React.PureComponent {
  constructor() {
    super();
    JanusHelper.setConfig({
      debug: false,
      server: janusDevUrl,
    });
  }

  componentDidMount() {
    this.lockRecognition = true;
    const {
      config,
      callbacks,
    } = this.props;
    JanusHelper.init();
    JanusHelper.injectPlugin(
      plugins.Sip,
      config,
      {
        oncleanup: () => {
          console.log('[SIP] clean up');
          callbacks.oncleanup();
        },
        onlocalstream: (stream) => {
          console.log('[SIP] localAudio', stream);
          callbacks.onlocalstream();
        },
        onremotestream: (stream) => {
          console.log('[SIP] remoteAudio', stream);
          callbacks.onremotestream(stream);
        },
        onmessage: {
          failed: (e) => {
            callbacks.failed(e);
          },
          registered: () => {
            callbacks.registered();
          },
          incomingcall: (userInfo, data) => {
            const { displayname, username } = userInfo;
            // const { jsep, srtp, offerlessInvite, doVideo, doAudio } = data;
            console.log('[SIP] PhoneCall from:', displayname, username);
            callbacks.incomingcall(userInfo, data);
          },
          accepted: () => {
            console.log('[SIP] accepted');
            callbacks.accepted();
          },
          calling: () => {
            console.log('[SIP] calling');
            callbacks.calling();
          },
          hangup: () => {
            console.log('[SIP] hangup');
            callbacks.hangup();
          },
          reject: () => {
            console.log('[SIP] rejected');
            callbacks.reject();
          },
          unavailable: () => {
            callbacks.unavailable();
          },
        },
      },
    ).then(callbacks.success).catch(callbacks.errorCallback);
  }

  render() {
    return null;
  }
}

export default ComposeSip;
