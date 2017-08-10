import {NgModule, Component} from "@angular/core";
import {foo, MdDatepicker, TransitionCheckState, MdDatepickerModule} from "@angular/material";


@Component({
  selector: 'me-lazy',
  template: '<md-datepicker></md-datepicker>'
})
export class LazyComponent {}

@NgModule({
  imports: [MdDatepickerModule],
  declarations: [LazyComponent],
  entryComponents: [LazyComponent]
})
export class LazyModule {

  constructor() {
    console.log("look ma, datepicker", MdDatepicker);
    console.log("foo", foo, TransitionCheckState);
  }

}