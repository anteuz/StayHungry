import {SimpleItem} from './simple-item';

export class Ingredient {
    public isCollected = false;
    public isBeingCollected = false;
    public isCollectedAsDefault = true;
    constructor(public uuid: string, public item: SimpleItem, public amount: string) {}
}
