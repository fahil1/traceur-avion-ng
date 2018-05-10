import { Component, OnInit, ViewChild } from '@angular/core';
import { ClrDatagridComparatorInterface, Wizard } from '@clr/angular';
import { round } from '@turf/turf';
import Map from 'ol/map';
import View from 'ol/view';



import { AntennasService } from '../antennas.service';
import { Utils } from '../utils';

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
  antennas: Antenna[];
  ajaxCompleted = false;
  deleteModal = false;
  addModal = false;
  isMapCreated = false;
  frequencyChoosed: number = 1;
  renderCompleted = true;

  selected: Antenna = new Antenna();
  model: Antenna = new Antenna();
  private typeAntennaComparator = new TypeAntennaComparator();
  private utils = new Utils();

  map: Map;

  constructor(
    private antennasService: AntennasService,
  ) {
    this.model.name = 'Agadir test';
    this.model.position = [-9.414388, 30.332335];
    this.model.angleOfView.angleRange = 26;
    this.model.frequency = 124.4;
    this.model.poiList[0].name = 'KONBA';
    this.model.poiList[0].position = [-15.30167, 31.30083];
    // this.model.poiList[0].position = [-9.123889, 30.60944];

    this.model.poiList.push(new Poi());
    this.model.poiList.push(new Poi());

    this.model.poiList[1].name = 'LEPRU';
    this.model.poiList[1].position = [-14.80111, 32];
    // this.model.poiList[1].position = [-9.178889, 30.45333];

    this.model.poiList[2].name = 'OSDIV';
    this.model.poiList[2].position = [-13.83611, 33.14944];
    // this.model.poiList[2].position = [-9.250278, 30.2875];

    this.model.poiList.push(new Poi());
    this.model.poiList.push(new Poi());
    this.model.poiList.push(new Poi());
    this.model.poiList.push(new Poi());

    this.model.poiList[3].name = 'SAMAR';
    this.model.poiList[3].position = [-14.41556, 30.89972];

    this.model.poiList[4].name = 'MITLA';
    this.model.poiList[4].position = [-14.08222, 31.30833];

    this.model.poiList[5].name = 'ABTIR';
    this.model.poiList[5].position = [-12.80167, 32.84889];

    this.model.poiList[6].name = 'NEVTU';
    this.model.poiList[6].position = [-13.24472, 32.97861];



   }

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
      setTimeout(_ => {
        this.utils.renderMap(this.map, this.model, false);
        this.renderCompleted = true;
      }, 1000);
    }
  }

  calibrate() {
    this.model.totalPois = this.model.poiList.length;
    this.renderCompleted = false;
    setTimeout(_ => {
      if (!this.isMapCreated) {
        this.map = new Map({
            view: new View({
              projection: 'EPSG:4326'
            }),
            target: 'map'
        });
        this.isMapCreated = true;
      }
      this.utils.renderMap(this.map, this.model, true);
      this.renderCompleted = true;
    }, 1000);
  }
  updateFreq() {
    this.model.frequency = round(this.model.frequency * this.frequencyChoosed, 2);
  }
}
