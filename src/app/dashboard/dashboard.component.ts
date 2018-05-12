import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats = [{icon: 'antenna.png', value: 4, text: 'Antennes'},
    {icon: 'poi.png', value: 12, text: 'Points d\'intérêt'},
    {icon: 'records.png', value: 8, text: 'Enregistrements'},
    {icon: 'position.png', value: 26, text: 'Positions'},
  ];
  positionsChart: Chart;
  antennasChart: Chart;
  constructor() { }

  ngOnInit() {
    this.positionsChart = new Chart('positionsChart', {
      type: 'horizontalBar',
      data: {
          labels: ['1-5 Avril', '6-10 Avril', '11-15 Avril', '16-20 Avril', '21-25 Avril', '26-30 Avril', '31-5 Mai'],
          datasets: [{
            label: 'Positions',
            borderColor: 'rgb(107, 206, 90)',
            backgroundColor: 'rgb(107, 206, 90)',
            data: [124, 0, 240, 20, 10, 40, 10],
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
          data: [40, 60],
          backgroundColor: ['rgb(70, 198, 207)', 'rgb(224, 99, 99)']
        }],
        labels: [
          'Omnidirectionnelle',
          'Directionnelle'
        ]
      },
      options: {
      }
    });
  }

}
