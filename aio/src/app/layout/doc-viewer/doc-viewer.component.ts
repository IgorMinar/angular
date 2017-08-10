import {
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  DoCheck,
  ElementRef,
  EventEmitter,
  Inject,
  Injector,
  Input,
  NgModuleFactoryLoader,
  OnDestroy,
  Output,
  Type,
} from '@angular/core';
import { Title } from '@angular/platform-browser';

import { DocumentContents } from 'app/documents/document.service';
import { embeddedSelectorsToken } from 'app/shared/embedded-selectors';
import { Logger } from 'app/shared/logger.service';
import { TocService } from 'app/shared/toc.service';

declare const System;

interface EmbeddedComponentFactory {
  contentPropertyName: string;
  factory: ComponentFactory<any>;
}

// Initialization prevents flicker once pre-rendering is on
const initialDocViewerElement = document.querySelector('aio-doc-viewer');
const initialDocViewerContent = initialDocViewerElement ? initialDocViewerElement.innerHTML : '';

@Component({
  selector: 'aio-doc-viewer',
  template: ''
  // TODO(robwormald): shadow DOM and emulated don't work here (?!)
  // encapsulation: ViewEncapsulation.Native
})
export class DocViewerComponent implements DoCheck, OnDestroy {

  private embeddedComponentInstances: ComponentRef<any>[] = [];
  private embeddedComponentFactories: Map<string, EmbeddedComponentFactory> = new Map();
  private embeddedComponentsReady: Promise<void>;
  private hostElement: HTMLElement;

  @Output()
  docRendered = new EventEmitter();

  constructor(
    elementRef: ElementRef,
    @Inject(embeddedSelectorsToken) private embeddedSelectors: string[],
    private injector: Injector,
    private logger: Logger,
    private titleService: Title,
    private tocService: TocService
    ) {
    this.hostElement = elementRef.nativeElement;
    // Security: the initialDocViewerContent comes from the prerendered DOM and is considered to be secure
    this.hostElement.innerHTML = initialDocViewerContent;
  }

  @Input()
  set doc(newDoc: DocumentContents) {
    this.ngOnDestroy();
    if (newDoc) {
      this.build(newDoc)
          .then(() => this.docRendered.emit())
          .catch(err => this.logger.error(`[DocViewer]: Error preparing document '${newDoc.id}'.`, err));
    }
  }

  /**
   * Add doc content to host element and build it out with embedded components
   */
  private build(doc: DocumentContents): Promise<void> {
    let promise = Promise.resolve();

    // security: the doc.content is always authored by the documentation team
    // and is considered to be safe
    this.hostElement.innerHTML = doc.contents || '';

    if (doc.contents) {
      this.addTitleAndToc(doc.id);

      if (!this.embeddedComponentsReady && this.hostElement.querySelector(this.embeddedSelectors.join(','))) {
        promise = promise.then(() => this.prepareEmbeddedComponents());
      }

      promise = promise.then(() => {
        // TODO(i): why can't I use for-of? why doesn't typescript like Map#value() iterators?
        this.embeddedComponentFactories.forEach(({ contentPropertyName, factory }, selector) => {
          const embeddedComponentElements = this.hostElement.querySelectorAll(selector);

          // cast due to https://github.com/Microsoft/TypeScript/issues/4947
          for (const element of embeddedComponentElements as any as HTMLElement[]){
            // hack: preserve the current element content because the factory will empty it out
            // security: the source of this innerHTML is always authored by the documentation team
            // and is considered to be safe
            element[contentPropertyName] = element.innerHTML;
            this.embeddedComponentInstances.push(factory.create(this.injector, [], element));
          }
        });
      });
    }

    return promise;
  }

  private addTitleAndToc(docId: string) {
    this.tocService.reset();
    let title = '';
    const titleEl = this.hostElement.querySelector('h1');
    // Only create TOC for docs with an <h1> title
    // If you don't want a TOC, add "no-toc" class to <h1>
    if (titleEl) {
      title = (titleEl.innerText || titleEl.textContent).trim();
      if (!/(no-toc|notoc)/i.test(titleEl.className)) {
        this.tocService.genToc(this.hostElement, docId);
        titleEl.insertAdjacentHTML('afterend', '<aio-toc class="embedded"></aio-toc>');
      }
    }
    this.titleService.setTitle(title ? `Angular - ${title}` : 'Angular');
  }

  ngDoCheck() {
    this.embeddedComponentInstances.forEach(comp => comp.changeDetectorRef.detectChanges());
  }

  ngOnDestroy() {
    // destroy these components else there will be memory leaks
    this.embeddedComponentInstances.forEach(comp => comp.destroy());
    this.embeddedComponentInstances.length = 0;
  }

  private prepareEmbeddedComponents() {
    if (!(this.embeddedComponentsReady instanceof Promise)) {
      //const ngModuleFactoryLoader: NgModuleFactoryLoader = this.injector.get(NgModuleFactoryLoader);

      this.embeddedComponentsReady = System.import('../../../$$_gendir/app/embedded/embedded.module.ngfactory')
          .then(m => m.EmbeddedModule).then(ngModuleFactory => {
            const embeddedModuleRef = ngModuleFactory.create(this.injector);
            const embeddedComponents: Type<any>[] = embeddedModuleRef.instance.embeddedComponents;
            const componentFactoryResolver = embeddedModuleRef.componentFactoryResolver;

            for (const component of embeddedComponents) {
              const factory = componentFactoryResolver.resolveComponentFactory(component);
              const selector = factory.selector;
              const contentPropertyName = this.selectorToContentPropertyName(selector);
              this.embeddedComponentFactories.set(selector, { contentPropertyName, factory });
            }
          });
    }

    return this.embeddedComponentsReady;
  }

  /**
   * Compute the component content property name by converting the selector to camelCase and appending
   * 'Content', e.g. live-example => liveExampleContent
   */
  private selectorToContentPropertyName(selector: string) {
    return selector.replace(/-(.)/g, (match, $1) => $1.toUpperCase()) + 'Content';
  }
}
