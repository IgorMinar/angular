//inboxApp.controller('InInboxController', InInboxController);

function InInboxController() {
  console.log('in in in in box controller')
}

/*
@Component({selector: 'in-inbox'})
@View({templateUrl: "in-inbox.html", directives: [NgFor, RouterLink]})
class InboxCmp {
  items: InboxRecord[] = [];
  ready: boolean = false;

  constructor(public router: Router, db: DbService) {
  PromiseWrapper.then(db.emails(), (emails) => {
    this.ready = true;
    this.items = ListWrapper.map(emails, (email) => { return new InboxRecord(email); });
});
}
}*/
