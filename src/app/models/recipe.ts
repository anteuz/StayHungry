import {compare, groupByVanilla2} from '../shopping-list/shopping-list.page';
import {Ingredient} from './ingredient';

export class Recipe {
    public uuid: string = null;
    public name: string = null;
    public description: string = null;
    public imageURI: any = null;
    public ingredients: Ingredient [] = null;
    public recipeIngredient: Ingredient [] = null; // Legacy property for backward compatibility
    ingredientMap: Map<string, Ingredient[]>;
    public category: string = 'food';

    constructor(
        uuid: string,
        name: string,
        description: string,
        imageURI: any,
        ingredients: Ingredient [],
        category: string
    ) {
        this.uuid = uuid;
        this.name = name;
        this.description = description;
        this.imageURI = imageURI;
        this.ingredients = ingredients || null;
        this.recipeIngredient = ingredients || null; // Legacy property for backward compatibility
        this.category = category || 'food';
    }
}
