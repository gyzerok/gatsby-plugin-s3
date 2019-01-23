"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.onPostBuild = exports.createPagesStatefully = exports.onPreBootstrap = void 0;

var _constants = require("./constants");

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

; // converts gatsby redirects + rewrites to S3 routing rules
// https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-websiteconfiguration-routingrules.html

var getRules = function getRules(pluginOptions, routes) {
  return routes.map(function (route) {
    var alwaysTheSame = {
      HttpRedirectCode: route.isPermanent ? '301' : '302',
      Protocol: pluginOptions.protocol,
      HostName: pluginOptions.hostname
    };
    return route.fromPath.endsWith('*') ? {
      Condition: {
        // doing route.toPath.substring here is sort of (w)hack. https://i.giphy.com/media/iN5qfn8S2qVgI/giphy.webp
        // the syntax that gatsby invented here does not work with routing rules.
        // routing rules syntax is `/app/` not `/app/*` (it's basically prefix by default)
        KeyPrefixEquals: (0, _util.withoutLeadingSlash)(route.fromPath.substring(0, route.fromPath.length - 1))
      },
      Redirect: _objectSpread({
        ReplaceKeyPrefixWith: (0, _util.withTrailingSlash)((0, _util.withoutLeadingSlash)(route.toPath))
      }, alwaysTheSame)
    } : {
      Condition: {
        KeyPrefixEquals: (0, _util.withoutLeadingSlash)(route.fromPath),
        HttpErrorCodeReturnedEquals: '404'
      },
      Redirect: _objectSpread({
        ReplaceKeyWith: (0, _util.withoutLeadingSlash)(route.toPath)
      }, alwaysTheSame)
    };
  });
};

var params = {};

var onPreBootstrap = function onPreBootstrap(_ref, _ref2) {
  var reporter = _ref.reporter;
  var bucketName = _ref2.bucketName;

  if (!bucketName) {
    reporter.panic(`
      "bucketName" is a required option for gatsby-plugin-s3
      See docs here - https://github.com/jariz/gatsby-plugin-s3
      `);
    process.exit(1);
  }

  params = {};
}; // I have no understanding of what createPagesStatefully is supposed to accomplish.
// all I know is that it's being ran after createPages which is what I need to create pages after the other plugins have.


exports.onPreBootstrap = onPreBootstrap;

var createPagesStatefully = function createPagesStatefully(_ref3, userPluginOptions) {
  var store = _ref3.store,
      createPage = _ref3.actions.createPage;

  var pluginOptions = _objectSpread({}, _constants.DEFAULT_OPTIONS, userPluginOptions);

  var _store$getState = store.getState(),
      redirects = _store$getState.redirects,
      pages = _store$getState.pages;

  if (pluginOptions.generateIndexPageForRedirect) {
    var indexRedirect = redirects.find(function (redirect) {
      return redirect.fromPath === '/';
    });
    var indexPage = Array.from(pages.values()).find(function (page) {
      return page.path === '/';
    });

    if (indexRedirect) {
      if (!indexPage) {
        // no index page yet, create one so we can add a redirect to it's metadata when uploading
        createPage({
          path: '/',
          component: _path.default.join(__dirname, './fake-index.js')
        });
      }

      params = _objectSpread({}, params, {
        'index.html': {
          WebsiteRedirectLocation: indexRedirect.toPath
        }
      });
    }
  }
};

exports.createPagesStatefully = createPagesStatefully;

var onPostBuild = function onPostBuild(_ref4, userPluginOptions) {
  var store = _ref4.store;

  var pluginOptions = _objectSpread({}, _constants.DEFAULT_OPTIONS, userPluginOptions);

  var _store$getState2 = store.getState(),
      redirects = _store$getState2.redirects,
      pages = _store$getState2.pages,
      program = _store$getState2.program;

  var rewrites = [];

  if (pluginOptions.generateMatchPathRewrites) {
    rewrites = Array.from(pages.values()).filter(function (page) {
      return !!page.matchPath && page.matchPath !== page.path;
    }).map(function (page) {
      return {
        fromPath: page.matchPath,
        toPath: page.path
      };
    });
  }

  if (pluginOptions.mergeCachingParams) {
    params = _objectSpread({}, params, _constants.CACHING_PARAMS);
  }

  params = _objectSpread({}, params, pluginOptions.params);
  var routingRules = [].concat(_toConsumableArray(getRules(pluginOptions, redirects.filter(function (redirect) {
    return redirect.fromPath !== '/';
  }))), _toConsumableArray(getRules(pluginOptions, rewrites)));
  var slsRoutingRules = routingRules.map(function (_ref5) {
    var Redirect = _ref5.Redirect,
        Condition = _ref5.Condition;
    return {
      RoutingRuleCondition: Condition,
      RedirectRule: Redirect
    };
  });

  _fs.default.writeFileSync(_path.default.join(program.directory, './.cache/s3.routingRules.json'), JSON.stringify(routingRules));

  _fs.default.writeFileSync(_path.default.join(program.directory, './.cache/s3.sls.routingRules.json'), JSON.stringify(slsRoutingRules));

  _fs.default.writeFileSync(_path.default.join(program.directory, './.cache/s3.params.json'), JSON.stringify(params));

  _fs.default.writeFileSync(_path.default.join(program.directory, './.cache/s3.config.json'), JSON.stringify(pluginOptions));
};

exports.onPostBuild = onPostBuild;