import { InjectionToken } from '@angular/core';

// These are hard-coded component selectors that correspond to embedded components.
// (Embedded components are created "manually", i.e. not as part of a component's template.)
export const embeddedSelectorsToken = new InjectionToken<string[]>('EmbeddedSelectors');
export const embeddedSelectors = [
  'aio-api-list',
  'aio-contributor-list',
  'aio-resource-list',
  'code-example',
  'code-tabs',
  'current-location',
  'live-example',
];

export const embeddedSelectorsProvider = {
  provide: embeddedSelectorsToken,
  useValue: embeddedSelectors,
};
