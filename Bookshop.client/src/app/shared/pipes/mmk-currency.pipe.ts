import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mmkCurrency',
  standalone: true,
})
export class MmkCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined, suffix = 'MMK'): string {
    if (value === null || value === undefined || isNaN(value)) {
      return `0 ${suffix}`;
    }
    const formatted = new Intl.NumberFormat('en-US').format(Math.round(value));
    return `${formatted} ${suffix}`;
  }
}
