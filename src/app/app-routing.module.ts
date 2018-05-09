import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard.component';
import { RealTimePlotterComponent } from './real-time-plotter/real-time-plotter.component';
import { AntennasComponent } from './antennas/antennas.component';
import { RecordingsComponent } from './recordings/recordings.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'real-time-plotter', component: RealTimePlotterComponent },
  { path: 'antennas', component: AntennasComponent },
  { path: 'recordings', component: RecordingsComponent }
];
@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }

