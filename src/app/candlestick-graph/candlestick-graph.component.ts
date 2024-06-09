import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  AfterViewInit,
  Output,
  EventEmitter
} from '@angular/core';
import { ChartComponent, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexPlotOptions, ApexDataLabels, ApexStroke, NgApexchartsModule } from 'ng-apexcharts';
import { JsonPipe } from '@angular/common';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
};

@Component({
  imports: [NgApexchartsModule, JsonPipe],
  selector: 'app-candlestick-graph',
  standalone: true,
  styleUrls: ['./candlestick-graph.component.scss'],
  templateUrl: './candlestick-graph.component.html',
})
export class CandlestickGraphComponent implements OnChanges, AfterViewInit {
  public chartCandleOptions: ChartOptions;
  public chartBarOptions: ChartOptions;
  private fullStartDate: number | undefined;
  private zoomStartDate: number | undefined;
  private fullEndDate: number | undefined;
  @Input() dataSource: any;
  @Output() chartDoubleClicked = new EventEmitter<MouseEvent>();
  @Output() volumeDoubleClicked = new EventEmitter<MouseEvent>();
  @ViewChild('chartCandle') chartCandle: ChartComponent | undefined;
  @ViewChild('chartBar') chartBar: ChartComponent | undefined;

  constructor() {
    this.chartCandleOptions = {
      series: [],
      chart: {
        type: 'candlestick',
        height: 290,
        id: 'candles',
        toolbar: {
          autoSelected: 'zoom',
          show: false,
        },
        zoom: {
          enabled: true,
        },
        events: {
          click: (event, chartContext, config) => {
            this.handleChartClick(event);
          },
        },
      },
      plotOptions: {
        candlestick: {
          colors: {
            upward: '#3C90EB',
            downward: '#DF7D46',
          },
        },
      },
      xaxis: {
        type: 'datetime',
      },
      yaxis: {},
      dataLabels: {},
      stroke: {},
    };

    this.chartBarOptions = {
      series: [],
      chart: {
        height: 160,
        type: 'bar',
        brush: {
          enabled: true,
          target: 'candles',
        },
        selection: {
          enabled: true,
        },
        events: {
          click: (event, chartContext, config) => {
            this.handleVolumeClick(event);
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      plotOptions: {
        bar: {
          columnWidth: '80%',
          colors: {
            ranges: [
              {
                from: -1000,
                to: 0,
                color: '#F15B46',
              },
              {
                from: 1,
                to: 10000,
                color: '#FEB019',
              },
            ],
          },
        },
      },
      stroke: {
        width: 0,
      },
      xaxis: {
        type: 'datetime',
        axisBorder: {
          offsetX: 13,
        },
      },
      yaxis: {
        labels: {
          show: false,
        },
      },
    };
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dataSource']) {
      console.log('Data Source changed:', this.dataSource);
      this.updateChartOptions();
      this.setDateRange();
      this.resetZoom();
    }
  }

  setDateRange() {
    if (this.dataSource && this.dataSource?.ohlc?.length > 0) {
      const ohlcData = this.dataSource['ohlc'];
      this.fullStartDate = new Date(ohlcData[0].x).getTime();
      this.fullEndDate = new Date(ohlcData[ohlcData.length - 1].x).getTime();
      let startIndex = 0;
      if (this.dataSource['ohlc'].length > 100) {
        startIndex = ohlcData.length - 100;
      }
      this.zoomStartDate = new Date(ohlcData[startIndex].x).getTime();
    }
  }

  getFullStartDate(): number | undefined {
    return this.fullStartDate;
  }

  getFullEndDate(): number | undefined {
    return this.fullEndDate;
  }

  getZoomStartDate(): number | undefined {
    return this.zoomStartDate;
  }

  ngAfterViewInit() {
    this.resetZoom();
  }

  updateChartOptions() {
    if (this.dataSource) {
      this.chartCandleOptions = {
        ...this.chartCandleOptions,
        series: [
          {
            name: 'candle',
            data: this.dataSource['ohlc'],
          },
        ],
      };

      this.chartBarOptions = {
        ...this.chartBarOptions,
        series: [
          {
            name: 'volume',
            data: this.dataSource['volume'],
          },
        ],
      };
    }
  }

  handleChartClick(event: MouseEvent) {
    if (event.detail === 2) { // Double click
      this.resetZoom();
      this.chartDoubleClicked.emit(event);  // Emit the event instead of handling it directly
    }
  }

  resetZoom() {
    if (this.chartCandle && this.zoomStartDate && this.fullEndDate) {
      this.chartCandle.zoomX(this.zoomStartDate, this.fullEndDate);
    }
  }

  handleVolumeClick(event: MouseEvent) {
    if (event.detail === 2) { // Double click
      this.fullZoom();
      this.volumeDoubleClicked.emit(event);  // Emit the event instead of handling it directly
    }
  }

  fullZoom() {
    if (this.chartCandle && this.fullStartDate && this.fullEndDate) {
      this.chartCandle.zoomX(this.fullStartDate, this.fullEndDate);
    }
  }
}
