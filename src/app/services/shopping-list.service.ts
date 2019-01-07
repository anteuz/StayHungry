import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {AngularFireDatabase} from '@angular/fire/database';
import {AuthService} from './auth.service';
import {Ingredient} from '../models/ingredient';

@Injectable({
    providedIn: 'root'
})
export class ShoppingListService {

    ref = null;
    DATABASE_PATH = null;
    public newIngredientEvent = new EventEmitter<Ingredient[]>();
    private ingredients: Ingredient[] = [];

    constructor(
        private httpClient: HttpClient,
        private authService: AuthService,
        private fireDatabase: AngularFireDatabase
    ) {
    }

    setupHandlers() {
        // Setup DB PATH
        this.DATABASE_PATH = 'users/' + this.authService.getUserUID() + '/shopping-list';
        // Subscribe to value changes
        this.fireDatabase.object(this.DATABASE_PATH).snapshotChanges().subscribe(action => {
            if (action) {
                this.ingredients = <Ingredient[]>action.payload.val();
                if (this.ingredients === null) {
                    this.ingredients = [];
                } else {
                    this.ingredients.sort(compare);
                }
                this.newIngredientEvent.emit(this.ingredients.slice());
            }
        });
    }

    addItem(ingredient: Ingredient) {
        this.ingredients.push(ingredient);
        this.updateDatabase();
    }

    addItems(ingredients: Ingredient[]) {
        this.ingredients.push(...ingredients);
        this.updateDatabase();
    }

    getItems() {
        return this.ingredients.slice();
    }

    removeItem(ingredient: Ingredient) {
        this.ingredients.splice(this.ingredients.indexOf(ingredient), 1);
        this.updateDatabase();
    }

    updateDatabase() {
        const itemRef = this.fireDatabase.object(this.DATABASE_PATH);
        itemRef.set(this.ingredients.slice());
    }

    updateItemStatuses(ingredients: Ingredient[]) {
        this.ingredients = ingredients;
        this.updateDatabase();
    }

    updateItem(data: Ingredient) {
        console.log(data);
        console.log('Data found with ingredient UUID: ' + this.findUsingUUID(data.uuid).toString());

        this.ingredients[this.ingredients.indexOf(this.findUsingUUID(data.uuid)[0])] = data;
        this.updateDatabase();
    }

    findUsingUUID(searchTerm) {
        return this.ingredients.filter((ingredient) => {
            return ingredient.uuid.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1;
        });
    }

}

export const snapshotToArray = snapshot => {
    const returnArr = [];

    snapshot.forEach(childSnapshot => {
        const item = childSnapshot.val();
        item.key = childSnapshot.key;
        returnArr.push(item);
    });

    return returnArr;
};

export const snapshotToObject = snapshot => {
    const item = snapshot.val();
    item.key = snapshot.key;

    return item;
};

function compare(a: Ingredient, b: Ingredient) {
    if (a.item.itemColor < b.item.itemColor) {
        return -1;
    }
    if (a.item.itemColor > b.item.itemColor) {
        return 1;
    }
    return 0;
}

