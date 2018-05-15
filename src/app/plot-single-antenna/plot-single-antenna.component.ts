import { Component, OnInit, Input, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { Antenna } from '../antenna';
import { RealTimeMappingService } from '../real-time-mapping.service';
import Map from 'ol/map';
import View from 'ol/view';
import Zoom from 'ol/control/zoom';
import Fullscreen from 'ol/control/fullscreen';
import { UtilsImproved } from '../utils-improved';
import Style from 'ol/style/style';
import Text from 'ol/style/text';
import Stroke from 'ol/style/stroke';
import Fill from 'ol/style/fill';
import Icon from 'ol/style/icon';
import Feature from 'ol/feature';
import Point from 'ol/geom/point';
import Vector from 'ol/layer/vector';
import Source from 'ol/source/vector';
import { Recording } from '../recording';

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
  airplanes: any[] = [];
  selected: any = null;
  recording: Recording = new Recording();
  currentlyRecording = false;
  map: Map;
  utils = new UtilsImproved();
  ly_airplanes: Vector;

  constructor(
    public realTimeMappingService: RealTimeMappingService
  ) {
      // realTimeMappingService.messages.subscribe(msg => {
      //   this.airplanes = msg;
      //   this.renderAirplanes();
      // });
      this.airplanes.push({
        altitude: 9448.8,
        call_sign: 'RAM432',
        heading: 214,
        icao: 'E48BA8',
        latitude: 33.513,
        longitude: -7.16415,
        speed: 895.4
      });
   }

  ngOnInit() {
    this.createMap();
    this.renderAntenna();
    this.map.on('click', e => {
      const features = this.map.getFeaturesAtPixel(e.pixel, {
        layerFilter: ly => {
          if (ly === this.ly_airplanes) {
            return true;
          }
          return false;
        }
      });
      if (features && !this.currentlyRecording) {
        this.selected = features[0].getProperties();
      } else if (!this.currentlyRecording) {
        this.selected = null;
      }
    });
    this.renderAirplanes();
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
        // minZoom: 5,
        // maxZoom: 11,
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
    // this.utils.renderMap(this.map, this.antenna, false);
    this.utils.offlineMap(this.map);
    this.utils.clear(this.map);
    this.utils.hydratePoisByDistanceAndBearing(this.antenna, false);
    this.utils.renderSector(this.map, this.antenna);
    this.utils.renderAntenna(this.map, this.antenna);
    this.utils.zoomToExtent(this.map);
  }

  renderAirplanes() {
    if(!this.ly_airplanes) {
      this.ly_airplanes = new Vector({
          source: new Source()
      });
      this.map.addLayer(this.ly_airplanes);
    }

    this.ly_airplanes.getSource().clear();
    let isFound = false;

    this.airplanes.forEach(aircraft => {
      if (aircraft.latitude != null && aircraft.heading != null) {
        const point = new Point([aircraft.longitude, aircraft.latitude]);
        const feature = new Feature({
          geometry: point,
          icao: aircraft.icao,
          call_sign: aircraft.call_sign,
          altitude: aircraft.altitude,
          speed: aircraft.speed,
          heading: aircraft.heading,
          vertical_rate: aircraft.vertical_rate,
          last_seen: new Date(+aircraft.last_seen * 1000)
        });
        const properties = feature.getProperties();
        if (this.selected && this.selected.icao === properties.icao) {
          this.selected = properties;
          isFound = true;
          this.map.getView().fit(feature.getGeometry(), {
            maxZoom: 13
          });
        }

        const call_sign = aircraft.call_sign != null ? aircraft.call_sign.replace(/_/g, '') : '?';
        const style = new Style({
            image: new Icon({
                src: 'assets/noeud.png'
            })
        });

        const text = new Text({
            text: call_sign,
            fill: new Fill({
                color: '#00FF00'
            }),
            stroke: new Stroke({
                color: '#000000',
                width: 3
            }),
            offsetY: 18,
        });
        style.setText(text);
        style.getImage().setRotation(aircraft.heading * 0.0174533);
        feature.setStyle(style);
        this.ly_airplanes.getSource().addFeature(feature);
      }
    });
    if (!isFound) {
      this.selected = null;
    }
  }

  onRecord() {
    this.currentlyRecording = !this.currentlyRecording;
    if (this.currentlyRecording) {
      // enregistrement..
    } else {
      // arrêt d'enregistrement
    }
  }
}
