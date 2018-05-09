import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RealTimePlotterComponent } from './real-time-plotter.component';

describe('RealTimePlotterComponent', () => {
  let component: RealTimePlotterComponent;
  let fixture: ComponentFixture<RealTimePlotterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RealTimePlotterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RealTimePlotterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
