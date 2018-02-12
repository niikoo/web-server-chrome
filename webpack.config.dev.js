var path = require('path');
var nodeModulesPath = __dirname + '/node_modules';
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');
var fs = require('fs');
var glob = require('glob');
var minimatch = require("minimatch");

function globArray(patterns, options) {
  var i, list = [];
  if (!Array.isArray(patterns)) {
    patterns = [patterns];
  }

  patterns.forEach(function (pattern) {
    if (pattern[0] === "!") {
      i = list.length - 1;
      while (i > -1) {
        if (!minimatch(list[i], pattern)) {
          list.splice(i, 1);
        }
        i--;
      }

    }
    else {
      var newList = glob.sync(pattern, options);
      newList.forEach(function (item) {
        if (list.indexOf(options.cwd + item) === -1) {
          list.push(options.cwd + item);
        }
      });
    }
  });

  return list;
}

var regExcludes = [/\.d\.ts$/];

var config = {
  devtool: 'inline-source-map',
  entry: {
    "./": globArray(["**/*.ts", "!**/*.d.ts"], { cwd: path.resolve(__dirname) + '/' }),
  },
  output: {
    path: path.resolve(__dirname),
    filename: 'wsc-chrome.js'
  },
  resolve: {
    // Add '.ts' and '.tsx' as a resolvable extension.
    extensions: [".ts", ".tsx"]
  },
  module: {
    /*rules: [
      {
        test: /\.ts$/,
        enforce: "pre",
        exclude: /node_modules/,
        loader: "tslint-loader",
        options: {
          emitError: true,
          outputReport: true,
          configFile: 'tslint.json'
        }
      }
    ],*/
    loaders: [
      // all files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
      {
        test: /\.ts?$/,
        loader: [
          { loader: "awesome-typescript-loader", options: { configFileName: path.resolve(__dirname, 'tsconfig.json') } }
        ],
        exclude: [/node_modules/, nodeModulesPath]
      }
    ]
  },
  plugins: [
    /*new UglifyJSPlugin({
      uglifyOptions: {
        ie8: false,
        ecma: 8,
        output: {
          comments: false,
          beautify: false
        }
      }
    }),*/
  ]
};
module.exports = config;
