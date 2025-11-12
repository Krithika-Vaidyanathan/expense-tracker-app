import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'camelcase',
  standalone: true
})
export class CamelcasePipe implements PipeTransform {

  transform(value: string): string {
    if (!value) return '';
    return value
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

}
