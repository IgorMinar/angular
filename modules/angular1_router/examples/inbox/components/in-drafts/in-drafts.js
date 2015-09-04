//inboxApp.controller('InDraftsController', InDraftsController);

function InDraftsController() {
  console.log('in in in in box controller')
}


/*
@Component({selector: 'drafts'})
@View({templateUrl: "in-drafts.html", directives: [NgFor, RouterLink]})
class DraftsCmp {
  items: InboxRecord[] = [];
  ready: boolean = false;

  constructor(public router: Router, db: DbService) {
  PromiseWrapper.then(db.drafts(), (drafts) => {
    this.ready = true;
    this.items = ListWrapper.map(drafts, (email) => { return new InboxRecord(email); });
});
}
}
*/
