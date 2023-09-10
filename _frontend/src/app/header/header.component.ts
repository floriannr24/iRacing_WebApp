import {Component} from '@angular/core';
import {DataService} from "../_services/data.service";
import {map, Observable } from "rxjs";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  name$: Observable<string>
  _showProfileMenu: boolean = false

  constructor(private dataService: DataService) {
  }

  ngOnInit() {
    this.name$ = this.dataService.mainAcc.pipe(map(acc => acc ? acc.name.split(/\s+/)[0] : "User"))
  }

  showProfileMenu() {
    this._showProfileMenu = !this._showProfileMenu

  }
}
