import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {Database, ref, onValue, object, set} from '@angular/fire/database';
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
        private fireDatabase: Database
    ) {
    }

    setupHandlers() {
        console.log('Setting up recipe service..');
        
        if (!this.authService.isAuthenticated()) {
            console.error('Cannot setup recipe handlers: user not authenticated');
            return;
        }

        const userUID = this.authService.getUserUID();
        if (!userUID) {
            console.error('Cannot setup recipe handlers: no user UID');
            return;
        }

        // Setup DB PATH
        this.DATABASE_PATH = 'users/' + userUID + '/recipes';
        // Subscribe to value changes
        onValue(ref(this.fireDatabase, this.DATABASE_PATH), (snapshot) => {
            const payload = snapshot.val();
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
        if (!this.DATABASE_PATH || !this.authService.isAuthenticated()) {
            console.error('Cannot update database: user not authenticated or no database path set');
            return;
        }
        const itemRef = ref(this.fireDatabase, this.DATABASE_PATH);
        set(itemRef, this.recipes.slice()).catch(e => console.log('Could not update item in DB'));
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

    filterUsingCategory(category): Recipe[] {
        return this.recipes.filter(recipe => recipe.category === category);
    }
}
