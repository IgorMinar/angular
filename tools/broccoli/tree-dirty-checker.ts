/// <reference path="../typings/node/node.d.ts" />

import fs = require('fs');
import path = require('path');


export = TreeDirtyChecker;

class TreeDirtyChecker {

  private fingerprints: {[key: string]: string} = Object.create(null);
  private nextFingerPrints: {[key: string]: string} = Object.create(null);
  private rootDirName: string;

  constructor(private rootPath: string) {
    this.rootDirName = path.basename(rootPath);
  }


  // TODO: detect file deletion - rebuild fingerprints on each check?
  public checkTree() : DiffResult {
    let result = new DiffResult(this.rootDirName);
    this.dirtyCheckPath(this.rootPath, result);
    this.detectDeletionsAndUpdateFingerprints(result);
    result.endTime = Date.now();
    return result;
  }


  private dirtyCheckPath(rootDir: string, result: DiffResult) {
    fs.readdirSync(rootDir).forEach((segment) => {
      let absolutePath = path.join(rootDir, segment);
      let pathStat = fs.statSync(absolutePath);

      if (pathStat.isDirectory()) {
        result.directoriesChecked++;
        this.dirtyCheckPath(absolutePath, result);
      } else {
        result.filesChecked++;
        if (this.isFileDirty(absolutePath, pathStat)) {
          result.changedPaths.push(path.relative(this.rootPath, absolutePath));
        }
      }
    });

    return result;
  }


  private isFileDirty(path: string, stat: fs.Stats): boolean {
    let oldFingerprint = this.fingerprints[path];
    let newFingerprint = `${stat.mtime.getTime()} # ${stat.size}`;

    if (oldFingerprint === newFingerprint) {
      // nothing changed
      return false;
    }

    this.fingerprints[path] = null;
    this.nextFingerPrints[path] = newFingerprint;

    return true;
  }


  private detectDeletionsAndUpdateFingerprints(result: DiffResult) {
    for (let filepath in this.fingerprints) {
      if (this.fingerprints[filepath] !== null) {
        result.removedPaths.push(filepath);
      }
    }

    this.fingerprints = this.nextFingerPrints;
  }
}


class DiffResult {
  public filesChecked: number = 0;
  public directoriesChecked: number = 0;
  public changedPaths: string[] = [];
  public removedPaths: string[] = [];
  public startTime: number = Date.now();
  public endTime: number = null;

  constructor(public name: string) {}

  toString() {
    return `${pad(this.name, 40)}, ` +
      `duration: ${pad(this.endTime - this.startTime, 5)}ms, ` +
      `${pad(this.changedPaths.length + this.removedPaths.length, 5)} changes detected ` +
      `(files: ${pad(this.filesChecked, 5)}, directories: ${pad(this.directoriesChecked, 4)})`;
  }

  log(verbose) {
    console.log(`FS dirty check: ${this}` +
                ((verbose && (this.changedPaths.length || this.removedPaths.length)) ?
                  ` [\n  ${this.changedPaths.join('\n  ')}` +
                  `\n  ${this.removedPaths.join('\n  ')}\n]` : '' ));
  }
}


function pad(value, length) {
  value = '' + value;
  let whitespaceLength = (value.length < length) ? length - value.length : 0;
  whitespaceLength = whitespaceLength + 1;
  return new Array(whitespaceLength).join(' ') + value;
}
