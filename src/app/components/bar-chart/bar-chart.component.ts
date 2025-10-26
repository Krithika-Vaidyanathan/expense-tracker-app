import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [NgxEchartsModule, CommonModule],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.scss',
  providers: [
    {
      provide: 'ECHARTS', // ✅ Make ngx-echarts use this instance
      useValue: echarts
    }
  ]
})
export class BarChartComponent  implements OnChanges {
  barOptions: any;
  @Input() chartData?: {
    labels: string[];
    values: number[];
    colors: string[];
    meta?: { totalBudgeted: number; totalSpent: number; overallUtil: number };
  };


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] && this.chartData) {
      this.setupBarChart();
    }
  }

  setupBarChart() {
    const { labels = [], values = [], colors = [] } = this.chartData || {};

    this.barOptions = {
      backgroundColor: '#fff',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = params[0];
          return `
          <b>${item.name}</b><br/>
          Utilization: ${Math.round(item.value)}%<br/>
        `;
        }
      },
      grid: {
        left: '4%',
        right: '4%',
        bottom: '5%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: {
          formatter: '{value}%',
          fontSize: 13
        },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'category',
          data: labels.map(label => label.toUpperCase()), // ✅ convert all to uppercase
        axisLabel: {
          fontSize: 14,
          fontWeight: 'bold',
          color: '#222',
          formatter: (value: string) => value.toUpperCase()
        }
      },
      series: [
        {
          type: 'bar',
          data: values.map((v, i) => ({
            value: Math.round(v), // ✅ round off values
            itemStyle: { color: colors[i] }
          })),
          barWidth: 33,
          label: {
            show: (true),
            position: 'insideRight',
            formatter: ({ value }: any) => `${Math.round(value)}%`, // ✅ round inside label
            fontSize: 13,
            color: '#fff'
          },
          emphasis: {
            focus: 'series',
            scale: true, // ✅ enables zoom animation
            itemStyle: {
              shadowBlur: 25,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
              opacity: 0.75,
              borderColor: '#444',
              borderWidth: 1,
            }
          },
          universalTransition: true, 
          animationDuration: 700,
          animationEasing: 'elasticOut',
        }
      ]
    };
  }
}