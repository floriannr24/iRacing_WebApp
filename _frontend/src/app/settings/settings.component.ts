import { Component } from '@angular/core';
import {DataService} from "../_services/data.service";
import {LocalstorageService} from "../_services/localstorage.service";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  show: boolean = false
  otherAccounts: Account[] = new Array<Account>()
  mainAccount: Account[] = new Array<Account>()
  _showItemCreator: boolean
  _showAddButton: boolean = false

  constructor(private localStorageService: LocalstorageService) {
  }

  ngOnInit() {
    const data = this.localStorageService.load<Accounts>("accountData")
    this.otherAccounts = data.other
    this.mainAccount = data.main
    this.toggleAccountAdder_main()
  }

  toggleAccountAdder_main() {

    if (this.mainAccount.length == 0) {
      this._showAddButton = !this._showAddButton
    } else {
      this._showAddButton = false
    }
    this._showItemCreator = !this._showAddButton && this.mainAccount.length == 0;
  }

  async addAccount(custid: string) {

    console.log(custid)

    let account: Account = {
      name: "0",
      custId: 2,
    }

    this.mainAccount.unshift(account)
    this.toggleAccountAdder_main()
    this.localStorageService.save<Accounts>("accountData",{main: this.mainAccount, other: this.otherAccounts})
  }

  deleteItem(acc: Account) {
    let deleteIndex = this.mainAccount.findIndex((accToDelete) => accToDelete.custId == acc.custId)
    if (deleteIndex >= 0) {
      this.mainAccount.splice(deleteIndex, 1)
    }
    this.toggleAccountAdder_main()
    this.localStorageService.save<Accounts>("accountData", {main: this.mainAccount, other: this.otherAccounts})
  }

  showModal() {
    this.show = !this.show
  }
}

export interface Account {
  name: string,
  custId: number
}

export interface Accounts {
  main: Account[]
  other: Account[]
}
