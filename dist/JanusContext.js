'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _janusHelper = require('./janus-helper');

var _janusHelper2 = _interopRequireDefault(_janusHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _react2.default.createContext({
  janus: new _janusHelper2.default()
});