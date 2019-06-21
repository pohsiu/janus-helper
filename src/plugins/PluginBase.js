/* eslint-disable no-console */
export default class PluginBase {
  start() {
    console.log('==== start service ==== :', this.constructor.$name);
    return Promise.resolve()
    .then(() => this.onStart && this.onStart());
  }

  destroy() {
    return new Promise((resolve, reject) => {
      try {
        console.log('==== destorying service ==== :', this.constructor.$name);
        return resolve(this.onDestroy && this.onDestroy());
      } catch (e) {
        return reject(e);
      }
    });
  }
}
