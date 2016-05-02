import {verifyNoBrowserErrors} from '@angular/platform-browser/testing_e2e';

describe('Person Management CRUD', function() {
  var URL = 'playground/src/person_management/index.html';

  it('should work', function() {
    browser.get(URL);
    verifyNoBrowserErrors();
  });
});
