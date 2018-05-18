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
import { Position } from '../position';
import _cloneDeep from 'lodash/cloneDeep';
import _omit from 'lodash/omit';
import LineString from 'ol/geom/linestring';



import { RecordingsService } from '../recordings.service';

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
  recording: Recording = null;
  map: Map;
  utils = new UtilsImproved();
  timeToLive = 50 * 1000;
  ly_trails: Vector;
  all_trails = {};
  ly_aircrafts: Vector;
  cl_center = false;
  cl_offline = false;
  cl_path = false;
  collapsed = true;
  alerts = [];

  constructor(
    public realTimeMappingService: RealTimeMappingService,
    private recordingsService: RecordingsService
  ) {
      realTimeMappingService.messages.subscribe(msg => {
        this.airplanes = msg;
        this.renderAirplanes();
      });
   }

  ngOnInit() {
    this.createMap();
    this.renderAntenna();
    this.map.on('click', e => {
      const features = this.map.getFeaturesAtPixel(e.pixel, {
        layerFilter: ly => {
          if (ly === this.ly_aircrafts) {
            return true;
          }
          return false;
        }
      });
      this.ly_trails.getSource().clear();
      if (features) {
        this.selected = features[0];
        const trail = this.all_trails[this.selected.getId()];
        if (trail) {
          this.ly_trails.getSource().addFeature(trail);
        }
      } else {
        this.selected = null;
        this.map.getView().setRotation(0);
      }
    });
  }

  goBack() {
    this.back.emit(null);
  }

  setProperties(feature: Feature, el: any) {
    feature.setProperties({
      icao: el.icao,
      call_sign: el.call_sign != null ? el.call_sign.replace(/_/g, '') : '?',
      altitude: el.altitude,
      speed: el.speed,
      heading: el.heading,
      vertical_rate: el.vertical_rate,
      // last_last_seen: el.last_seen
      last_seen: +new Date()
    });
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
        // new Zoom(),
        new Fullscreen({
          source: 'map-interface'
        })
      ],
      target: this.mapEl.nativeElement
    });
  }

  renderAntenna() {
    this.utils.offlineMap(this.map);
    this.utils.clear(this.map);
    this.utils.hydratePoisByDistanceAndBearing(this.antenna, false);
    this.utils.renderSector(this.map, this.antenna);
    this.utils.renderAntenna(this.map, this.antenna);
    this.utils.zoomToExtent(this.map);
  }

  clearAll() {
    console.log('clear init');
    setInterval(_ => {
      this.clearDeadAirplanes();
      console.log('5 sec patrol!');
    }, 5 * 1000);
  }

  renderAirplanes() {
    if (!this.ly_aircrafts) {
      this.ly_trails = new Vector({
        source: new Source()
      });
      this.map.addLayer(this.ly_trails);
      this.ly_aircrafts = new Vector({
        source: new Source()
      });
      this.map.addLayer(this.ly_aircrafts);
      this.clearAll();
    }
    this.airplanes.forEach(el => {
      if (el.longitude && el.latitude && el.heading) {
          const coords = [+el.longitude, +el.latitude];
          /*
            AIRCRAFTS
          */
          let aircraftFeature = this.ly_aircrafts.getSource().getFeatureById(el.icao);
          if (!aircraftFeature) {
            aircraftFeature = new Feature({
              // last_seen: el.last_seen * 1000
              last_seen: +new Date()
            });
            aircraftFeature.setId(el.icao);
            this.ly_aircrafts.getSource().addFeature(aircraftFeature);
            this.addAlert('alert-info', `ICAO:'${el.icao}' détecté!`);
            console.log('del');
          }
          this.setProperties(aircraftFeature, el);
          aircraftFeature.setGeometry(new Point(coords));
          aircraftFeature.setStyle(new Style({
            image: new Icon({
                src: 'assets/noeud.png'
            }),
            text: new Text({
              text: aircraftFeature.getProperties().call_sign,
                fill: new Fill({
                    color: '#00FF00'
                }),
                stroke: new Stroke({
                    color: '#000000',
                    width: 3
                }),
                offsetY: 18
            })
          }));
          if (!this.cl_center || !this.selected) {
            this.map.getView().setRotation(0);
            aircraftFeature.getStyle().getImage().setRotation(el.heading * 0.0174533);
          } else if (this.cl_center && this.selected === aircraftFeature){
            this.map.getView().fit(aircraftFeature.getGeometry(), {
              maxZoom: 13
            });
            this.map.getView().setRotation(el.heading * -0.0174533);
          }

            /*
              TRAILS
            */
          let trailFeature = Object.keys(this.all_trails).includes(el.icao) ? this.all_trails[el.icao] : null;
          if (trailFeature) {
            trailFeature.getGeometry().appendCoordinate(coords);
          } else {
            const lineString = new LineString();
            lineString.appendCoordinate(coords);
            trailFeature = new Feature({
              geometry: lineString
            });
            this.all_trails[el.icao] = trailFeature;
          }
      }
    });
  }

  clearDeadAirplanes() {
    this.ly_aircrafts.getSource().getFeatures().forEach(airplaneFeature => {
      const id = airplaneFeature.getId();
      const last_seen = +airplaneFeature.getProperties().last_seen;
      const timeLived = (+new Date()) - last_seen;
      if (timeLived >= this.timeToLive) {
        const featureToRemove = this.ly_aircrafts.getSource().getFeatureById(id);
        this.ly_aircrafts.getSource().removeFeature(airplaneFeature);
        const trailToRemove = this.ly_trails.getSource().getFeatureById(id);
        if (trailToRemove) {
          this.ly_trails.getSource().removeFeature(trailToRemove);
          _omit(this.all_trails, id);
        }
        this.addAlert('alert-warning', `Suppression de ${airplaneFeature.getProperties().call_sign}!`);
        console.log('looooo')
      } else if (timeLived >= this.timeToLive * 0.25) {
        airplaneFeature.getStyle().setText(new Text({
          text: airplaneFeature.getProperties().call_sign + ' †',
            fill: new Fill({
                color: '#FFA500'
            }),
            stroke: new Stroke({
                color: '#000000',
                width: 3
            }),
            offsetY: 18
        }));
      }
    });
  }

  startRecording() {
    this.recording = new Recording();
  }

  stopRecording() {
    console.log('STOP');
    this.recordingsService.saveRecording(_cloneDeep(this.recording)).subscribe(_ => {
      this.recording = null;
    });
  }

  addAlert(type: string, text: string) {
    const d = new Date();
    const date_formatted = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
    const alert = {
      type: type,
      text: `[${date_formatted}] ` + text
    };
    this.alerts.unshift(alert);
    setTimeout(_ => {
      this.alerts = this.alerts.filter(el => el !== alert);
      console.log('deleted: ' + alert.text);
    }, 10 * 1000);
  }
}
