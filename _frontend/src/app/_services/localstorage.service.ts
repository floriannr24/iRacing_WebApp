import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalstorageService {

  constructor() { }

  saveToCache<T>(name: string, data: T) {
    localStorage.setItem(name, JSON.stringify(data));
  }

  loadFromCache<T>(name: string): T{
    var data = localStorage.getItem(name);
    if (!data) {
      throw new Error("No data found for key: \"" + name + "\"")
    }
    return JSON.parse(data);
  }

}
