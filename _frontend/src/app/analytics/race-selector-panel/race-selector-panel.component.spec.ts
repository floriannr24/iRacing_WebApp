import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RaceSelectorPanelComponent } from './race-selector-panel.component';

describe('RaceSelectorPanelComponent', () => {
  let component: RaceSelectorPanelComponent;
  let fixture: ComponentFixture<RaceSelectorPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RaceSelectorPanelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RaceSelectorPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
