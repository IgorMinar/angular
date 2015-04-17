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

type TreeDiff = string[];

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
    console.log('>>>> rebuild <<<');

    let skipDiffLog = false;

    if (!this.initialized) {
      // just simlink the input and output tree without changing anything
      if (fs.existsSync(this.inputPath)) {
        this.initialized = true;
        skipDiffLog = true;
        fs.rmdirSync(this.outputPath);
        symlinkOrCopy.sync(this.inputPath, this.outputPath);
      }
    }

    let startTimeMs = Date.now();
    let treeDiff:TreeDiff = this.treeWalkSync(this.inputPath, this.dirtyCheck.bind(this));
    let durationMs = Date.now() - startTimeMs;

    console.log('FS dirty check done in %d ms', durationMs);
    if (!skipDiffLog) {
      console.log('Tree diff detected!', `[\n  ${treeDiff.join('\n  ')}\n]`);
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
    fs.readdirSync(rootDir).forEach((segment) => {
      let absolutePath = path.join(rootDir, segment);
      let pathStat = fs.statSync(absolutePath);

      if (pathStat.isDirectory()) {
        this.treeWalkSync(absolutePath, fileAction, result);
      } else {
        if (fileAction(absolutePath, pathStat)) {
          result.push(absolutePath);
        }
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
