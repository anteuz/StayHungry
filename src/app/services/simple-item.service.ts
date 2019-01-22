import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {AngularFireDatabase} from '@angular/fire/database';
import {SimpleItem} from '../models/simple-item';
import {AuthService} from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class SimpleItemService {

    ref = null;
    DATABASE_PATH = null;
    public newItemEvent = new EventEmitter<SimpleItem[]>();
    private items: SimpleItem[] = [];

    constructor(
        private httpClient: HttpClient,
        private authService: AuthService,
        private fireDatabase: AngularFireDatabase
    ) {
    }

    setupHandlers() {
        // Setup DB PATH
        this.DATABASE_PATH = 'users/' + this.authService.getUserUID() + '/items';
        // Subscribe to value changes
        this.fireDatabase.object(this.DATABASE_PATH).valueChanges().subscribe((value: SimpleItem[]) => {
            if (value) {
                this.items = value;
                if (this.items === null) {
                    this.items = [];
                }
                this.newItemEvent.emit(this.items.slice());
            }
        });
    }

    addItem(item: SimpleItem) {
        this.items.push(item);
        this.updateDatabase();
    }

    addItems(items: SimpleItem[]) {
        this.items.push(...items);
        this.updateDatabase();
    }

    getItems() {
        return this.items.slice();
    }

    removeItem(item: SimpleItem) {
        this.items.splice(this.items.indexOf(item), 1);
        this.updateDatabase();
    }

    updateDatabase() {
        const itemRef = this.fireDatabase.object(this.DATABASE_PATH);
        itemRef.set(this.items.slice()).catch(e => console.log('Could not update item in DB'));
    }

    updateItemStatuses(items: SimpleItem[]) {
        this.items = items;
        this.updateDatabase();
    }

    filterItems(searchTerm: string, exact: boolean) {
        console.log(this.items);
        console.log(searchTerm);
        console.log(exact);
        if (exact) {
            return this.items.filter((item) => {
                return item.itemName.toLowerCase() === searchTerm.toLowerCase();
            });
        } else {
            return this.items.filter((item) => {
                return item.itemName.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1;
            });
        }
    }

    updateItem(item: SimpleItem) {
        this.items[this.items.indexOf(item)] = item;
        this.updateDatabase();
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
