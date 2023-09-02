import { Component } from '@angular/core';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent {
  name: string;
  email: string;
  username: string;
  id: number;
  show: boolean = false


  addUser() {

  }

  showModal() {
    this.show = !this.show
  }
}
