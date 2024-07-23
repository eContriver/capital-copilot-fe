import {
  AfterViewInit,
  Component,
  EventEmitter,
  OnDestroy,
  Output,
} from '@angular/core';
import { ChartData, DataService } from '../../data.service';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CandlestickComponent } from '../candlestick/candlestick.component';
import { Subscription } from 'rxjs';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-chart-control',
  standalone: true,
  imports: [ReactiveFormsModule, CandlestickComponent, MatInput],
  templateUrl: './control.component.html',
  styleUrl: './control.component.scss',
})
export class ControlComponent implements OnDestroy, AfterViewInit {
  stockForm = new FormGroup({
    ticker: new FormControl('', Validators.required),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Output() dataEmitter = new EventEmitter<any>();
  error: string | null = null;
  private subscription: Subscription | undefined;

  constructor(private dataService: DataService) {}

  ngAfterViewInit(): void {
    this.focusInput();
  }

  onSubmit(): void {
    this.error = null;
    const ticker = this.stockForm?.value.ticker?.toUpperCase();
    if (this.stockForm) {
      this.stockForm.controls['ticker'].setValue('');
    }
    this.dataEmitter.emit({ ticker: ticker, data: { loading: true } });
    this.subscription = this.dataService.fetchData(ticker).subscribe({
      next: (data: ChartData | null) => {
        this.dataEmitter.emit(data);
      },
      error: (err: { message: string }) => {
        // TODO: Decide which of these 2 to use:
        this.error = err.message;
        this.dataEmitter.emit({ ticker: ticker, data: { error: err.message } });
      },
      complete: () => {
        console.log('Data fetch complete');
        this.focusInput();
      },
    });
  }

  private focusInput() {
    const input = document.querySelector<HTMLInputElement>('#ticker');
    if (input) {
      input.focus();
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
