import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts';
import { ExportMenuComponent } from '../export-menu/export-menu.component';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [NgxEchartsModule, CommonModule, ExportMenuComponent],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.scss',
  providers: [
    {
      provide: 'ECHARTS', // ✅ Make ngx-echarts use this instance
      useValue: echarts
    }
  ]
})
export class BarChartComponent implements OnChanges {
  barOptions: any;
  @Input() exportData: any[] = [];
  @Input() chartData?: {
    labels: string[];
    values: number[];
    colors: string[];
    meta?: { totalBudgeted: number; totalSpent: number; overallUtil: number };
  };

  chartHeight = 300;

  @HostListener('window:resize')
  onResize() {
    this.setupBarChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] && this.chartData) {
      this.setupBarChart();
    }
  }

  setupBarChart() {
    const { labels = [], values = [], colors = [] } = this.chartData || {};

    // Dynamically adjust chart height for mobile screens or large data
    const screenWidth = window.innerWidth;
    if (screenWidth < 640) {
      this.chartHeight = Math.max(250, labels.length * 70); // mobile: more height per bar
    } else if (screenWidth < 1024) {
      this.chartHeight = Math.max(300, labels.length * 60); // tablet
    } else {
      this.chartHeight = Math.max(350, labels.length * 50); // desktop
    }

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
        left: '5%', // ✅ ensures full label visibility
        right: '6%',
        bottom: '5%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: {
          formatter: '{value}%',
          fontSize: 12,
          color: '#333'
        },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'category',
        data: labels.map(label => label.toUpperCase()),
        axisLabel: {
          fontSize: screenWidth < 640 ? 10 : 14, // responsive font
          fontWeight: 500,
          color: '#000', // darker solid color for sharp text
          margin: 14,
          // ✅ Prevent fading and increase contrast
          textBorderColor: '#000',
          textBorderWidth: 0.3,
          textShadowColor: 'rgba(0,0,0,0.15)',
          textShadowBlur: 0.5,
          backgroundColor: '#fff', // ensures solid rendering behind text
          padding: [1, 2, 1, 2],
        },
        axisTick: { show: true },
        axisLine: { show: true },
      },
      series: [
        {
          type: 'bar',
          data: values.map((v, i) => ({
            value: Math.round(v),
            itemStyle: { color: colors[i] }
          })),
          barWidth: screenWidth < 640 ? 20 : 33, // thinner bars for mobile
          label: {
            show: true,
            position: 'right',
            formatter: ({ value }: any) => `${Math.round(value)}%`,
            fontSize: screenWidth < 640 ? 11 : 13,
            color: '#fff'
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0,0,0,0.3)',
              opacity: 0.9,
            }
          },
          animationDuration: 700,
          animationEasing: 'cubicOut'
        }
      ]
    };
  }
}
