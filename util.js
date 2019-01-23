"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withTrailingSlash = exports.withoutLeadingSlash = void 0;

var withoutLeadingSlash = function withoutLeadingSlash(string) {
  return string.startsWith('/') ? string.substring(1) : string;
};

exports.withoutLeadingSlash = withoutLeadingSlash;

var withTrailingSlash = function withTrailingSlash(string) {
  return string.endsWith('/') ? string : string + '/';
};

exports.withTrailingSlash = withTrailingSlash;