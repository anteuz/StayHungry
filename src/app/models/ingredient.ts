import {SimpleItem} from './simple-item';

export class Ingredient {
    public uuid: string = null;
    public item: SimpleItem = null;
    public amount: number = 0;
    public unit?: string;
    public isCollected = false;
    public isBeingCollected = false;
    public isCollectedAsDefault = true;

    // Overloads: (uuid, item, amount, unit?) or (item, amount, unit?)
    constructor(uuid: string, item: SimpleItem, amount: number | string, unit?: string);
    constructor(item: SimpleItem, amount: number, unit?: string);
    constructor(arg1: any, arg2: any, arg3?: any, arg4?: any) {
        if (typeof arg1 === 'string' && arg2 instanceof SimpleItem) {
            // Signature: (uuid, item, amount, unit?)
            this.uuid = arg1;
            this.item = arg2 as SimpleItem;
            this.amount = typeof arg3 === 'number' ? arg3 : parseFloat(String(arg3 ?? 0)) || 0;
            this.unit = arg4;
        } else {
            // Signature: (item, amount, unit?)
            this.uuid = null;
            this.item = arg1 as SimpleItem;
            this.amount = typeof arg2 === 'number' ? arg2 : parseFloat(String(arg2 ?? 0)) || 0;
            this.unit = arg3;
        }
    }
}
