import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeltaComponent } from './delta.component';

describe('DeltaComponent', () => {
  let component: DeltaComponent;
  let fixture: ComponentFixture<DeltaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DeltaComponent]
    });
    fixture = TestBed.createComponent(DeltaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
