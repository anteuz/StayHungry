import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {Database, ref, onValue, set} from '@angular/fire/database';
import {AppState} from '../models/app-state';
import {AuthService} from './auth.service';
import { Storage } from '@ionic/storage-angular';

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
        private fireDatabase: Database,
        private storage: Storage
    ) {
        // Initialize storage
        this.initStorage();
    }

    async initStorage() {
        await this.storage.create();
    }

    async setupHandlers() {
        this.appState = await this.getAppState();
        if (this.appState == null) {
            this.appState = new AppState(null);
        }
    }
    async updateDatabase() {
        try {
            if (!this.storage) {
                await this.initStorage();
            }
            await this.storage.set('state', JSON.stringify(this.appState));
        } catch (e) {
            console.log('Could not store state:', e);
        }
    }

    async getAppState() {
        try {
            if (!this.storage) {
                await this.initStorage();
            }
            const val = await this.storage.get('state');
            return val ? JSON.parse(val) : null;
        } catch (e) {
            console.log('Could not get app state:', e);
            return null;
        }
    }
    updateLastVisitedShoppingList(shoppingListUUID: string) {
        if (this.appState == null) {
            this.appState = new AppState(shoppingListUUID);
        }
        this.appState.lastVisited_ShoppingList = shoppingListUUID;
        this.updateDatabase();
    }
}
