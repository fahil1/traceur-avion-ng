import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Recording } from '../recording';
import { RecordingsService } from '../recordings.service';
import { UtilsImproved } from '../utils-improved';
import Map from 'ol/map';
import View from 'ol/view';
import { Antenna } from '../antenna';
import { Position } from '../position';
import Fullscreen from 'ol/control/fullscreen';
import LineString from 'ol/geom/linestring';
import OSM from 'ol/source/osm';
import XYZ from 'ol/source/xyz';
import Tile from 'ol/layer/tile';
import Extent from 'ol/extent';
import { lineArc, round } from '@turf/turf';
import Style from 'ol/style/style';
import Text from 'ol/style/text';
import Stroke from 'ol/style/stroke';
import Fill from 'ol/style/fill';
import Icon from 'ol/style/icon';
import Feature from 'ol/feature';
import Point from 'ol/geom/point';
import Vector from 'ol/layer/vector';
import Source from 'ol/source/vector';
import _ceil from 'lodash/ceil';


@Component({
  selector: 'app-recordings',
  templateUrl: './recordings.component.html',
  styleUrls: ['./recordings.component.css']
})
export class RecordingsComponent implements OnInit {
  @ViewChild('map') mapEl: ElementRef;
  id_interval: any;
  map: Map;
  ajaxCompleted = false;
  antenna: Antenna;
  deleteModal = false;
  playingRecord = false;
  duration = '0:00';
  currentDuration = '0:00';
  utils = new UtilsImproved();
  progress = 0;
  recordings: Recording[];
  selected: Recording = new Recording();
  speedThresh = {
    '0': {color: 'cyan'},
    '700': {color: 'orange'},
  };
  altitudeThresh = {
    '0': {color: 'cyan'},
    '8': {color: 'orange'},
  };
  currentPosition: Position = null;
  cl_circles = false;
  cl_offline = false;
  ly_onlineBase: Tile = null;
  ly_offlineBase: Tile;
  ly_angles: Vector;
  ly_airplane: Vector;
  ft_airplane: Feature;
  ft_trail: Feature;
  ly_trail: Vector;
  collapsed = true;

  constructor(
    private recordingsService: RecordingsService
  ) { }

  ngOnInit() {
    this.getRecordings();
    this.createMap();
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


  getRecordings() {
    this.recordingsService.getRecordings().subscribe(r => {
      this.recordings = r;
      this.ajaxCompleted = true;
    });
  }

  onPlay(recording: Recording) {
    this.selected = recording;
    this.antenna = recording.antenna;
    this.playingRecord = true;
    this.duration = this.calcDuration(this.selected.totalPositions);
    this.renderMap();
    this.concentricCircles();
    this.initAirplane();
    this.startPlaying();
  }

  initAirplane() {
    if (!this.ly_airplane) {
      this.ly_airplane = new Vector({source: new Source});
      this.ly_trail = new Vector({source: new Source});

      // Configuration de l'avion
      this.ft_airplane = new Feature();
      this.ft_airplane.setStyle(new Style({
        image: new Icon({
            src: 'assets/noeud.png'
        }),
        text: new Text({
          text: '?',
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
      this.ly_airplane.getSource().addFeature(this.ft_airplane);

      // Configuration du chemin
      this.ft_trail = new Feature({geometry: new LineString([])});
      this.ly_trail.getSource().addFeature(this.ft_trail);

      this.map.addLayer(this.ly_trail);
      this.map.addLayer(this.ly_airplane);
    } else {
      this.ft_trail.setGeometry(new LineString([]));
    }
  }

  startPlaying() {
    let index = 0;
    this.id_interval = setInterval(_ => {
      if (index === (this.selected.positions.length )) {
        clearInterval(this.id_interval);
        this.progress = 100;
        return;
      }
      this.currentPosition = this.selected.positions[index];
      this.renderAirplane();
      this.progress = Math.ceil(((index + 1) * 100) / this.selected.totalPositions);
      this.currentDuration = this.calcDuration(index + 1);
      index++;
    }, 1000);
  }

  renderAirplane() {
    if (this.currentPosition.position) {
      this.ft_airplane.setGeometry(new Point(this.currentPosition.position));
      this.ft_airplane.getStyle().getImage().setRotation(this.currentPosition.heading * 0.0174533);

      const aux_call_sign = this.removeUnderscore(this.selected.call_sign);
      // this.ft_airplane.getStyle().getText().setText(this.selected.call_sign);
      this.ft_airplane.getStyle().getText().setText(aux_call_sign);
      this.ft_trail.getGeometry().appendCoordinate(this.currentPosition.position);
    }
  }

  removeUnderscore(call_sign: string) {
    return call_sign != null ? call_sign.replace(/_/g, '') : '?';
  }

  onStop() {

  }

  onRemove() {
    this.recordingsService.removeRecording(this.selected).subscribe(_ => {
        this.deleteModal = false;
        this.recordings = this.recordings.filter(el => el !== this.selected);
      }
    );
  }


  resetPlaying() {
    this.playingRecord = false;
    this.progress = 0;
    clearInterval(this.id_interval);
  }

  calcDuration(secs: number): string {
    const seconds = secs;
    const minutes = Math.floor(secs / 60);

    const secondsLeft = Math.floor(seconds - minutes * 60);
    let secs_str = secondsLeft + '';
    if (secondsLeft < 10) {
      secs_str = '0' + secondsLeft;
    }

    return `${minutes}:${secs_str}`;
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
        new Fullscreen({
          source: 'map-interface'
        })
      ],
      target: this.mapEl.nativeElement
    });
  }

  clear(map: Map) {
    map.getLayers().forEach(ly => {
        if (ly !== this.ly_offlineBase
          && ly !== this.ly_onlineBase
          && ly !== this.ly_airplane
          && ly !== this.ly_trail
        ) {
            ly.getSource().clear();
          }
      });
  }

  renderMap() {
    this.clear(this.map);   // OK
    this.renderBaseMap();   // OK
    this.utils.hydratePoisByDistanceAndBearing(this.antenna, false);
    this.utils.renderSector(this.map, this.antenna);
    this.renderCircles();
    this.utils.renderAntenna(this.map, this.antenna);
    setTimeout(_ => {
      this.map.getView().fit(this.utils.ly_antenna.getSource().getExtent());
    }, 500);
  }

  renderBaseMap() {
    if (!this.ly_offlineBase && !this.ly_onlineBase) {
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

  renderCircles() {
    if (!this.ly_angles) {
      this.ly_angles = new Vector({
        source: new Source(),
        visible: true
      });
      this.map.addLayer(this.ly_angles);
    }
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

}
