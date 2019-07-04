import React from 'react';
import { 
  JanusHelper,
  JanusContext,
} from '../../src';

const janusRoomId = 1234;
const unigueRoomId = Janus.randomString(12);
const userInfo = {
  id: 'userId',
  name: 'user',
};

export default class VideoRoom extends React.Component {
  componentDidMount() {
    const config = { server: 'wss://localhost:28989', debug: false };
    this.janus = new JanusHelper(config);
  }

  render() {
    return (
      <div>
        {/* Highly recommend you use context to implement */}
        <JanusContext.Provider value={{ janus: this.janus }}>
          <JanusContext.Consumer>
            {({ janus }) => (
              <StreamVideo 
                janus={janus}
                unigueRoomId={unigueRoomId}
                userInfo={userInfo}
                janusRoomId={janusRoomId}
              />
            )}
          </JanusContext.Consumer>
        </JanusContext.Provider>
        {/* Traditional familiar way to implement .. */}
        <StreamVideo 
          janus={this.janus}
          unigueRoomId={unigueRoomId}
          userInfo={userInfo}
          janusRoomId={janusRoomId}
        />
      </div>
    )
  }
}