/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {UrlTree} from './url_tree';

/**
 * @description
 *
 * Provides a way to migrate AngularJS applications to Angular.
 */
export abstract class UrlHandlingStrategy {
  /**
   * Tells the router if this URL should be processed.
   *
   * When it returns true, the router will execute the regular navigation.
   * When it returns false, the router will set the router state to an empty state.
   * As a result, all the active components will be destroyed.
   *
   */
  abstract shouldProcessUrl(url: UrlTree): boolean;

  /**
   * Extracts the part of the URL that should be handled by the router.
   * The rest of the URL will remain untouched.
   */
  abstract extract(url: UrlTree): UrlTree;

  /**
   * Merges the URL fragment with the rest of the URL.
   */
  abstract merge(newUrlPart: UrlTree, rawUrl: UrlTree): UrlTree;
}

export class DefaultUrlHandlingStrategy implements UrlHandlingStrategy {
  shouldProcessUrl(url: UrlTree): boolean { return true; }
  extract(url: UrlTree): UrlTree { return url; }
  merge(newUrlPart: UrlTree, wholeUrl: UrlTree): UrlTree { return newUrlPart; }
}