import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {AngularFireDatabase} from '@angular/fire/database';
import {Recipe} from '../models/recipe';
import {AuthService} from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class RecipeServiceService {

    ref = null;
    DATABASE_PATH = null;
    public recipeEvent = new EventEmitter<Recipe[]>();
    private recipes: Recipe[] = [];

    constructor(
        private httpClient: HttpClient,
        private authService: AuthService,
        private fireDatabase: AngularFireDatabase
    ) {
    }

    setupHandlers() {
        console.log('Setting up recipe service..');
        // Setup DB PATH
        this.DATABASE_PATH = 'users/' + this.authService.getUserUID() + '/recipes';
        // Subscribe to value changes
        this.fireDatabase.list<Recipe>(this.DATABASE_PATH).valueChanges().subscribe((payload) => {
            if (payload) {
                this.recipes = payload;
                console.log(payload);
                if (this.recipes === null) {
                    this.recipes = [];
                }
                this.recipeEvent.emit(this.recipes.slice());
            }
        });
    }

    addItem(recipe: Recipe) {
        if (this.recipes == null) {
            this.recipes = [];
        }
        this.recipes.push(recipe);
        this.updateDatabase();
    }

    getItems() {
        return this.recipes.slice();
    }

    removeRecipe(recipe: Recipe) {
        this.recipes.splice(this.recipes.indexOf(recipe), 1);
        this.updateDatabase();
    }

    updateDatabase() {
        const itemRef = this.fireDatabase.object(this.DATABASE_PATH);
        itemRef.set(this.recipes.slice()).catch(e => console.log('Could not update item in DB'));
    }

    updateRecipes(recipes: Recipe[]) {
        if (this.recipes == null) {
            this.recipes = [];
        }
        this.recipes = recipes;
        this.updateDatabase();
    }

    updateRecipe(data: Recipe) {
        this.recipes[this.recipes.indexOf(this.findUsingUUID(data.uuid))] = data;
        this.updateDatabase();
    }

    findUsingUUID(searchTerm): Recipe {
        return this.recipes.find(recipe => recipe.uuid === searchTerm);
    }
}
