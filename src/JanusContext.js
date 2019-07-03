import React from 'react';
import JanusHelper from './janus-helper';

export default React.createContext({
  janus: new JanusHelper(),
});
