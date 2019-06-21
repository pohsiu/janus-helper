'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-disable no-console */
var PluginBase = function () {
  function PluginBase() {
    _classCallCheck(this, PluginBase);
  }

  _createClass(PluginBase, [{
    key: 'start',
    value: function start() {
      var _this = this;

      console.log('==== start service ==== :', this.constructor.$name);
      return Promise.resolve().then(function () {
        return _this.onStart && _this.onStart();
      });
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        try {
          console.log('==== destorying service ==== :', _this2.constructor.$name);
          return resolve(_this2.onDestroy && _this2.onDestroy());
        } catch (e) {
          return reject(e);
        }
      });
    }
  }]);

  return PluginBase;
}();

exports.default = PluginBase;