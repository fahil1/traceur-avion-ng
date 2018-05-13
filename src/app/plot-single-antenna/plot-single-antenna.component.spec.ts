import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlotSingleAntennaComponent } from './plot-single-antenna.component';

describe('PlotSingleAntennaComponent', () => {
  let component: PlotSingleAntennaComponent;
  let fixture: ComponentFixture<PlotSingleAntennaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlotSingleAntennaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlotSingleAntennaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
