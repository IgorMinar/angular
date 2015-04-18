/// <reference path="broccoli.d.ts" />
/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/fs-extra/fs-extra.d.ts" />

import fs = require('fs');
import fse = require('fs-extra');
import path = require('path');
import TreeDirtyChecker = require('./tree-dirty-checker');

let symlinkOrCopy = require('symlink-or-copy');
let mkdirpSync = fse.mkdirpSync;

interface FromToMapping {
  firstname: string;
  lastname: string;
}


export = function multiMove(tree: BroccoliTree, fromToMapping: FromToMapping) {
  return new MultiMove(tree, fromToMapping);
}


class MultiMove implements BroccoliTree {

  treeDirtyChecker: TreeDirtyChecker;
  initialized = false;

  // props monkey-patched by broccoli builder:
  inputPath = null;
  cachePath = null;
  outputPath = null;


  constructor(public inputTree: BroccoliTree,
              private fromToMapping: FromToMapping) {
  }


  rebuild() {
    let firstRun = !this.initialized;
    this.init();

    // just symlink the input and output tree without changing anything
    // we are just logging the diff for now
    if (fs.existsSync(this.inputPath)) {
      fs.rmdirSync(this.outputPath);
      symlinkOrCopy.sync(this.inputPath, this.outputPath);
    }

    let diffResult = this.treeDirtyChecker.checkTree();
    diffResult.log(!firstRun);
  }


  cleanup() {}


  private init() {
    if (!this.initialized) {
      this.initialized = true;
      // now that we finally have a path, let's initialize the dirtyChecker
      this.treeDirtyChecker = new TreeDirtyChecker(this.inputPath);
    }
  }


  private copy(sourcePath, destPath) {
    var destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      mkdirpSync(destDir);
    }

    symlinkOrCopy.sync(sourcePath, destPath);
  }
}
