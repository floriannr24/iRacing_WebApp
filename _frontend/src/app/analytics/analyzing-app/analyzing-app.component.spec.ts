import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyzingAppComponent } from './analyzing-app.component';

describe('AnalyzingAppComponent', () => {
  let component: AnalyzingAppComponent;
  let fixture: ComponentFixture<AnalyzingAppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnalyzingAppComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalyzingAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
