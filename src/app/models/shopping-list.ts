import {Ingredient} from './ingredient';

export class ShoppingList {

    public uuid: string = null;
    public name: string = null;
    public items: Ingredient[] = null;

    constructor(arg1: string, arg2: any, arg3?: Ingredient[] | null) {
        // Support legacy 2-arg usage: (name, items)
        if (Array.isArray(arg2) && arg3 === undefined) {
            this.uuid = null;
            this.name = arg1;
            this.items = (arg2 as Ingredient[]) || [];
            return;
        }

        // 3-arg usage: (uuid, name, items)
        this.uuid = arg1;
        this.name = arg2 as string;
        this.items = (arg3 === null ? null : (arg3 || [] as Ingredient[]));
    }
}
