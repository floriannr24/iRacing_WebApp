import { Component } from '@angular/core';
import {Mode, ModeType } from '../sidebar/sidebar.component'
import {map, Observable, Subscription} from "rxjs";
import {DataService} from "../../_services/data.service";

@Component({
  selector: 'app-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.scss']
})
export class DiagramComponent {

  mode$: Observable<any>
  protected readonly ModeType = ModeType;

  constructor(private dataService: DataService) {
  }

  ngOnInit() {
    this.mode$ = this.dataService.mode.pipe(map(modeObject => modeObject.mode))
  }
}
