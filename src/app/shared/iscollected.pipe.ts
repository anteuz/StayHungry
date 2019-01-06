import { Pipe, PipeTransform } from '@angular/core';
import {Ingredient} from '../models/ingredient';

@Pipe({
  name: 'isCollected',
  pure: false
})
export class IsCollectedPipe implements PipeTransform {
  transform(items: Ingredient[], filter: boolean): any {

    if (!items) {
      return items;
    }
    // filter items array, items which match and return true will be
    // kept, false will be filtered out
    return items.filter(item => item.isCollected === filter);
  }
}
