import {Recipe} from './recipe';

export class Cart {

    constructor(public uuid: string, public recipes: Recipe[]) {}

}
