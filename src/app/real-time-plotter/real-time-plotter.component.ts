import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { UtilsRTP } from '../utils-rtp';
import Zoom from 'ol/control/zoom';
import FullScreen from 'ol/control/fullscreen';

import Map from 'ol/map';
import View from 'ol/view';

import OSM from 'ol/source/osm';
import { AntennasService } from '../antennas.service';
import { Antenna } from '../antenna';


@Component({
  selector: 'app-real-time-plotter',
  templateUrl: './real-time-plotter.component.html',
  styleUrls: ['./real-time-plotter.component.css']
})
export class RealTimePlotterComponent implements OnInit {
  utils: UtilsRTP = new UtilsRTP();
  map: Map;
  ajaxCompleted = false;
  antennas: Antenna[];

  constructor(
    private antennasService: AntennasService,
  ) { }

  ngOnInit() {
    this.getAntennas();
  }
  getAntennas() {
    this.ajaxCompleted = false;
    this.antennasService.getAntennas().subscribe(t => {
      this.antennas = t;
      this.ajaxCompleted = true;
    });
  }


}
