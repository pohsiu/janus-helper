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

##### JanusHelper methods
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
    unigueRoomId, // the id for identify each room instance
  },
  userInfo: { // user info -> required
    id: userInfo.user_id,
    name: userInfo.user_name,
  }, 
  // extra field for other usage -> required for VideoRoom plugin
  filename: 'filename', // the rec video file name
  rec_dir: '/path/to/recordings-folder/', // the rec video file path to janus-server
};

const callbacks = { // defined the callbacks you want,
  onlocalstream: (stream) => {
  },
  onremotestream: (remoteList) => {
  },
}

const onChangeHandler = handler => this.pluinHandler = handler; // save pluginHandler for later usage

JanusHelper.injectPlugin(chosen, basicInfo, callbacks).then(onChangeHandler);
```
