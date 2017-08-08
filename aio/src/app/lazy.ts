import {foo, MdDatepicker, TransitionCheckState} from "@angular/material";

export function datepickerLoaded() {
  console.log("look ma, datepicker", MdDatepicker);
  console.log("foo", foo, TransitionCheckState);
}