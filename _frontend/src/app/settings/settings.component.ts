import { Component } from '@angular/core';
import {DataService} from "../_services/data.service";

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

  constructor(private sps: DataService) {
  }

  ngOnInit() {
    const data = this.sps.loadFromCache<Accounts>("accountData")
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

    // this.api.POST_item(itemSent).subscribe(data => {
    //   itemSent.id = data.id
    // })
    this.mainAccount.unshift(account)
    this.toggleAccountAdder_main()
    this.sps.saveToCache("accountData",{main: this.mainAccount, other: this.otherAccounts})
  }

  deleteItem(acc: Account) {
    let deleteIndex = this.mainAccount.findIndex((accToDelete) => accToDelete.custId == acc.custId)
    if (deleteIndex >= 0) {
      this.mainAccount.splice(deleteIndex, 1)
    }
    this.toggleAccountAdder_main()
    this.sps.saveToCache("accountData", {main: this.mainAccount, other: this.otherAccounts})
  }

  private updateItemInArray(item: Item) {
    // let updateIndex = this.mainAccount.findIndex((itemToFind) => itemToFind.id == item.id)
    // this.mainAccount[updateIndex] = {
    //   id: item.id,
    //   title: item.title,
    //   content: item.content
    // }
  }

  showModal() {
    this.show = !this.show
  }
}

export interface Item {
  id: number | null,
  title: string,
  content: string
}

export interface Account {
  name: string,
  custId: number
}

export interface Accounts {
  main: Account[]
  other: Account[]
}
