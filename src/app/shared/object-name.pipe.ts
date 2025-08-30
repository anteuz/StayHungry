import { Pipe, PipeTransform } from '@angular/core';
import {Ingredient} from '../models/ingredient';

@Pipe({
  name: 'objectName',
  standalone: true
})
export class ObjectNamePipe implements PipeTransform {

  transform(value: Ingredient[]): string[] {
    const names: string[] = [];
    if (value === undefined) {
      return names;
    }
    for (let i = 0; i < value.length; i++) {
      if (value != null) {
        const simple: any = value[i].item as any;
        names.push(simple?.itemName ?? String(simple));
      }
      // cut back
      if (i > 10) {
        return names;
      }
    }
    return names;
  }
}
