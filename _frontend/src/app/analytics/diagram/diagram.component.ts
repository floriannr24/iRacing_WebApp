import { Component } from '@angular/core';
import {Mode, ModeType } from '../sidebar/sidebar.component'

@Component({
  selector: 'app-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.scss']
})
export class DiagramComponent {

  selectedMode: Mode = {mode: ModeType.Boxplot, label: "Boxplot"}

  protected readonly ModeType = ModeType;
}
