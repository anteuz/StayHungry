import {SimpleItem} from './simple-item';

export class Ingredient {
    isCollected = false;
    isBeingCollected = false;
    constructor(public uuid: string, public item: SimpleItem, public amount: string) {}
}
