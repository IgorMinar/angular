"use strict";

var inboxApp = angular.module('inboxApp', ['ngComponentRouter']);

inboxApp.directive('inboxApp', function() {
  return {
    templateUrl: 'components/in-inbox-app/in-inbox-app.html',
    controller: InboxAppController,
    controllerAs: 'inboxApp'
  }
});


function InboxAppController(db, $router) {

  $router.config(InboxAppController.$routeConfig);

  // might not be needed
  this.inboxPageActive = function() {
    //$router.isRouteActive();
  };

  this.draftsPageActive = function() {

  };
}

InboxAppController.$routeConfig = [
  {path: '/', component: InInboxController, as: 'inbox'},
  {path: '/drafts', component: InDraftsController, as: 'drafts'},
  {path: '/detail/:id', component: InEmailDetailController, as: 'detailPage'}
];



/*
@RouteConfig([
  new Route({path: '/', component: InboxCmp, as: 'in-inbox'}),
  new Route({path: '/in-drafts', component: DraftsCmp, as: 'in-drafts'}),
  new Route({path: '/detail/:id', component: InboxDetailCmp, as: 'detailPage'})
])
export class InboxApp {
  location: Location;
  constructor(router: Router, location: Location) {
    this.router = router;
    this.location = location;
  }
  inboxPageActive() { return this.location.path() == ''; }
  draftsPageActive() { return this.location.path() == '/in-drafts'; }
}
*/
