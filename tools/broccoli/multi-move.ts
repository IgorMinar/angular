/// <reference path="broccoli.d.ts" />
/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/fs-extra/fs-extra.d.ts" />

var fs = require('fs');
var mkdirp = require('fs-extra').mkdirp;
var path = require('path');
var symlinkOrCopy = require('symlink-or-copy');


interface FromToMapping {
  firstname: string;
  lastname: string;
}

interface FingerprintMap {}

interface TreeDiff {
  [index: number]: string;
}

class MultiMove implements BroccoliTree {

  inputTree: BroccoliTree;
  fromToMappings: FromToMapping;
  inputPath = null;
  cachePath = null;
  outputPath = null;
  fingerprints:FingerprintMap = Object.create(null);
  initialized = false;

  constructor(tree: BroccoliTree, fromToMapping: FromToMapping) {
    this.inputTree = tree;
    this.fromToMappings = fromToMapping;
  }

  rebuild() {
    console.log('>>>> rebuild');
    console.log('input path: ', this.inputPath);
    console.log('cache path: ', this.cachePath);
    console.log('output path: ', this.outputPath);

    let skipDiffLog = false;

    if (!this.initialized) {
      // just simplink the input and output tree without changing anything
      if (fs.existsSync(this.inputPath)) {
        this.initialized = true;
        skipDiffLog = true;
        fs.rmdirSync(this.outputPath);
        symlinkOrCopy.sync(this.inputPath, this.outputPath);
      }
    }

    let treeDiff: TreeDiff = this.treeWalkSync(this.inputPath, this.dirtyCheck.bind(this));

    if (!skipDiffLog) {
      console.log('Tree diff detected!', treeDiff);
    }

  }

  cleanup() {
    console.log('>>>> cleanup', arguments);
  }


  private copy(sourcePath, destPath) {
    var destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      mkdirp.sync(destDir);
    }

    symlinkOrCopy.sync(sourcePath, destPath);
  }

  private treeWalkSync(rootDir: string, fileAction: (string, stat) => boolean, result = []) {
    console.log('walk', rootDir);
    fs.readdirSync(rootDir).forEach((segment) => {
      let relativePath = path.join(rootDir, segment);
      let pathStat = fs.statSync(relativePath);

      if (pathStat.isDirectory()) {
        this.treeWalkSync(relativePath, fileAction, result);
      }

      if (fileAction(relativePath, pathStat)) {
        result.push(relativePath);
      }
    });

    return result;
  }


  private dirtyCheck(path, stat) {
    let oldFingerprint = this.fingerprints[path];
    let newFingerprint = `${stat.mtime.getTime()} # ${stat.size}`;

    if (oldFingerprint === newFingerprint) {
      // nothing changed
      return false;
    }

    this.fingerprints[path] = newFingerprint;

    return true;
  }
}

export = function multiMove(tree: BroccoliTree, fromToMapping: FromToMapping) {
  return new MultiMove(tree, fromToMapping);
}
