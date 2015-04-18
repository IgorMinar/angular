/// <reference path="../typings/es6-promise/es6-promise.d.ts" />


interface BroccoliTree {

  /**
   * Contains the fs path for the input tree when the plugin takes only one input tree.
   *
   * For plugins that take multiple trees see the `inputPaths` property.
   *
   * This property is set just before the first rebuild and doesn't afterwards.
   */
  inputPath: string;

  /**
   * Contains the array of fs paths for input trees.
   *
   * For plugins that take only one input tree, it might be more convenient to use the `inputPath` property instead.
   *
   * This property is set just before the first rebuild and doesn't afterwards.
   *
   * If the inputPath is outside of broccoli's temp directory, then it's lifetime is not managed by the builder.
   * If the inputPath is within broccoli's temp directory it is an outputPath (and output directory) of another plugin.
   * This means that while the `outputPath` doesn't change, the underlying directory is frequently recreated.
   */
  inputPaths?: string[];

  /**
   * Contains the fs paths for the output trees.
   *
   * This property is set just before the first rebuild and doesn't afterwards.
   *
   * The underlying directory is also created by the builder just before the first rebuild.
   * This directory is destroyed and recreated upon each rebuild.
   */
  outputPath?: string;

  /**
   * Contains the fs paths for a cache directory available to the plugin.
   *
   * This property is set just before the first rebuild and doesn't afterwards.
   *
   * The underlying directory is also created by the builder just before the first rebuild.
   * The lifetime of the directory is associated with the lifetime of the plugin.
   */
  cachePath?: string;

  inputTree?: BroccoliTree;
  inputTrees?: BroccoliTree[];

  rebuild(): (Promise<any> | void);
  cleanup(): void;
}


interface OldBroccoliTree {
  read?(readTree:(tree:BroccoliTree) => Promise<string>): (Promise<string> | string);
}
