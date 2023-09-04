import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
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
