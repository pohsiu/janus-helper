import React from 'react';
import {
  plugins,
} from '~/utils/janus';


const styles = {
  remoteViewContainer: {
    flex: 1,
    width: '100%',
    display: 'flex',
  },
  videosDiv: {
    position: 'relative',
    maxHeight: '100%',
    maxWidth: '100%',
    display: 'flex',
    flex: 1,
  },
  remoteVideoClass: {
    display: 'flex',
    flex: 1,
    width: '100%',
  },
  selfViewContainer: {
    position: 'absolute',
    width: 160,
    height: 90,
    right: 0,
  },
};

class StreamVideos extends React.Component {
  state = {
    localStream: undefined,
    remoteStream: undefined,
  };

  componentDidMount() {
    const {
      janusRoomId,
      unigueRoomId,
      userInfo,
      janus,
    } = this.props;
    janus.injectPlugin(
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
        filename: 'myuser',
        rec_dir: `/path/to/recordings-folder/${unigueRoomId}`,
      },
      {
        onremotestream: this.onRemoteChange,
        onlocalstream: this.onLocalChange,
      }
    ).then(this.onHandlerChange);
  }

  componentWillUnmount() {
    this.props.janus.destroy();
  }

  onLocalChange = (stream) => {
    this.setState({ localStream: stream });
  }

  onRemoteChange = (remoteList) => {
    const remoteStream = Object.keys(remoteList).map((key, index) => index === 0 && remoteList[key])[0];
    this.setState({ remoteStream });
  }

  onHandlerChange = (handler) => {
    this.videoRoomHandler = handler;
  }

  render() {
    const {
      localStream,
      remoteStream,
    } = this.state;

    return (
      <div style={styles.remoteViewContainer}>
        <div style={styles.videosDiv}>
          <Video
            key="remoteStream"
            srcObject={remoteStream}
            autoPlay
            style={styles.remoteVideoClass}
          />
          <Video key="localstream"
            srcObject={localStream}
            autoPlay 
            style={{ ...styles.selfViewContainer, transform: 'scaleX(-1)' }} 
          />
        </div>
      </div>
    );
  }
}

export default StreamVideos;
