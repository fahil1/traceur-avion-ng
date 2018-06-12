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
import _isEqual from 'lodash/isEqual';
import LineString from 'ol/geom/linestring';
import OSM from 'ol/source/osm';
import XYZ from 'ol/source/xyz';
import Tile from 'ol/layer/tile';
import Extent from 'ol/extent';
import { lineArc, round } from '@turf/turf';

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
  recordWithTrail = false;
  map: Map;
  utils = new UtilsImproved();
  timeToLive = 60 * 1000;
  ly_trails: Vector;
  all_trails = {};
  all_positions = {};
  ly_aircrafts: Vector;
  ly_onlineBase: Vector;
  ly_offlineBase: Vector;
  ly_angles: Vector;
  cl_center = false;
  cl_offline = false;
  cl_path = false;
  cl_circles = false;
  collapsed = true;
  alerts = [];
  speedThresh = {
    '0': {color: 'cyan'},
    '700': {color: 'orange'},
  };
  altitudeThresh = {
    '0': {color: 'cyan'},
    '8': {color: 'orange'},
  };

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
      if (!this.recording) {
        this.ly_trails.getSource().clear();
        if (features && features[0].get('active')) {
          this.selected = features[0];
          const trail = this.all_trails[this.selected.getId()];
          if (trail) {
            this.ly_trails.getSource().addFeature(trail);
          }
        } else {
          this.selected = null;
          this.map.getView().setRotation(0);
        }
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
      altitude: +el.altitude,
      speed: +el.speed,
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
    this.renderBaseMap();
    this.clear(this.map);
    this.utils.hydratePoisByDistanceAndBearing(this.antenna, false);
    this.utils.renderSector(this.map, this.antenna);
    this.renderCircles();
    this.utils.renderAntenna(this.map, this.antenna);
    this.concentricCircles();
    this.zoomToExtent(this.map);
  }

  clearAll() {
    setInterval(_ => {
      this.clearDeadAirplanes();
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
          const position = new Position(
            el.altitude,
            [+el.longitude, +el.latitude],
            el.speed,
            el.heading,
            el.vertical_rate,
            new Date(el.last_seen * 1000)
          );
          this.persistPosition(el.icao, position);
          this.updateRecording(el.icao, el.call_sign ? el.call_sign : '?', position);
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
            this.addAlert('alert-info', `ICAO:'${el.icao}' détecté.`);
          }
          this.setProperties(aircraftFeature, el);
          aircraftFeature.set('active', true);
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
          } else if (this.cl_center && this.selected === aircraftFeature) {
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
              geometry: lineString,
            });
            this.all_trails[el.icao] = trailFeature;
          }
          trailFeature.setId(el.icao);
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
        if (featureToRemove === this.selected) {
          this.selected = null;
          if (this.recording) {
            this.stopRecording();
          }
        }
        this.ly_aircrafts.getSource().removeFeature(airplaneFeature);
        const trailToRemove = this.ly_trails.getSource().getFeatureById(id);
        this.all_trails = _omit(this.all_trails, id);
        if (trailToRemove) {
          this.ly_trails.getSource().removeFeature(trailToRemove);
        }
        this.addAlert('alert-warning', `Suppression de ${airplaneFeature.getProperties().call_sign}.`);
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
        airplaneFeature.set('active', false);
      }
    });
  }

  startRecording() {
    this.recording = new Recording();
    this.recording.icao = this.selected.getId();
    this.recording.antenna = this.antenna;
    let msg = `Enregistrement de l'avion '${this.recording.icao}' est commencé`;
    if (this.recordWithTrail) {
      this.recording.positions = this.all_positions[this.selected.getId()];
      msg = `Enregistrement de l'avion '${this.recording.icao}' est commencé en tenant compte de
       ${this.recording.positions.length} position(s) antérieure(s)`;
    }
    this.addAlert('alert-info', msg);
  }

  updateRecording(icao: string, call_sign: string, position: Position) {
    if (this.recording && this.recording.icao === icao) {
      this.recording.call_sign = call_sign;
      if (!this.recording.positions.find(el => _isEqual(el, position))) {
        this.recording.positions.push(position);
      } else {
        console.log('skipped!');
      }
    }
  }

  stopRecording() {
    this.recordWithTrail = false;
    const countPositions = this.recording.positions.length;
    this.recording.totalPositions = countPositions;
    this.recordingsService.saveRecording(_cloneDeep(this.recording)).subscribe(_ => {
      this.addAlert('alert-success', 'L\'enregistrement est persisté en BD avec ' + this.recording.positions.length + ' position(s).');
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
    }, 10 * 1000);
  }

  renderBaseMap() {
    this.ly_onlineBase = new Tile({
      source: new OSM({
          url: 'http://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
        }),
        visible: true
    });
    this.ly_offlineBase = new Tile({
      source: new XYZ({
          url: 'assets/tiles/{z}/{x}/{y}.png'
      }),
      visible: false
    });
    this.map.addLayer(this.ly_onlineBase);
    this.map.addLayer(this.ly_offlineBase);
  }

  clear(map: Map) {
    map.getLayers().forEach(ly => {
        if (ly !== this.ly_offlineBase && ly !== this.ly_onlineBase) {
            ly.getSource().clear();
          }
      });
  }
  zoomToExtent(map: Map)  {
    const extent = Extent.createEmpty();
    map.getLayers().forEach(ly => {
        if (ly !== this.ly_offlineBase && ly !== this.ly_onlineBase) {
            Extent.extend(extent, ly.getSource().getExtent());
        }
    });
    map.getView().fit(extent);
  }

  onMapMode() {
    this.cl_offline = !this.cl_offline;
    if (this.cl_offline) {
      this.ly_offlineBase.setVisible(true);
      this.ly_onlineBase.setVisible(false);
      this.map.getView().setMinZoom(5);
      this.map.getView().setMaxZoom(11);
    } else {
      this.ly_offlineBase.setVisible(false);
      this.ly_onlineBase.setVisible(true);
      this.map.getView().setMinZoom(0);
      this.map.getView().setMaxZoom(28);
    }
  }

  renderCircles() {
    this.ly_angles = new Vector({
      source: new Source(),
      visible: true
    });
    this.map.addLayer(this.ly_angles);
    const b1 = this.antenna.angleOfView.angleCenter - (this.antenna.angleOfView.angleRange / 2);
    const b2 = this.antenna.angleOfView.angleCenter + (this.antenna.angleOfView.angleRange / 2);
    for (let index = 0.25; index <= 1; index = index + 0.25) {
      const distance = this.utils.maxDistance * index;
      const arc_angle_view = this.utils.toFeature(lineArc(this.utils.toTurf(this.antenna), distance,
      this.utils.azimuthToBearing(b1), this.utils.azimuthToBearing(b2)));

      arc_angle_view.setStyle(new Style({
        text: new Text({
            text: parseInt(distance + '', 10) + ' km',
            scale: 1.2,
            fill: new Fill({
                color: '#f1c40f'
            }),
            stroke: new Stroke({
                color: '#000000',
                width: 3
            })
        }),
        stroke: new Stroke({
            color: '#f39c12',
            width: 0.2
        })
      }));

      this.ly_angles.getSource().addFeature(arc_angle_view);
    }
  }

  concentricCircles() {
    this.cl_circles = !this.cl_circles;
    if (this.cl_circles) {
      this.ly_angles.setVisible(true);
      this.utils.ly_sector.setVisible(true);
    } else {
      this.ly_angles.setVisible(false);
      this.utils.ly_sector.setVisible(false);
    }
  }

  persistPosition(icao: string, position: Position) {
    if (Object.keys(this.all_positions).includes(icao)) {
      if (!this.all_positions[icao].find(el => _isEqual(el, position))) {
        this.all_positions[icao].push(position);
      }
    } else {
      this.all_positions[icao] = [position];
    }
  }
}


