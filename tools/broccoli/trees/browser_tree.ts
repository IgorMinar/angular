'use strict';

var Funnel = require('broccoli-funnel');
var htmlReplace = require('../html-replace');
var jsReplace = require('../js-replace');
var path = require('path');
var stew = require('broccoli-stew');

import destCopy from '../broccoli-dest-copy';
import flatten from '../broccoli-flatten';
import mergeTrees from '../broccoli-merge-trees';
import replace from '../broccoli-replace';
import checkImports from '../broccoli-check-imports';


const kServedPaths = [
  // Relative (to /modules) paths to benchmark directories
  'benchmarks/src',
  'benchmarks/src/change_detection',
  'benchmarks/src/compiler',
  'benchmarks/src/costs',
  'benchmarks/src/di',
  'benchmarks/src/element_injector',
  'benchmarks/src/largetable',
  'benchmarks/src/naive_infinite_scroll',
  'benchmarks/src/tree',
  'benchmarks/src/static_tree',

  // Relative (to /modules) paths to external benchmark directories
  'benchmarks_external/src',
  'benchmarks_external/src/compiler',
  'benchmarks_external/src/largetable',
  'benchmarks_external/src/naive_infinite_scroll',
  'benchmarks_external/src/tree',
  'benchmarks_external/src/tree/react',
  'benchmarks_external/src/static_tree',

  // Relative (to /modules) paths to example directories
  'playground/src/animate',
  'playground/src/benchpress',
  'playground/src/model_driven_forms',
  'playground/src/template_driven_forms',
  'playground/src/person_management',
  'playground/src/order_management',
  'playground/src/gestures',
  'playground/src/hash_routing',
  'playground/src/hello_world',
  'playground/src/http',
  'playground/src/jsonp',
  'playground/src/key_events',
  'playground/src/relative_assets',
  'playground/src/routing',
  'playground/src/alt_routing',
  'playground/src/sourcemap',
  'playground/src/svg',
  'playground/src/todo',
  'playground/src/upgrade',
  'playground/src/zippy_component',
  'playground/src/async',
  'playground/src/web_workers/kitchen_sink',
  'playground/src/web_workers/todo',
  'playground/src/web_workers/images',
  'playground/src/web_workers/message_broker',
  'playground/src/web_workers/router',
  'playground/src/web_workers/input'
];


module.exports = function makeBrowserTree(options, destinationPath) {
  const modules = options.projects;

  var scriptPathPatternReplacement = {
    match: '@@PATH',
    replacement: function(replacement, relativePath) {
      var parts = relativePath.replace(/\\/g, '/').split('/');
      return parts.splice(0, parts.length - 1).join('/');
    }
  };

  var scriptFilePatternReplacement = {
    match: '@@FILENAME',
    replacement: function(replacement, relativePath) {
      var parts = relativePath.replace(/\\/g, '/').split('/');
      return parts[parts.length - 1].replace('html', 'js');
    }
  };

  var useBundlesPatternReplacement = {
    match: '@@USE_BUNDLES',
    replacement: function(replacement, relativePath) { return useBundles; }
  };

  modulesTree = replace(modulesTree, {
    files: ["playground*/**/*.js"],
    patterns: [{match: /\$SCRIPTS\$/, replacement: jsReplace('SCRIPTS')}]
  });

  var vendorScriptsTree = flatten(new Funnel('.', {
    files: [
      'node_modules/es6-shim/es6-shim.js',
      'node_modules/zone.js/dist/zone.js',
      'node_modules/zone.js/dist/long-stack-trace-zone.js',
      'node_modules/systemjs/dist/system.src.js',
      'node_modules/base64-js/lib/b64.js',
      'node_modules/reflect-metadata/Reflect.js'
    ]
  }));

  var vendorScripts_benchmark =
      new Funnel('tools/build/snippets', {files: ['url_params_to_form.js'], destDir: '/'});
  var vendorScripts_benchmarks_external =
      new Funnel('node_modules/angular', {files: ['angular.js'], destDir: '/'});

  // Get scripts for each benchmark or example
  let servingTrees = kServedPaths.reduce(getServedFunnels, []);
  function getServedFunnels(funnels, destDir) {
    let options = {srcDir: '/', destDir: destDir};
    funnels.push(new Funnel(vendorScriptsTree, options));
    if (destDir.indexOf('benchmarks') > -1) {
      funnels.push(new Funnel(vendorScripts_benchmark, options));
    }
    if (destDir.indexOf('benchmarks_external') > -1) {
      funnels.push(new Funnel(vendorScripts_benchmarks_external, options));
    }
    return funnels;
  }


  if (modules.benchmarks || modules.benchmarks_external || modules.playground) {
    var assetsTree = new Funnel(
        modulesTree, {include: ['**/*'], exclude: ['**/*.{html,ts,dart}'], destDir: '/'});
  }

  var htmlTree = new Funnel(modulesTree, {
    include: ['*/src/**/*.html', '**/playground/**/*.html', '**/payload_tests/**/ts/**/*.html'],
    destDir: '/'
  });

  if (modules.playground) {
    htmlTree = replace(htmlTree, {
      files: ['playground*/**/*.html'],
      patterns: [
        {match: /\$SCRIPTS\$/, replacement: htmlReplace('SCRIPTS')},
        scriptPathPatternReplacement,
        scriptFilePatternReplacement,
        useBundlesPatternReplacement
      ]
    });
  }

  if (modules.benchmarks) {
    htmlTree = replace(htmlTree, {
      files: ['benchmarks/**'],
      patterns: [
        {match: /\$SCRIPTS\$/, replacement: htmlReplace('SCRIPTS_benchmarks')},
        scriptPathPatternReplacement,
        scriptFilePatternReplacement,
        useBundlesPatternReplacement
      ]
    });
  }

  if (modules.benchmarks_external) {
    htmlTree = replace(htmlTree, {
      files: ['benchmarks_external/**'],
      patterns: [
        {match: /\$SCRIPTS\$/, replacement: htmlReplace('SCRIPTS_benchmarks_external')},
        scriptPathPatternReplacement,
        scriptFilePatternReplacement,
        useBundlesPatternReplacement
      ]
    });
  }

  if (modules.playground) {
    // We need to replace the regular angular bundle with the web-worker bundle
    // for web-worker e2e tests.
    htmlTree = replace(htmlTree, {
      files: ['playground*/**/web_workers/**/*.html'],
      patterns: [{match: "/bundle/angular2.dev.js", replacement: "/bundle/web_worker/ui.dev.js"}]
    });
  }

  if (modules.benchmarks || modules.benchmarks_external) {
    var scripts = mergeTrees(servingTrees);
  }

  if (modules.benchmarks_external) {
    var polymerFiles = new Funnel('.', {
      files: [
        'bower_components/polymer/polymer.html',
        'bower_components/polymer/polymer-micro.html',
        'bower_components/polymer/polymer-mini.html',
        'tools/build/snippets/url_params_to_form.js'
      ]
    });
    var polymer = stew.mv(flatten(polymerFiles), 'benchmarks_external/src/tree/polymer');

    var reactFiles = new Funnel('.', {files: ['node_modules/react/dist/react.min.js']});
    var react = stew.mv(flatten(reactFiles), 'benchmarks_external/src/tree/react');
  }


  var mergedTree = mergeTrees([es6Tree, es5Tree]);
  return destCopy(mergedTree, destinationPath);
};
