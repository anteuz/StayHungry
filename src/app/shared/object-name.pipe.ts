import { Pipe, PipeTransform } from '@angular/core';
import {Ingredient} from '../models/ingredient';

@Pipe({
  name: 'objectName'
})
export class ObjectNamePipe implements PipeTransform {

  transform(value: Ingredient[]): string[] {
    const names: string[] = [];

    for (let i = 0; i < value.length; i++) {
      if (value != null) {
        names.push(value[i].item.itemName);
      }
      // cut back
      if (i > 10) {
        return names;
      }
    }
    return names;
  }
}
