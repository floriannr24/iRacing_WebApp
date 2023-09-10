import { Component } from '@angular/core';
import {DataService} from "../_services/data.service";
import {LocalStorageItem, LocalstorageService} from "../_services/localstorage.service";
import {APIService} from "../_services/api.service";
import {Subject, takeUntil} from "rxjs";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  private stop$ = new Subject<void>()
  show: boolean = false
  otherAccounts: Account[]
  mainAccount: Account | undefined
  _showAddButton_main: boolean
  _showItemCreator_main: boolean
  _showAddButton_other: boolean
  _showItemCreator_other: boolean
  _validationError_main: boolean = false
  _validationError_other: boolean = false
  error_text: String


  constructor(private localStorageService: LocalstorageService, private dataService: DataService, private apiService: APIService) {
  }

  ngOnInit() {
    this.dataService.mainAcc.pipe(takeUntil(this.stop$)).subscribe(acc => this.mainAccount = acc)
    this.dataService.otherAcc.pipe(takeUntil(this.stop$)).subscribe(acc => this.otherAccounts = acc)
    this._showAddButton_main = this.mainAccount == undefined;
    this._showAddButton_other = true
  }

  ngOnDestroy() {
    this.stop$.next()
    this.stop$.complete()
  }

  toggleAccountAdder_main() {
    this._showAddButton_main = !this._showAddButton_main
    this._showItemCreator_main = !this._showItemCreator_main
    this._validationError_main = false
  }

  async addAccount_main(data: string) {

    if (this.inputIsEmpty(data)) {
      this.showError_main("User ID is missing")
      return
    }

    if (this.inputContainsLetters(data)) {
      this.showError_main("User ID may only contain numeric values!")
      return
    }

    let custid = parseInt(data)

    if (this.IDisAlreadyInUse(custid)) {
      this.showError_main("This ID is already in use!")
      return
    }

    let account: Account = {
      name: "",
      custId: custid,
    }

    this.apiService.getAccountInfo(custid).subscribe(name => {
      account.name = name
      this.localStorageService.save<Accounts>(LocalStorageItem.accountData,{main: this.mainAccount, other: this.otherAccounts})
      this.dataService.changeMainAcc(account)
    })
    this.mainAccount =  account
    this._showAddButton_main = false
    this._showItemCreator_main = false
  }

  deleteItem_main() {
    this.mainAccount = undefined
    this.dataService.changeMainAcc(undefined)
    this.localStorageService.save<Accounts>(LocalStorageItem.accountData, {main: undefined, other: this.otherAccounts})
    this._showAddButton_main = true
  }

  private inputContainsLetters(text: string) {
    var hasLetters = /\D/
    return hasLetters.test(text)
  }

  private showError_main(text: String) {
    this._validationError_main = true
    this.error_text = text
  }

  private showError_other(text: String) {
    this._validationError_other = true
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
      this.showError_main("User ID is missing!")
      return
    }

    if (this.inputContainsLetters(data)) {
      this.showError_main("User ID may only contain numeric values!")
      return
    }

    let custid = parseInt(data)

    if (this.IDisAlreadyInUse(custid)) {
      this.showError_other("This ID is already in use!")
      return
    }

    let account: Account = {
      name: "",
      custId: custid,
    }

    this.apiService.getAccountInfo(custid).subscribe(name => {
      account.name = name
      this.localStorageService.save<Accounts>(LocalStorageItem.accountData,{main: this.mainAccount, other: this.otherAccounts})
    })

    this.otherAccounts.unshift(account)
    this.dataService.changeOtherAcc(this.otherAccounts)
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

  private IDisAlreadyInUse(data: number) {
    if (data == this.mainAccount?.custId) {
      return true
    }

    for (let i = 0; i < this.otherAccounts.length; i++) {
      if (this.otherAccounts[i].custId == data) {
        return true
      }
    }
    return false
  }
}

export type Account = {
  name: string,
  custId: number
}

export type Accounts = {
  main: Account | undefined
  other: Account[]
}
