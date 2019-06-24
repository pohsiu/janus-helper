# janus-helper
[![npm version](https://img.shields.io/npm/v/janus-helper.svg?style=flat-square)](https://www.npmjs.com/package/janus-helper)
[![npm downloads](https://img.shields.io/npm/dm/janus-helper.svg?style=flat-square)](https://www.npmjs.com/package/janus-helper)
## Getting started

`$ yarn add janus-helper`

## Usage
```Javascript
import { JanusHelper, plugins, Janus } from 'janus-helper'
//... see detail in example dir
```

## janus-helper API
I designed as singleton.

> JanusHelper methods
##### setConfig(config), init
```Javascript
import { JanusHelper } from 'janus-helper'

const config = {
  debug: true || false, // set console will log information for debug or not
  server: 'wss://localhost:28989/', // set janus server wss url address 
};

JanusHelper.setConfig(config);

// after setConfig init the janus and create session for later usage.
JanusHelper.init();
```

##### injectPlugin(plugin instance, basic inforamtion {}, callbacks {}) that would return a plugin handler through Promise
Image this processs is dealing with attaching plugin to a running session.
```Javascript
import { JanusHelper, plugins } from 'janus-helper'

const chosenPlugin = plugins.VideoRoom; // or plugins.SIP choose the plugin that already defined by plugins (now support VideoRoom and SIP only)

const basicInfo = { 
  roomInfo: { // videoRoom info -> required for VideoRoom plugin
    id: janusRoomId, // the id for creating janus-videoroom
    unigueRoomId, // the id for identify each room instance e.g. uuid()
  },
  userInfo: { // user info -> required
    id: '1234',
    name: 'testname',
  }, 
  // extra field for other usage -> optional for VideoRoom plugin
  filename: 'filename', // the rec video file name
  rec_dir: '/path/to/recordings-folder/', // the rec video file path to janus-server
  createRoomConfig: {
    request: 'create',
    room: janusRoomId, 
    // <unique numeric ID, optional, chosen by plugin if missing>, 
    notify_joining: true,
    /* 
      true|false (optional, whether to notify all participants when a new
      participant joins the room. The Videoroom plugin by design only notifies
      new feeds (publishers), and enabling this may result extra notification
      traffic. This flag is particularly useful when enabled with \c require_pvtid
      for admin to manage listening only participants. default=false) 
    */
    bitrate: 128000,
    publishers: 2, // default is 3,
    record: true, // deside record video stream or not
    rec_dir: '/path/to/recordings-folder/',
    // other property could refer to Video Room API https://janus.conf.meetecho.com/docs/videoroom.html
  }
};

const callbacks = { // defined the callbacks you want,
  onlocalstream: (stream) => {
  },
  onremotestream: (remoteList) => {
  },
  // optional to hanlde those callbacks below ...
  consentDialog: (on) => {
  },
  mediaState: (medium, on) => {
  },
  webrtcState: (on) => {
  },
  onmessage: (msg, jsep) => { 
  },
  oncleanup = () => {},
}

const successCallback = handler => this.pluinHandler = handler; // save pluginHandler for later usage

const errorCallback = er => console.log(er);

JanusHelper.injectPlugin(chosen, basicInfo, callbacks).then(successCallback).catch(errorCallback);
```
