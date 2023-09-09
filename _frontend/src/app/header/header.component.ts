import {Component} from '@angular/core';
import {DataService} from "../_services/data.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  name: string = "User"
  show: boolean = false
  private nameSubscription: Subscription

  constructor(private dataService: DataService) {
  }

  ngOnInit() {
    this.nameSubscription = this.dataService.mainAcc.subscribe(acc => {
      if (acc != undefined) {
        this.name = acc.name.split(/\s+/)[0]
      }
      }
    )
  }

  ngOnDestroy() {
    this.nameSubscription.unsubscribe()
  }

  showProfileMenu() {
    this.show = !this.show

  }
}
