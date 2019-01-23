"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CACHING_PARAMS = exports.DEFAULT_OPTIONS = exports.CACHE_FILES = void 0;

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CACHE_FILES = {
  config: _path.default.join('.cache', 's3.config.json'),
  params: _path.default.join('.cache', 's3.params.json'),
  routingRules: _path.default.join('.cache', 's3.routingRules.json')
};
exports.CACHE_FILES = CACHE_FILES;
var DEFAULT_OPTIONS = {
  bucketName: '',
  params: {},
  mergeCachingParams: true,
  generateRoutingRules: true,
  generateIndexPageForRedirect: true,
  generateMatchPathRewrites: true,
  removeNonexistentObjects: true
};
exports.DEFAULT_OPTIONS = DEFAULT_OPTIONS;
var CACHING_PARAMS = {
  '**.html': {
    CacheControl: 'public, max-age=0, must-revalidate'
  },
  'static/**': {
    CacheControl: 'public, max-age=31536000, immutable'
  },
  'sw.js': {
    CacheControl: 'no-cache'
  }
};
exports.CACHING_PARAMS = CACHING_PARAMS;