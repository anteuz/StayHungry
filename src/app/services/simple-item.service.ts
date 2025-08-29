import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {Database, ref, onValue, set} from '@angular/fire/database';
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
        private fireDatabase: Database
    ) {
    }

    setupHandlers() {
        if (!this.authService.isAuthenticated()) {
            console.error('Cannot setup item handlers: user not authenticated');
            return;
        }

        const userUID = this.authService.getUserUID();
        if (!userUID) {
            console.error('Cannot setup item handlers: no user UID');
            return;
        }

        // Setup DB PATH
        this.DATABASE_PATH = 'users/' + userUID + '/items';
        // Subscribe to value changes
        onValue(ref(this.fireDatabase, this.DATABASE_PATH), (snapshot) => {
            const value = snapshot.val() as SimpleItem[];
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
        if (!this.DATABASE_PATH || !this.authService.isAuthenticated()) {
            console.error('Cannot update database: user not authenticated or no database path set');
            return;
        }
        const itemRef = ref(this.fireDatabase, this.DATABASE_PATH);
        set(itemRef, this.items.slice()).catch(e => console.log('Could not update item in DB'));
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
            const filtered = this.items.filter((item) => {
                return item.itemName.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1;
            });
            
            // Sort by popularity (usage count) and recency
            return filtered
                .map(item => {
                    // Ensure backward compatibility for existing items
                    if (item.usageCount === undefined) {
                        item.usageCount = 0;
                    }
                    if (item.lastUsed === undefined) {
                        item.lastUsed = Date.now();
                    }
                    return item;
                })
                .sort((a, b) => {
                    // First sort by usage count (descending)
                    if (b.usageCount !== a.usageCount) {
                        return b.usageCount - a.usageCount;
                    }
                    // If usage count is the same, sort by last used (most recent first)
                    return b.lastUsed - a.lastUsed;
                });
        }
    }

    getPopularItems(limit: number = 20): SimpleItem[] {
        return this.items
            .slice() // Create a copy to avoid mutating original array
            .map(item => {
                // Ensure backward compatibility for existing items
                if (item.usageCount === undefined) {
                    item.usageCount = 0;
                }
                if (item.lastUsed === undefined) {
                    item.lastUsed = Date.now();
                }
                return item;
            })
            .sort((a, b) => {
                // Sort by usage count (descending), then by last used (most recent first)
                if (b.usageCount !== a.usageCount) {
                    return b.usageCount - a.usageCount;
                }
                return b.lastUsed - a.lastUsed;
            })
            .slice(0, limit);
    }

    incrementUsage(item: SimpleItem) {
        if (item.usageCount === undefined) {
            item.usageCount = 0;
        }
        item.usageCount++;
        item.lastUsed = Date.now();
        this.updateItem(item);
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
