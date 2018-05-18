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
import cloneDeep from 'lodash/cloneDeep';
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
  timeToLive = 30 * 1000;
  ly_trails: Vector;
  all_trails = {};
  ly_aircrafts: Vector;
  cl_center = false;
  cl_offline = false;
  cl_path = false;
  collapsed = true;
  alerts = [];
  styles = {};

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
      } else {
        this.selected = null;
        this.map.getView().setRotation(0);
      }
    });
    setInterval(_ => {
      this.alerts = [];
    }, 30000);
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

  styleFactory() {
    const aircraft_style = function(feature) {
      return new Style({
        image: new Icon({
            src: 'assets/noeud.png'
        }),
        text: new Text({
          text: feature.getProperties().call_sign,
            fill: new Fill({
                color: '#00FF00'
            }),
            stroke: new Stroke({
                color: '#000000',
                width: 3
            }),
            offsetY: 18
        })
      });
    };
    this.styles['aircraft'] = aircraft_style;
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
    // this.utils.renderMap(this.map, this.antenna, false);
    this.utils.offlineMap(this.map);
    this.utils.clear(this.map);
    this.utils.hydratePoisByDistanceAndBearing(this.antenna, false);
    this.utils.renderSector(this.map, this.antenna);
    this.utils.renderAntenna(this.map, this.antenna);
    this.utils.zoomToExtent(this.map);
  }

  renderAirplanes() {
    if (!this.ly_aircrafts || !this.ly_trails) {
      this.ly_trails = new Vector({
        source: new Source()
      });
      this.map.addLayer(this.ly_trails);
      this.ly_aircrafts = new Vector({
        source: new Source()
      });
      this.map.addLayer(this.ly_aircrafts);
    }
    this.clearDeadAirplanes();    // test?
    this.airplanes.forEach(el => {
      if (el.longitude && el.latitude && el.heading) {
        const coords = [+el.longitude, +el.latitude];
        /*
          AIRCRAFTS
        */
        let aircraftFeature = this.ly_aircrafts.getSource().getFeatureById(el.icao);
        const call_sign = el.call_sign != null ? el.call_sign.replace(/_/g, '') : '?';
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
        let rotation = el.heading * 0.0174533;
        if (this.selected && this.cl_center) {
          rotation = 0;
        }
        if (aircraftFeature) {
          aircraftFeature.setProperties({
            // last_seen: el.last_seen * 1000
            last_seen: +new Date()
          });
          aircraftFeature.setGeometry(new Point(coords));
          aircraftFeature.getStyle().setText(text);
          aircraftFeature.getStyle().getImage().setRotation(rotation);
        } else {
          aircraftFeature = new Feature({
            geometry: new Point(coords),
            // last_seen: el.last_seen * 1000
            last_seen: +new Date()
          });
          aircraftFeature.setId(el.icao);
          aircraftFeature.setStyle(style);
          aircraftFeature.getStyle().getImage().setRotation(rotation);
          aircraftFeature.getStyle().setText(text);

          this.ly_aircrafts.getSource().addFeature(aircraftFeature);
        }

        /*
          TRAILS
        */
      //  let trailFeature = this.ly_trails.getSource().getFeatureById(el.icao);
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
       if (this.selected && this.selected === aircraftFeature) {
          aircraftFeature.setProperties({
            icao: el.icao,
            call_sign: el.call_sign,
            altitude: el.altitude,
            speed: el.speed,
            heading: el.heading,
            vertical_rate: el.vertical_rate,
            // last_seen: el.last_seen
          });
          if (!this.ly_trails.getSource().getFeatures().length && this.cl_path) {
            this.ly_trails.getSource().addFeature(trailFeature);
          } else if (!this.cl_path) {
            this.ly_trails.getSource().clear();
          }
          if (this.cl_center) {
            this.map.getView().setRotation(-el.heading * 0.0174533);
            this.map.getView().fit(this.selected.getGeometry(), {
              maxZoom: 14
            });
          }
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
        this.addAlert('alert-warning', `suppression de ${id}!`);
        const featureToRemove = this.ly_aircrafts.getSource().getFeatureById(id);
        this.ly_aircrafts.getSource().removeFeature(airplaneFeature);
        this.ly_trails.getSource().clear();
      }
    });
  }

  startRecording() {
    this.recording = new Recording();
  }

  stopRecording() {
    console.log('STOP');
    this.recordingsService.saveRecording(cloneDeep(this.recording)).subscribe(_ => {
      this.recording = null;
    });
  }

  addAlert(type: string, text: string) {
    const d = new Date();
    const date_formatted = d.getHours() + ':' + d.getMinutes();
    this.alerts.push({
      type: type,
      text: `[${date_formatted}] ` + text
    });
  }
}
