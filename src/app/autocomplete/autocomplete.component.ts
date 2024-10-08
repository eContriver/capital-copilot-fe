import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, of, take } from 'rxjs';
import { debounceTime, map, startWith, switchMap } from 'rxjs/operators';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { AsyncPipe, NgForOf } from '@angular/common';
import { MatInput } from '@angular/material/input';
import { Apollo, gql } from 'apollo-angular';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { AutocompleteResult } from '../types';

const AUTOCOMPLETE_QUERY = gql`
  query GetAutocomplete($query: String!) {
    getAutocomplete(query: $query) {
      success
      message
      results {
        symbol
        name
        cik
      }
    }
  }
`;

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [
    AsyncPipe,
    MatFormField,
    MatAutocomplete,
    MatLabel,
    MatOption,
    ReactiveFormsModule,
    MatAutocompleteTrigger,
    NgForOf,
    MatInput,
    MatCard,
    MatCardTitle,
    MatCardSubtitle,
    MatCardHeader,
    MatCardContent,
    MatTooltip,
  ],
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
})
export class AutocompleteComponent {
  results: AutocompleteResult[] = [];
  tickerControl = new FormControl();
  filteredOptions: Observable<{ symbol: string; name: string; cik: string }[]>;

  @ViewChild('input') input!: ElementRef<HTMLInputElement>;
  @Output() optionSelected = new EventEmitter<string>();
  @Output() enterPressed = new EventEmitter<void>();
  @Output() valueSubmitted = new EventEmitter<string>();

  constructor(private readonly apollo: Apollo) {
    this.filteredOptions = this.tickerControl.valueChanges.pipe(
      startWith(''),
      debounceTime(200), // Wait (ms) after the last keystroke before sending, avoid unnecessary requests
      switchMap((value) => this._filter(value || '')),
    );
  }

  private _filter(value: string): Observable<AutocompleteResult[]> {
    if (value.length < 1) {
      return of([]);
    }

    // const filterValue = this.input.nativeElement.value.toLowerCase();
    return (
      this.apollo
        .query({
          query: AUTOCOMPLETE_QUERY,
          variables: { query: value },
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .pipe(map((result: any) => result.data.getAutocomplete.results))
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOptionSelected(event: any) {
    this.optionSelected.emit(event.option.value);
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission on Enter key press

      const inputValue = this.tickerControl.value;
      this.filteredOptions
        .pipe(
          take(1), // Take the first occurrence to avoid multiple subscriptions
          map((options) => options.some((option) => option.symbol === inputValue || option.name === inputValue)),
        )
        .subscribe((isOption) => {
          if (isOption) {
            this.enterPressed.emit(); // Handle selection with enter
          } else {
            this.valueSubmitted.emit(inputValue); // Handle input with enter
            this.tickerControl.setValue(''); // Clear the input field
          }
        });
    }
  }
}
