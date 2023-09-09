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
  _showAddButton_main: boolean
  _showItemCreator_main: boolean
  _showAddButton_other: boolean
  _showItemCreator_other: boolean
  validationError: boolean = false
  error_text: String
  constructor(private localStorageService: LocalstorageService, private dataService: DataService, private apiService: APIService) {
  }

  ngOnInit() {
    const data = this.localStorageService.load<Accounts>("accountData")
    this.otherAccounts = data.other
    this.mainAccount = data.main
    this._showAddButton_main = this.mainAccount.length <= 0;
    this._showAddButton_other = true
  }

  toggleAccountAdder_main() {
    if (this.mainAccount.length > 0) {
      this._showAddButton_main = false
    } else {
      this._showAddButton_main = !this._showAddButton_main
    }
    this._showItemCreator_main = !this._showItemCreator_main
  }

  async addAccount_main(data: string) {

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

  deleteItem_main(acc: Account) {
    let deleteIndex = this.mainAccount.findIndex((accToDelete) => accToDelete.custId == acc.custId)
    if (deleteIndex >= 0) {
      this.mainAccount.splice(deleteIndex, 1)
    }
    this.localStorageService.save<Accounts>(LocalStorageItem.accountData, {main: this.mainAccount, other: this.otherAccounts})
    this._showAddButton_main = true
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

  abortCreation_main() {
    this._showAddButton_main = true
    this._showItemCreator_main = false
  }

  abortCreation_other() {
    this._showAddButton_other = true
    this._showItemCreator_other = false
  }

  toggleAccountAdder_other() {
    this._showAddButton_other = !this._showAddButton_other
    this._showItemCreator_other = !this._showItemCreator_other
  }

  addAccount_other(data: string) {

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

    this.otherAccounts.unshift(account)
    this.dataService.changeCustid(custid)
    this.toggleAccountAdder_other()

  }

  deleteItem_other(acc: Account) {
    let deleteIndex = this.otherAccounts.findIndex((accToDelete) => accToDelete.custId == acc.custId)
    if (deleteIndex >= 0) {
      this.otherAccounts.splice(deleteIndex, 1)
    }
    this.localStorageService.save<Accounts>(LocalStorageItem.accountData, {main: this.mainAccount, other: this.otherAccounts})
    this._showAddButton_other = true
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
