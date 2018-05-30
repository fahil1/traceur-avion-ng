import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import Zoom from 'ol/control/zoom';
import FullScreen from 'ol/control/fullscreen';

import Map from 'ol/map';
import View from 'ol/view';

import OSM from 'ol/source/osm';
import { AntennasService } from '../antennas.service';
import { Antenna } from '../antenna';
import { RealTimeMappingService } from '../real-time-mapping.service';


@Component({
  selector: 'app-real-time-plotter',
  templateUrl: './real-time-plotter.component.html',
  styleUrls: ['./real-time-plotter.component.css']
})
export class RealTimePlotterComponent implements OnInit {
  map: Map;
  ajaxCompleted = false;
  antennas: Antenna[];
  rows: Antenna[][];
  selected: Antenna = null;
  array = [];


  constructor(
    private antennasService: AntennasService
  ) {
  }

  ngOnInit() {
    this.getAntennas();
  }
  getAntennas() {
    this.ajaxCompleted = false;
    this.antennasService.getAntennas().subscribe(t => {
      this.antennas = t;
      this.generateRows(3);
      this.ajaxCompleted = true;
    });
  }
  generateRows(perRow: number): any {
    this.rows = [[]];
    this.antennas.forEach((antenna, i) => {
      if ((i) % perRow === 0 ) {
        this.rows.push([]);
      }
      this.rows[this.rows.length - 1].push(antenna);
    });
  }


}
