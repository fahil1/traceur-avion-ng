import { Component, OnInit, Input, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { Antenna } from '../antenna';
import { RealTimeMappingService } from '../real-time-mapping.service';
import Map from 'ol/map';
import View from 'ol/view';
import Zoom from 'ol/control/zoom';
import Fullscreen from 'ol/control/fullscreen';
import { UtilsImproved } from '../utils-improved';

@Component({
  selector: 'app-plot-single-antenna',
  templateUrl: './plot-single-antenna.component.html',
  styleUrls: ['./plot-single-antenna.component.css']
})
export class PlotSingleAntennaComponent implements OnInit {
  @ViewChild('map') mapEl: ElementRef;
  @Input() antenna: Antenna;
  @Output()
  back: EventEmitter<any> = new EventEmitter<any>();
  airplanes: any[];
  map: Map;
  utils = new UtilsImproved();

  constructor(
    public realTimeMappingService: RealTimeMappingService
  ) {
      realTimeMappingService.messages.subscribe(msg => {
        this.airplanes = msg;
        console.log(msg);
      });
   }

  ngOnInit() {
    this.createMap();
    this.renderAntenna();
  }

  goBack() {
    this.back.emit(null);
  }
  toDegreesMinutesAndSeconds(coordinate) {
    const absolute = Math.abs(coordinate);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

    return degrees + '° ' + minutes + '\' ' + seconds + '\'\'';
  }

  convertDMS(lat: number, lng: number) {
      const latitude = this.toDegreesMinutesAndSeconds(lat);
      const latitudeCardinal = Math.sign(lat) >= 0 ? 'N' : 'S';

      const longitude = this.toDegreesMinutesAndSeconds(lng);
      const longitudeCardinal = Math.sign(lng) >= 0 ? 'E' : 'W';

      return latitude + ' ' + latitudeCardinal + '\n' + longitude + ' ' + longitudeCardinal;
  }

  createMap() {
    this.map = new Map({
      view: new View({
        projection: 'EPSG:4326',
        minZoom: 5,
        maxZoom: 11,
        center: [-7.0926, 31.7917],
        zoom: 6
      }),
      controls: [
        new Zoom(),
        new Fullscreen({
          source: 'map-interface'
        })
      ],
      target: this.mapEl.nativeElement
    });
  }

  renderAntenna() {
    this.utils.renderMap(this.map, this.antenna, false);
    // this.utils.zoomToExtent(this.map);
  }
}
