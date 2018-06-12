import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ClrDatagridComparatorInterface, Wizard } from '@clr/angular';
import { round } from '@turf/turf';
import Map from 'ol/map';
import View from 'ol/view';
import cloneDeep from 'lodash/cloneDeep';
import Zoom from 'ol/control/zoom';
import Fullscreen from 'ol/control/fullscreen';




import { AntennasService } from '../antennas.service';
import { UtilsImproved } from '../utils-improved';

import { Antenna } from '../antenna';
import { Poi } from '../poi';

class TypeAntennaComparator implements ClrDatagridComparatorInterface<Antenna> {
  compare(a: Antenna, b: Antenna) {
      if (a.angleOfView && b.angleOfView) {
        return 0;
      } else if (a.angleOfView) {
        return 1;
      }
      return -1;
  }
}

@Component({
  selector: 'app-antennas',
  templateUrl: './antennas.component.html',
  styleUrls: ['./antennas.component.css']
})
export class AntennasComponent implements OnInit {
  @ViewChild('wizardlg') wizard: Wizard;
  @ViewChild('map') mapEl: ElementRef;
  antennas: Antenna[];
  ajaxCompleted = false;
  deleteModal = false;
  addModal = false;
  frequencyChoosed: number = 1;
  renderCompleted = true;

  mode = 'add';

  selected: Antenna = new Antenna();
  model: Antenna = new Antenna();
  private typeAntennaComparator = new TypeAntennaComparator();
  private utils = new UtilsImproved();

  map: Map;

  constructor(
    private antennasService: AntennasService,
  ) {}

  ngOnInit() {
    this.getAntennas();
  }

  createMap() {
    if (!this.map) {
      this.map = new Map({
        view: new View({
          projection: 'EPSG:4326',
          minZoom: 5,
          maxZoom: 11
        }),
        controls: [
          new Zoom(),
          new Fullscreen()
        ],
        target: this.mapEl.nativeElement
    });
    }
  }

  getAntennas() {
    this.ajaxCompleted = false;
    this.antennasService.getAntennas().subscribe(t => {
      this.antennas = t;
      this.ajaxCompleted = true;
    });
  }

  onRemove() {
    this.antennasService.removeAntenna(this.selected).subscribe(_ => {
        this.deleteModal = false;
        this.antennas = this.antennas.filter(el => el !== this.selected);
      }
    );
  }

  get diagnostic() {
    return JSON.stringify(this.model);
  }

  onAddNewPoi() {
    this.model.poiList.push(new Poi());
  }

  onChange() {
    if (this.model.angleOfView.angleCenter) {
      this.renderCompleted = false;
      this.utils.renderMap(this.map, this.model, false);
      this.renderCompleted = true;
    }
  }

  calibrate() {
    this.createMap();
    this.model.totalPois = this.model.poiList.length;
    this.renderCompleted = false;
    this.utils.renderMap(this.map, this.model, true);
    this.renderCompleted = true;
  }

  updateFreq() {
    this.model.frequency = round(this.model.frequency * this.frequencyChoosed, 2);
    this.model.angleOfView.angleRange = this.correctAngle(this.model.angleOfView.angleRange);
  }

  correctAngle(angle: number) {
    while (angle > 360) {
      angle = angle - 360;
    }
    return angle;
  }

  doFinish() {
    this.ajaxCompleted = false;
    if (this.mode === 'add') {
      this.antennasService.saveAntenna(this.model).subscribe(_ => {
        this.antennas.push(this.model);
        this.model = new Antenna();
        this.ajaxCompleted = true;
      });
    } else {
      this.antennasService.updateAntenna(this.model).subscribe(_ => {
        this.getAntennas();
        this.ajaxCompleted = true;
      });
    }
  }

  onAddClick() {
    this.mode = 'add';
    this.model = new Antenna();
    this.wizard.reset();

    this.addModal = true;
  }

  onUpdateClick() {
    this.wizard.reset();
    this.mode = 'update';
    this.model = cloneDeep(this.selected);
    this.addModal = true;
  }


}
