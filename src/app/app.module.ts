import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { LOCALE_ID } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

import { AppComponent } from './app.component';
import { ClarityModule } from '@clr/angular';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RealTimePlotterComponent } from './real-time-plotter/real-time-plotter.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AntennasComponent } from './antennas/antennas.component';
import { RecordingsComponent } from './recordings/recordings.component';
import { AppRoutingModule } from './app-routing.module';
import { PlotSingleAntennaComponent } from './plot-single-antenna/plot-single-antenna.component';

import {GaugesModule} from 'ng-canvas-gauges/lib';



registerLocaleData(localeFr, 'fr');
@NgModule({
  declarations: [
    AppComponent,
    RealTimePlotterComponent,
    DashboardComponent,
    AntennasComponent,
    RecordingsComponent,
    PlotSingleAntennaComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ClarityModule,
    BrowserAnimationsModule,
    FormsModule,
    AppRoutingModule,
    GaugesModule
  ],
  providers: [{provide: LOCALE_ID, useValue: 'fr' }],
  bootstrap: [AppComponent]
})
export class AppModule { }
