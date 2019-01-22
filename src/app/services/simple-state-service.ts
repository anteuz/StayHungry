import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {AngularFireDatabase} from '@angular/fire/database';
import {AppState} from '../models/app-state';
import {AuthService} from './auth.service';
import { Storage } from '@ionic/storage';

@Injectable({
    providedIn: 'root'
})
export class SimpleStateService {

    private DATABASE_PATH = null;
    public newAppState = new EventEmitter<AppState>();
    private appState: AppState = null;

    constructor(
        private httpClient: HttpClient,
        private authService: AuthService,
        private fireDatabase: AngularFireDatabase,
        private storage: Storage
    ) {
    }

    async setupHandlers() {
        this.appState = await this.getAppState();
        if (this.appState == null) {
            this.appState = new AppState(null);
        }
    }
    updateDatabase() {
        this.storage.set('state', JSON.stringify(this.appState)).catch(e => console.log('Could not store state'));
    }

    async getAppState() {
        return await this.storage.get('state').then((val) => {
            return JSON.parse(val);
        });
    }
    updateLastVisitedShoppingList(shoppingListUUID: string) {
        if (this.appState == null) {
            this.appState = new AppState(shoppingListUUID);
        }
        this.appState.lastVisited_ShoppingList = shoppingListUUID;
        this.updateDatabase();
    }
}
