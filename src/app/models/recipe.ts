import {Ingredient} from './ingredient';

export class Recipe {
    public uuid: string = null;
    public name: string = null;
    public description: string = null;
    public imageURI: string = null;
    public ingredients: Ingredient [] = null;

    constructor(
        uuid: string,
        name: string,
        description: string,
        imageURI: string,
        ingredients: Ingredient []
    ) {
        this.uuid = uuid;
        this.name = name;
        this.description = description;
        this.imageURI = imageURI;
        this.ingredients = ingredients || null;
    }
}
