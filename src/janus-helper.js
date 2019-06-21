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
      this.plugins = {};
      this.initPromise = null;
      this.janus.destroy({
        success: () => resolve({
          session: 200,
          plugins: PlugIns,
        }),
        error: er => reject(er),
      });
    });
  }
}

export default new JanusHelper();
