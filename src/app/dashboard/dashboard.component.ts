import { Component, OnInit } from '@angular/core';
import { Statistics } from '../statistics';
import { StatisticsService } from '../statistics.service';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats: any;
  positionsChart: Chart;
  antennasChart: Chart;
  labels1: string[] = [];
  data1: number[] = [];
  labels2: string[] = [];
  data2: number[] = [];
  constructor(
    private statisticsService: StatisticsService
  ) { }

  ngOnInit() {
    this.getStats();
  }

  getStats() {
    this.statisticsService.getStatistics().subscribe(s => {
      this.stats = [{icon: 'antenna.png', value: s.countAntennas, text: 'Antennes'},
          {icon: 'poi.png', value: s.countPOIs, text: 'Points d\'intérêt'},
          {icon: 'records.png', value: s.countRecordings, text: 'Enregistrements'},
          {icon: 'position.png', value: s.countPositions, text: 'Positions'},
        ];
        s.singleDateList.forEach(el => {
          this.labels1.push(el.date);
          this.data1.push(el.count);
        });
        this.labels2.push('Directionnel');
        this.data2.push(s.countDirectionnal);
        this.labels2.push('Omnidirectionnel');
        this.data2.push(s.countOmni);
        this.renderCharts();
    });
  }

  renderCharts() {
    this.positionsChart = new Chart('positionsChart', {
      type: 'horizontalBar',
      data: {
          labels: this.labels1,
          datasets: [{
            label: 'Positions',
            borderColor: 'rgb(107, 206, 90)',
            backgroundColor: 'rgb(107, 206, 90)',
            data: this.data1,
          }]
      },
      options: {
        legend: {
          display: false
        }
      }
    });

    this.antennasChart = new Chart('antennasChart', {
      type: 'pie',
      data: {
        datasets: [{
          data: this.data2,
          backgroundColor: ['rgb(70, 198, 207)', 'rgb(224, 99, 99)']
        }],
        labels: this.labels2
      },
      options: {
      }
    });
  }

}
