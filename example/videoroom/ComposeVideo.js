import React from 'react';
import {
  janusHost,
  janusWSSPort,
  janusWssUrl,
} from '../../src/config';
import { 
  plugins,
  JanusHelper,
} from '../../src';

const janusDevUrl = janusWssUrl || `wss://${janusHost}:${janusWSSPort}/`;

class ComposeVideo extends React.PureComponent {
  constructor(props) {
    super(props);
    JanusHelper.setConfig({
      debug: 'all',
      server: janusDevUrl,
    });
  }

  componentWillMount() {
    const {
      janusRoomId,
    } = this.props;
    JanusHelper.init();
    if (janusRoomId && JanusHelper) this.injectPlugin(janusRoomId);
  }

  componentWillUnmount() {
    if (JanusHelper) {
      if (JanusHelper.plugins.videoroom) JanusHelper.plugins.videoroom.leave();
      JanusHelper.destroy().then(re => console.log(re));
    }
  }

  injectPlugin = (janusRoomId) => {
    console.log('--- add video ---', janusRoomId);
    const {
      userInfo,
      onlocalstream,
      onremotestream,
      onhandler,
      unigueRoomId,
    } = this.props;
    if (!userInfo || !janusRoomId) return;
    JanusHelper.injectPlugin(
      plugins.VideoRoom,
      {
        roomInfo: {
          id: janusRoomId,
          unigueRoomId,
        },
        userInfo: {
          id: userInfo.user_id,
          name: userInfo.user_name,
        },
        filename: 'filename',
        rec_dir: '/path/to/recordings-folder/',
      },
      {
        onlocalstream: (stream) => {
          onlocalstream(stream);
        },
        onremotestream: (remoteList) => {
          const remoteStream = Object.keys(remoteList).map((key, index) => index === 0 && remoteList[key])[0];
          onremotestream(remoteStream);
        },
      }
    ).then(onhandler);
  }

  render() {
    return null;
  }
}

export default ComposeVideo;
