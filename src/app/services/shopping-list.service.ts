import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {Database, ref, onValue, set} from '@angular/fire/database';
import {ShoppingList} from '../models/shopping-list';
import {AuthService} from './auth.service';
import {Ingredient} from '../models/ingredient';

@Injectable({
    providedIn: 'root'
})
export class ShoppingListService {

    ref = null;
    DATABASE_PATH = null;

    public shoppingListsEvent = new EventEmitter<ShoppingList[]>();

    private ingredients: Ingredient[] = [];

    private shoppingLists: ShoppingList [] = null;

    constructor(
        private httpClient: HttpClient,
        private authService: AuthService,
        private fireDatabase: Database
    ) {
    }

    setupHandlers() {
        if (!this.authService.isAuthenticated()) {
            throw new Error('Cannot setup shopping list handlers: user not authenticated');
        }

        const userUID = this.authService.getUserUID();
        if (!userUID) {
            throw new Error('Cannot setup shopping list handlers: no user UID');
        }

        // Setup DB PATH
        this.DATABASE_PATH = 'users/' + userUID + '/shopping-list';
        console.log('Database path set to:', this.DATABASE_PATH);
        
        // Subscribe to value changes
        onValue(ref(this.fireDatabase, this.DATABASE_PATH), (snapshot) => {
            const payload = snapshot.val() as ShoppingList[];
            
            // Handle all cases: null, undefined, empty array, or actual data
            if (payload) {
                this.shoppingLists = Array.isArray(payload) ? payload : [];
            } else {
                // User has no shopping lists in database
                this.shoppingLists = [];
            }
            
            // Always emit the event so the UI knows we've finished loading
            this.shoppingListsEvent.emit(this.shoppingLists.slice());
        });
    }

    addItem(shoppingList: ShoppingList) {
        if (this.shoppingLists == null) {
            this.shoppingLists = [];
        }
        this.shoppingLists.push(shoppingList);
        this.updateDatabase();
    }

    addItemToShoppingList(shoppingList: ShoppingList, ingredient: Ingredient) {
        // Create new shopping list if empty, else check if ingredient already exists and increment amount
        if (this.shoppingLists == null) {
            this.shoppingLists = [];
        } else {

            const existingIngredient = this.findUsingIngredientName(shoppingList, (ingredient.item as any).itemName);

            if (existingIngredient != null) {
                existingIngredient.amount = (Number(existingIngredient.amount) || 0) + (Number(ingredient.amount) || 0);
                shoppingList.items[shoppingList.items.indexOf(this.findUsingIngredientUUID(shoppingList, existingIngredient.uuid))] = existingIngredient;
            } else {
                shoppingList.items.push(ingredient);
            }
        }

        this.shoppingLists.push(shoppingList);
        this.updateDatabase();
    }

    addItems(shoppingList: ShoppingList, ingredients: Ingredient[]) {
        if (this.shoppingLists == null) {
            this.shoppingLists = [];
        }
        this.shoppingLists.push(shoppingList);
        this.updateDatabase();
    }

    getItems() {
        return this.shoppingLists ? this.shoppingLists.slice() : [];
    }

    removeShoppingList(shoppingList: ShoppingList) {
        this.shoppingLists.splice(this.shoppingLists.indexOf(shoppingList), 1);
        this.updateDatabase();
    }

    updateDatabase() {
        if (!this.authService.isAuthenticated()) {
            console.error('Cannot update database: user not authenticated');
            return Promise.reject('User not authenticated');
        }
        
        const userUID = this.authService.getUserUID();
        if (!userUID) {
            console.error('Cannot update database: no user UID available');
            return Promise.reject('No user UID available');
        }
        
        if (!this.DATABASE_PATH) {
            console.error('Cannot update database: no database path set');
            return Promise.reject('No database path set');
        }
        
        console.log('Updating database with shopping lists:', this.shoppingLists?.length || 0, 'lists');
        console.log('Database path:', this.DATABASE_PATH);
        console.log('User UID:', userUID);
        
        const itemRef = ref(this.fireDatabase, this.DATABASE_PATH);
        
        return set(itemRef, this.shoppingLists.slice())
            .then(() => {
                console.log('Successfully updated shopping lists in database');
            })
            .catch(e => {
                console.error('Failed to update shopping lists in database:', e);
                throw e;
            });
    }

    updateShoppingLists(shoppingList: ShoppingList[]) {
        if (this.shoppingLists == null) {
            this.shoppingLists = [];
        }
        this.shoppingLists = shoppingList;
        this.updateDatabase();
    }

    updateShoppingList(data: ShoppingList) {
        if (!this.shoppingLists || !data || !data.uuid) {
            return Promise.reject(new Error('Invalid data or no shopping lists loaded'));
        }
        
        const index = this.shoppingLists.findIndex(sl => sl && sl.uuid === data.uuid);
        if (index !== -1) {
            this.shoppingLists[index] = data;
            return this.updateDatabase();
        } else {
            return Promise.reject(new Error('Shopping list not found'));
        }
    }

    findUsingUUID(searchTerm): ShoppingList {
        if (!this.shoppingLists || !searchTerm) {
            return null;
        }
        return this.shoppingLists.find(shoppingList => shoppingList && shoppingList.uuid === searchTerm) || null;
    }

    findUsingIngredientName(shoppingList: ShoppingList, searchTerm): Ingredient {
        return shoppingList.items.find(item => (item.item as any).itemName === searchTerm);
    }

    findUsingIngredientUUID(shoppingList: ShoppingList, searchTerm): Ingredient {
        return shoppingList.items.find(item => item.uuid === searchTerm);
    }
}
