import {Ingredient} from './ingredient';

export class ShoppingList {

    public uuid: string = null;
    public name: string = null;
    public items: Ingredient[] = null;
    constructor(uuid: string, name: string, items: Ingredient[]) {
        this.uuid = uuid;
        this.name = name;
        this.items = items || null;
    }
}
