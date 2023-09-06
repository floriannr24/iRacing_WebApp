import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalstorageService {

  save<T>(name: LocalStorageItem | string, data: T) {
    localStorage.setItem(name, JSON.stringify(data));
  }

  load<T>(name: LocalStorageItem | string): T{
    var data = localStorage.getItem(name);
    if (!data) {
      throw new Error("No data found for key: \"" + name + "\"")
    }
    return JSON.parse(data);
  }

}

enum LocalStorageItem {
  analyticsData = "analyticsData",
  bpprop = "bpprop",
  recentRaces = "recentRaces",
  subsessionInfo = "subsessionInfo"
}
