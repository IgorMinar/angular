import {bootstrap} from '@angular/platform-browser-dynamic';
import {HTTP_PROVIDERS} from '@angular/http/http';
import {HttpCmp} from './http_comp';

export function main() {
  bootstrap(HttpCmp, [HTTP_PROVIDERS]);
}
