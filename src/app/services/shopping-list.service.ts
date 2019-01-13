import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {AngularFireDatabase} from '@angular/fire/database';
import {hasOwnProperty} from 'tslint/lib/utils';
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
        private fireDatabase: AngularFireDatabase
    ) {}

    setupHandlers() {
        // Setup DB PATH
        this.DATABASE_PATH = 'users/' + this.authService.getUserUID() + '/shopping-list';
        // Subscribe to value changes
        this.fireDatabase.object(this.DATABASE_PATH).valueChanges().subscribe((payload: ShoppingList[]) => {
            if (payload) {
                this.shoppingLists = payload;
                if (this.shoppingLists === null) {
                    this.shoppingLists = [];
                }
                this.shoppingListsEvent.emit(this.shoppingLists.slice());
            }
        });
    }

    addItem(shoppingList: ShoppingList) {
        if (this.shoppingLists == null) {
            this.shoppingLists = [];
        }
        this.shoppingLists.push(shoppingList);
        this.updateDatabase();
    }

    addItems(shoppingLists: ShoppingList[]) {
        if (this.shoppingLists == null) {
            this.shoppingLists = [];
        }
        this.shoppingLists.push(... shoppingLists);
        this.updateDatabase();
    }

    getItems() {
        return this.shoppingLists.slice();
    }

    removeShoppingList(shoppingList: ShoppingList) {
        this.shoppingLists.splice(this.shoppingLists.indexOf(shoppingList), 1);
        this.updateDatabase();
    }

    updateDatabase() {
        const itemRef = this.fireDatabase.object(this.DATABASE_PATH);
        itemRef.set(this.shoppingLists.slice());
    }

    updateShoppingLists(shoppingList: ShoppingList[]) {
        if (this.shoppingLists == null) {
            this.shoppingLists = [];
        }
        this.shoppingLists = shoppingList;
        this.updateDatabase();
    }

    updateShoppingList(data: ShoppingList) {
        this.shoppingLists[this.shoppingLists.indexOf(this.findUsingUUID(data.uuid))] = data;
        this.updateDatabase();
    }

    findUsingUUID(searchTerm): ShoppingList {
        return this.shoppingLists.find(shoppingList => shoppingList.uuid === searchTerm);
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
