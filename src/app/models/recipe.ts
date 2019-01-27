import {compare, groupByVanilla2} from '../shopping-list/shopping-list.page';
import {Ingredient} from './ingredient';

export class Recipe {
    public uuid: string = null;
    public name: string = null;
    public description: string = null;
    public imageURI: any = null;
    public ingredients: Ingredient [] = null;
    ingredientMap: Map<string, Ingredient[]>;

    constructor(
        uuid: string,
        name: string,
        description: string,
        imageURI: any,
        ingredients: Ingredient []
    ) {
        this.uuid = uuid;
        this.name = name;
        this.description = description;
        this.imageURI = imageURI;
        this.ingredients = ingredients || null;
    }
}
