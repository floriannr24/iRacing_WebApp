import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RaceSelectorComponent } from './race-selector.component';

describe('RaceSelectorComponent', () => {
  let component: RaceSelectorComponent;
  let fixture: ComponentFixture<RaceSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RaceSelectorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RaceSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
