import {Component, effect, OnDestroy, OnInit} from '@angular/core';
import {ModeType} from '../sidebar/sidebar.component'
import {map, Observable} from "rxjs";
import {DataService} from "../../_services/data.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {EventData} from "../../_services/api.service";

@Component({
  selector: 'app-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.scss']
})
export class DiagramComponent implements OnInit {

  mode$: Observable<any>
  race: EventData
  loadingAnalyticsDataInProgress = this.dataService.loadingAnalyticsDataInProgress
  protected readonly ModeType = ModeType;

  constructor(private dataService: DataService) {
    this.dataService.analyticsData.pipe(takeUntilDestroyed()).subscribe(race => this.race = race)
  }

  ngOnInit() {
    this.mode$ = this.dataService.mode.pipe(map(modeObject => modeObject.mode))
  }
}
