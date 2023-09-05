import { Component } from '@angular/core';
import {Mode, ModeType } from '../sidebar/sidebar.component'
import {Subscription} from "rxjs";
import {DataService} from "../../_services/data.service";

@Component({
  selector: 'app-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.scss']
})
export class DiagramComponent {

  private subscription: Subscription
  protected readonly ModeType = ModeType;
  selectedMode: Mode

  constructor(private dataService: DataService) {
  }

  ngOnInit() {
    this.subscription = this.dataService.mode.subscribe(mode => this.selectedMode = mode)
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }


}
