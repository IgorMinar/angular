/// <reference path="../typings/es6-promise/es6-promise.d.ts" />


interface BroccoliTree {
  inputPath?: string;
  inputPaths?: string[];
  outputPath: string;
  cachePath: string;
  inputTree?: BroccoliTree;
  inputTrees?: BroccoliTree[];

  read?(readTree: (tree: BroccoliTree) => Promise<string>): (Promise<string> | string);
  rebuild(): (Promise<any> | void);
  cleanup(): void;
}
