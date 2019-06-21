import ComposeVideo from './ComposeVideo';
import Janus from '../../src/janus';

const janusRoomId = 1234;
const unigueRoomId = Janus.randomString(12);
const userInfo = {
  id: 'userId',
  name: 'user',
};

export default class VideoRoom extends React.Component {

  onLocalChange = (stream) => {
    this.setState({ localStream: stream });
  }

  onRemoteChange = (stream) => {
    this.setState({ remoteStream: stream });
  }

  onHandlerChange = (handler) => {
    this.videoRoomHandler = handler;
  }

  render() {
    return (
      <div>
        <ComposeVideo
          onlocalstream={this.onLocalChange}
          onremotestream={this.onRemoteChange}
          onhandler={this.onHandlerChange}
          janusRoomId={janusRoomId}
          unigueRoomId={unigueRoomId}
          userInfo={userInfo}
        />
        <div 
          style={{
            position: 'relative',
            maxHeight: '100%',
            width: '92%',
            maxWidth: '92%',
            display: 'flex',
            flex: 1,
          }}>
          <Video
            key="remoteStream"
            srcObject={remoteStream}
            autoPlay
            style={{
              display: 'flex',
              flex: 1,
              width: '100%',
            }}
          />
          <Video key="localstream" 
            srcObject={localStream}
            autoPlay
            style={{
              position: 'absolute',
              width: 160,
              height: 90,
              top: 0,
              left: 0,
              display: 'flex',
              transform: 'scaleX(-1)'
            }}
          />
        </div>
      </div>
    )
  }
}