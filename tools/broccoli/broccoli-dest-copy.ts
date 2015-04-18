/// <reference path="./broccoli.d.ts" />
/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/fs-extra/fs-extra.d.ts" />

import fse = require('fs-extra');
import path = require('path');
import TreeDirtyChecker = require('./tree-dirty-checker');

/**
 * Intercepts each file as it is copied to the destination tempdir,
 * and tees a copy to the given path outside the tmp dir.
 */
// TODO: handle file removal
export = function destCopy(inputTree, outputRoot) {
  return new DestCopy(inputTree, outputRoot);
}


class DestCopy implements BroccoliTree {

  treeDirtyChecker: TreeDirtyChecker;
  initialized = false;

  // props monkey-patched by broccoli builder:
  inputPath = null;
  cachePath = null;
  outputPath = null;


  constructor(public inputTree: BroccoliTree,
              public outputRoot: string) {}


  rebuild() {
    let firstRun = !this.initialized;
    this.init();

    let diffResult = this.treeDirtyChecker.checkTree();
    diffResult.log(!firstRun);

    diffResult.diff.forEach((changedFilePath) => {
      var destFilePath = path.join(this.outputRoot, changedFilePath);

      var destDirPath = path.dirname(destFilePath);
      fse.mkdirsSync(destDirPath);
      fse.copySync(path.join(this.inputPath, changedFilePath), destFilePath);
      console.log(`>>>> ${destFilePath}`);
    });
  }


  private init() {
    if (!this.initialized) {
      this.initialized = true;
      this.treeDirtyChecker = new TreeDirtyChecker(this.inputPath);
    }
  }


  cleanup() {}
}
