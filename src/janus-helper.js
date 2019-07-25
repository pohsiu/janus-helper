import Janus from './janus';
import { janusHost, janusWSSPort } from './config';

class JanusHelper {
  constructor(config) {
    this.config = config;
    this.plugins = {}; // would be added later ...
    this.initPromise = null;
  }

  setConfig = (config) => {
    if (!this.config && !this.initPromise) {
      this.config = config;
    }
  }

  init = () => {
    if (this.initPromise) {
      return this.initPromise;
    }
    return this.initPromise = new Promise((resolve, reject) => { // eslint-disable-line no-return-assign
      Janus.init({
        debug: this.config.debug || false,
        callback: () => {
          console.log('==== init success ====');
          this.janus = new Janus(
            {
              server: this.config.server || `wss://${janusHost}:${janusWSSPort}/`,
              // No "iceServers" is provided, meaning janus.js will use a default STUN server
              // Here are some examples of how an iceServers field may look like to support TURN
              // 		iceServers: [{url: "turn:yourturnserver.com:3478", username: "janususer", credential: "januspwd"}],
              // 		iceServers: [{url: "turn:yourturnserver.com:443?transport=tcp", username: "janususer", credential: "januspwd"}],
              // 		iceServers: [{url: "turns:yourturnserver.com:443?transport=tcp", username: "janususer", credential: "januspwd"}],
              // Should the Janus API require authentication, you can specify either the API secret or user token here too
              //		token: "mytoken",
              //	or
              //		apisecret: "serversecret",
              success: () => {
                console.log('==== create session success ====');
                resolve(200);
              },
              error: (error) => {
                reject(error);
                this.janus = null;
                this.initPromise = null;
              },
            }
          );
        },
      });
    });
  }

  injectPlugin = async (PlugIn, config, callbacks) => {
    try {
      await this.init();
      if (this.plugins[PlugIn.$name]) return this.plugins[PlugIn.$name].start();
      this.plugins[PlugIn.$name] = new PlugIn(this, config, callbacks);
      return this.plugins[PlugIn.$name].start();
    } catch (e) {
      return e;
    }
  }

  destroy = () => {
    if (this.destroyPromise) return this.destroyPromise;
    // eslint-disable-next-line no-return-assign
    return this.destroyPromise = new Promise(async (resolve, reject) => {
      let PlugIns;
      try {
        PlugIns = await Promise.all(
          Object.keys(this.plugins).map(
            pluginName => Promise.resolve(this.plugins[pluginName].destroy())
          )
        );
      } catch (er) {
        PlugIns = er;
      }
      if (!this.janus) {
        resolve({
          session: 200,
          plugins: PlugIns,
        });
      }
      this.janus.destroy({
        success: () => {
          resolve({
            session: 200,
            plugins: PlugIns,
          });
          this.plugins = {};
          this.initPromise = null;
          this.destroyPromise = null;
        },
        error: er => reject(er),
      });
    });
  }
}

export default JanusHelper;
