#!/usr/bin/env node
"use strict";

require("@babel/polyfill");

var _s = _interopRequireDefault(require("aws-sdk/clients/s3"));

var _yargs = _interopRequireDefault(require("yargs"));

var _constants = require("./constants");

var _fsExtra = require("fs-extra");

var _klaw = _interopRequireDefault(require("klaw"));

var _prettyError = _interopRequireDefault(require("pretty-error"));

var _streamToPromise = _interopRequireDefault(require("stream-to-promise"));

var _ora = _interopRequireDefault(require("ora"));

var _chalk = _interopRequireDefault(require("chalk"));

var _path = require("path");

var _fs = _interopRequireDefault(require("fs"));

var _minimatch = _interopRequireDefault(require("minimatch"));

var _mime = _interopRequireDefault(require("mime"));

var _inquirer = _interopRequireDefault(require("inquirer"));

var _awsSdk = require("aws-sdk");

var _crypto = require("crypto");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var cli = (0, _yargs.default)();
var pe = new _prettyError.default();
var OBJECTS_TO_REMOVE_PER_REQUEST = 1000;

var guessRegion = function guessRegion(s3, constraint) {
  return constraint || s3.config.region || _awsSdk.config.region;
};

var getBucketInfo =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(config, s3) {
    var _ref2, $response, detectedRegion;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return s3.getBucketLocation({
              Bucket: config.bucketName
            }).promise();

          case 3:
            _ref2 = _context.sent;
            $response = _ref2.$response;
            detectedRegion = guessRegion(s3, $response.data && $response.data.LocationConstraint);
            return _context.abrupt("return", {
              exists: true,
              region: detectedRegion
            });

          case 9:
            _context.prev = 9;
            _context.t0 = _context["catch"](0);

            if (!(_context.t0.code === 'NoSuchBucket')) {
              _context.next = 15;
              break;
            }

            return _context.abrupt("return", {
              exists: false,
              region: guessRegion(s3)
            });

          case 15:
            throw _context.t0;

          case 16:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[0, 9]]);
  }));

  return function getBucketInfo(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var getParams = function getParams(path, params) {
  var returned = {};

  var _arr = Object.keys(params);

  for (var _i = 0; _i < _arr.length; _i++) {
    var key = _arr[_i];

    if ((0, _minimatch.default)(path, key)) {
      returned = _objectSpread({}, params[key]);
    }
  }

  return returned;
};

var listAllObjects =
/*#__PURE__*/
function () {
  var _ref3 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(s3, bucketName, token) {
    var list, response;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            list = [];
            _context2.next = 3;
            return s3.listObjectsV2({
              Bucket: bucketName,
              ContinuationToken: token
            }).promise();

          case 3:
            response = _context2.sent;

            if (response.Contents) {
              list.push.apply(list, _toConsumableArray(response.Contents));
            }

            if (!response.NextContinuationToken) {
              _context2.next = 14;
              break;
            }

            _context2.t0 = list.push;
            _context2.t1 = list;
            _context2.t2 = _toConsumableArray;
            _context2.next = 11;
            return listAllObjects(s3, bucketName, response.NextContinuationToken);

          case 11:
            _context2.t3 = _context2.sent;
            _context2.t4 = (0, _context2.t2)(_context2.t3);

            _context2.t0.apply.call(_context2.t0, _context2.t1, _context2.t4);

          case 14:
            return _context2.abrupt("return", list);

          case 15:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function listAllObjects(_x3, _x4, _x5) {
    return _ref3.apply(this, arguments);
  };
}();

var deploy =
/*#__PURE__*/
function () {
  var _ref5 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee4(_ref4) {
    var yes, spinner, _config, params, routingRules, s3, _ref6, _exists, _region, _ref7, confirm, _params, websiteConfig, objects, dir, stream, promises, isKeyInUse, objectsToRemove, i, objectsToRemoveInThisRequest;

    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            yes = _ref4.yes;
            spinner = (0, _ora.default)({
              text: 'Retrieving bucket info...',
              color: 'magenta'
            }).start();
            _context4.prev = 2;
            _context4.next = 5;
            return (0, _fsExtra.readJson)(_constants.CACHE_FILES.config);

          case 5:
            _config = _context4.sent;
            _context4.next = 8;
            return (0, _fsExtra.readJson)(_constants.CACHE_FILES.params);

          case 8:
            params = _context4.sent;
            _context4.next = 11;
            return (0, _fsExtra.readJson)(_constants.CACHE_FILES.routingRules);

          case 11:
            routingRules = _context4.sent;
            s3 = new _s.default({
              region: _config.region
            });
            _context4.next = 15;
            return getBucketInfo(_config, s3);

          case 15:
            _ref6 = _context4.sent;
            _exists = _ref6.exists;
            _region = _ref6.region;

            if (yes) {
              _context4.next = 28;
              break;
            }

            spinner.stop();
            console.log(_chalk.default`
    {underline Please review the following:} ({dim pass -y next time to skip this})

    Deploying to bucket: {cyan.bold ${_config.bucketName}}
    In region: {yellow.bold ${_region || 'UNKNOWN!'}}
    Gatsby will: ${!_exists ? _chalk.default`{bold.greenBright CREATE}` : _chalk.default`{bold.blueBright UPDATE} {dim (any existing website configuration will be overwritten!)}`}
`);
            _context4.next = 23;
            return _inquirer.default.prompt([{
              message: 'OK?',
              name: 'confirm',
              type: 'confirm'
            }]);

          case 23:
            _ref7 = _context4.sent;
            confirm = _ref7.confirm;

            if (confirm) {
              _context4.next = 27;
              break;
            }

            throw new Error('User aborted!');

          case 27:
            spinner.start();

          case 28:
            spinner.text = 'Configuring bucket...';
            spinner.color = 'yellow';

            if (_exists) {
              _context4.next = 35;
              break;
            }

            _params = {
              Bucket: _config.bucketName,
              ACL: _config.acl === null ? undefined : _config.acl || 'public-read'
            };

            if (_config.region) {
              _params['CreateBucketConfiguration'] = {
                LocationConstraint: _config.region
              };
            }

            _context4.next = 35;
            return s3.createBucket(_params).promise();

          case 35:
            websiteConfig = {
              Bucket: _config.bucketName,
              WebsiteConfiguration: {
                IndexDocument: {
                  Suffix: 'index.html'
                },
                ErrorDocument: {
                  Key: '404.html'
                }
              }
            };

            if (routingRules.length) {
              websiteConfig.WebsiteConfiguration.RoutingRules = routingRules;
            }

            _context4.next = 39;
            return s3.putBucketWebsite(websiteConfig).promise();

          case 39:
            spinner.text = 'Listing objects...';
            spinner.color = 'green';
            _context4.next = 43;
            return listAllObjects(s3, _config.bucketName);

          case 43:
            objects = _context4.sent;
            spinner.color = 'cyan';
            spinner.text = 'Syncing...';
            dir = (0, _path.join)(process.cwd(), 'public');
            stream = (0, _klaw.default)(dir);
            promises = [];
            isKeyInUse = {};
            stream.on('data',
            /*#__PURE__*/
            function () {
              var _ref9 = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee3(_ref8) {
                var path, stats, key, buffer, tag, object, promise;
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        path = _ref8.path, stats = _ref8.stats;

                        if (stats.isFile()) {
                          _context3.next = 3;
                          break;
                        }

                        return _context3.abrupt("return");

                      case 3:
                        key = (0, _path.relative)(dir, path);
                        _context3.next = 6;
                        return (0, _fsExtra.readFile)(path);

                      case 6:
                        buffer = _context3.sent;
                        tag = `"${(0, _crypto.createHash)('md5').update(buffer).digest('hex')}"`;
                        object = objects.find(function (object) {
                          return object.Key === key && object.ETag === tag;
                        });
                        isKeyInUse[key] = true;

                        if (!object) {
                          _context3.next = 12;
                          break;
                        }

                        return _context3.abrupt("return");

                      case 12:
                        _context3.prev = 12;
                        promise = s3.upload(_objectSpread({
                          Key: key,
                          Body: _fs.default.createReadStream(path),
                          Bucket: _config.bucketName,
                          ContentType: _mime.default.getType(key) || 'application/octet-stream',
                          ContentMD5: (0, _crypto.createHash)('md5').update(buffer).digest('base64'),
                          ACL: _config.acl === null ? undefined : _config.acl || 'public-read'
                        }, getParams(key, params))).promise();
                        promises.push(promise);
                        _context3.next = 17;
                        return promise;

                      case 17:
                        spinner.text = _chalk.default`Syncing...\n{dim   Uploaded {cyan ${key}}}`;
                        _context3.next = 25;
                        break;

                      case 20:
                        _context3.prev = 20;
                        _context3.t0 = _context3["catch"](12);
                        spinner.fail(_chalk.default`Upload failure for object {cyan ${key}}`);
                        console.error(pe.render(_context3.t0));
                        process.exit(1);

                      case 25:
                      case "end":
                        return _context3.stop();
                    }
                  }
                }, _callee3, this, [[12, 20]]);
              }));

              return function (_x7) {
                return _ref9.apply(this, arguments);
              };
            }()); // now we play the waiting game.

            _context4.next = 53;
            return (0, _streamToPromise.default)(stream);

          case 53:
            _context4.next = 55;
            return Promise.all(promises);

          case 55:
            if (!_config.removeNonexistentObjects) {
              _context4.next = 66;
              break;
            }

            objectsToRemove = objects.map(function (obj) {
              return {
                Key: obj.Key
              };
            }).filter(function (obj) {
              return obj.Key && !isKeyInUse[obj.Key];
            });
            i = 0;

          case 58:
            if (!(i < objectsToRemove.length)) {
              _context4.next = 66;
              break;
            }

            objectsToRemoveInThisRequest = objectsToRemove.slice(i, i + OBJECTS_TO_REMOVE_PER_REQUEST);
            spinner.text = `Removing objects ${i + 1} to ${i + objectsToRemoveInThisRequest.length} of ${objectsToRemove.length}`;
            _context4.next = 63;
            return s3.deleteObjects({
              Bucket: _config.bucketName,
              Delete: {
                Objects: objectsToRemoveInThisRequest,
                Quiet: true
              }
            }).promise();

          case 63:
            i += OBJECTS_TO_REMOVE_PER_REQUEST;
            _context4.next = 58;
            break;

          case 66:
            spinner.succeed('Synced.');
            console.log(_chalk.default`
        {bold Your website is online at:}
        {blue.underline http://${_config.bucketName}.s3-website-${_region || 'us-east-1'}.amazonaws.com}
`);
            _context4.next = 74;
            break;

          case 70:
            _context4.prev = 70;
            _context4.t0 = _context4["catch"](2);
            spinner.fail('Failed.');
            console.error(pe.render(_context4.t0));

          case 74:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this, [[2, 70]]);
  }));

  return function deploy(_x6) {
    return _ref5.apply(this, arguments);
  };
}();

cli.command('deploy', 'Deploy bucket. If it doesn\'t exist, it will be created. Otherwise, it will be updated.', function (args) {
  return args.option('yes', {
    alias: 'y',
    describe: 'Skip confirmation prompt',
    boolean: true
  });
}, deploy).wrap(cli.terminalWidth()).demandCommand(1, `Pass --help to see all available commands and options.`).strict().showHelpOnFail(true).recommendCommands().parse(process.argv.slice(2));