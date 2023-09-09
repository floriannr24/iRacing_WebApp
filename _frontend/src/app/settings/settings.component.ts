import { Component } from '@angular/core';
import {DataService} from "../_services/data.service";
import {LocalStorageItem, LocalstorageService} from "../_services/localstorage.service";
import {APIService} from "../_services/api.service";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  show: boolean = false
  otherAccounts: Account[] = new Array<Account>()
  mainAccount: Account[] = new Array<Account>()
  _showAddButton: boolean
  _showItemCreator: boolean
  validationError: boolean = false
  error_text: String
  constructor(private localStorageService: LocalstorageService, private dataService: DataService, private apiService: APIService) {
  }

  ngOnInit() {
    const data = this.localStorageService.load<Accounts>("accountData")
    this.otherAccounts = data.other
    this.mainAccount = data.main
    this._showAddButton = this.mainAccount.length <= 0;
  }

  toggleAccountAdder_main() {
    if (this.mainAccount.length > 0) {
      this._showAddButton = false
    } else {
      this._showAddButton = !this._showAddButton
    }
    this._showItemCreator = !this._showItemCreator
  }

  async addAccount(data: string) {

    if (this.inputIsEmpty(data)) {
      this.showError("User ID is missing")
      return
    }

    if (this.inputContainsLetters(data)) {
      this.showError("User ID may only contain numeric values!")
      return
    }

    const custid = parseInt(data)

    let account: Account = {
      name: "",
      custId: custid,
    }

    this.apiService.getAccountInfo(custid).subscribe(name => {
      account.name = name
      this.localStorageService.save<Accounts>(LocalStorageItem.accountData,{main: this.mainAccount, other: this.otherAccounts})
    })

    this.mainAccount.unshift(account)
    this.dataService.changeCustid(custid)
    this.toggleAccountAdder_main()
  }

  deleteItem(acc: Account) {
    let deleteIndex = this.mainAccount.findIndex((accToDelete) => accToDelete.custId == acc.custId)
    if (deleteIndex >= 0) {
      this.mainAccount.splice(deleteIndex, 1)
    }
    this.localStorageService.save<Accounts>(LocalStorageItem.accountData, {main: this.mainAccount, other: this.otherAccounts})
    this._showAddButton = true
  }

  private inputContainsLetters(text: string) {
    var hasLetters = /\D/
    return hasLetters.test(text)
  }

  private showError(text: String) {
    this.validationError = true
    this.error_text = text
  }

  private inputIsEmpty(text: any) {
    return !text;
  }

  abortCreation() {
    this._showAddButton = true
    this._showItemCreator = false
  }
}

export type Account = {
  name: string,
  custId: number
}

export type Accounts = {
  main: Account[]
  other: Account[]
}
