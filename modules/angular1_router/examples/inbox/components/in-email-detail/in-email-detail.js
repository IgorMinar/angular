//inboxApp.controller('InEmailDetailController', InEmailDetailController);


function InEmailDetailController() {
  console.log('in in in in box controller')
}

/*

@Component({selector: 'in-inbox-detail'})
@View({templateUrl: "in-email-detail.html", directives: [NgFor, RouterLink]})
class InboxDetailCmp {
  record: InboxRecord = new InboxRecord();
  ready: boolean = false;

  constructor(db: DbService, params: RouteParams) {
    var id = params.get('id');
    PromiseWrapper.then(db.email(id), (data) => { this.record.setData(data); });
  }
}
*/
