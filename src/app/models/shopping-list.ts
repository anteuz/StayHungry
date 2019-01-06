import {Ingredient} from './ingredient';

export class ShoppingList {
    constructor(public uuid: string, public name: string, items: Ingredient[]) {}
}
