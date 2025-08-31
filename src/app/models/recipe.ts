import {compare, groupByVanilla2} from '../shopping-list/shopping-list.page';
import {Ingredient} from './ingredient';

export class Recipe {
    public id?: string;
    public uuid: string = null;
    public name: string = null;
    public description: string = null;
    public imageURI: any = null;
    public image?: string[];
    public ingredients: Ingredient[] = null;
    public recipeIngredient: string[] = [];
    public recipeInstructions: string[] = [];
    public recipeYield?: string;
    public nutrition?: Record<string, any>;
    public tags?: string[];
    public categories?: string[];
    public language?: string;
    public sourceUrl?: string;
    public ownerId?: string;
    public familyId?: string;
    public createdBy?: string;
    public createdAt?: string;
    public updatedAt?: string;
    public category: string = 'food';
    ingredientMap: Map<string, Ingredient[]>;

    constructor(
        uuid: string,
        name: string,
        description: string,
        imageURI: any,
        ingredients: Ingredient[],
        category: string,
        recipeInstructions?: string[],
        recipeIngredient?: string[],
        sourceUrl?: string,
        tags?: string[],
        nutrition?: Record<string, any>
    ) {
        this.uuid = uuid;
        this.id = uuid;
        this.name = name;
        this.description = description;
        this.imageURI = imageURI;
        this.ingredients = ingredients || null;
        this.category = category || 'food';
        this.recipeInstructions = recipeInstructions || [];
        this.recipeIngredient = recipeIngredient || [];
        this.sourceUrl = sourceUrl;
        this.tags = tags || [];
        this.nutrition = nutrition;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Convert from ScrapedRecipe to Recipe
     */
    static fromScrapedRecipe(scrapedRecipe: any): Recipe {
        return new Recipe(
            scrapedRecipe.id || scrapedRecipe.uuid || Date.now().toString(36) + Math.random().toString(36).substr(2),
            scrapedRecipe.name,
            scrapedRecipe.description || '',
            scrapedRecipe.image?.[0] || scrapedRecipe.imageURI,
            scrapedRecipe.ingredients || [],
            scrapedRecipe.category || 'food',
            scrapedRecipe.recipeInstructions || [],
            scrapedRecipe.recipeIngredient || [],
            scrapedRecipe.sourceUrl,
            scrapedRecipe.tags || [],
            scrapedRecipe.nutrition
        );
    }

    /**
     * Convert to ScrapedRecipe format
     */
    toScrapedRecipe(): any {
        return {
            id: this.uuid,
            name: this.name,
            image: this.imageURI ? [this.imageURI] : this.image,
            description: this.description,
            recipeYield: this.recipeYield,
            recipeIngredient: this.recipeIngredient,
            recipeInstructions: this.recipeInstructions,
            nutrition: this.nutrition,
            tags: this.tags,
            categories: this.categories,
            language: this.language,
            sourceUrl: this.sourceUrl,
            ownerId: this.ownerId,
            familyId: this.familyId,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
