import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {Database, ref, onValue, set} from '@angular/fire/database';
import {AuthService} from './auth.service';

export interface WeeklyMenu {
  uuid: string;
  weekStart: string; // ISO date string
  days: {
    [day: string]: {
      breakfast?: string;
      lunch?: string;
      dinner?: string;
      snacks?: string[];
    };
  };
  createdAt: string;
  updatedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class WeeklyMenuService {

    ref = null;
    DATABASE_PATH = null;
    public weeklyMenuEvent = new EventEmitter<WeeklyMenu[]>();
    private weeklyMenus: WeeklyMenu[] = [];

    constructor(
        private httpClient: HttpClient,
        private authService: AuthService,
        private fireDatabase: Database
    ) {
    }

    setupHandlers() {
        console.log('Setting up Weekly Menu service..');
        
        try {
            if (!this.authService.isAuthenticated()) {
                console.error('Cannot setup weekly menu handlers: user not authenticated');
                return;
            }

            const userUID = this.authService.getUserUID();
            if (!userUID) {
                console.error('Cannot setup weekly menu handlers: no user UID');
                return;
            }

            // Setup DB PATH
            this.DATABASE_PATH = 'users/' + userUID + '/weekly-menu';
            // Subscribe to value changes
            onValue(ref(this.fireDatabase, this.DATABASE_PATH), (snapshot) => {
                const payload = snapshot.val() as WeeklyMenu[];
                console.log('Weekly menus loaded from Firebase:', payload);
                
                // Handle all cases: null, undefined, empty array, or actual data
                if (payload) {
                    this.weeklyMenus = Array.isArray(payload) ? payload : [];
                } else {
                    // User has no weekly menus in database
                    this.weeklyMenus = [];
                }
                
                // Always emit the event so the UI knows we've finished loading
                this.weeklyMenuEvent.emit(this.weeklyMenus.slice());
            });
            console.log(this.DATABASE_PATH);
        } catch (error) {
            console.error('Error setting up weekly menu handlers:', error);
        }
    }

    addMenu(menu: WeeklyMenu) {
        if (this.weeklyMenus == null) {
            this.weeklyMenus = [];
        }
        this.weeklyMenus.push(menu);
        this.updateDatabase();
    }

    getMenus() {
        return this.weeklyMenus ? this.weeklyMenus.slice() : [];
    }

    removeMenu(menu: WeeklyMenu) {
        this.weeklyMenus.splice(this.weeklyMenus.indexOf(menu), 1);
        this.updateDatabase();
    }

    updateDatabase() {
        if (!this.DATABASE_PATH || !this.authService.isAuthenticated()) {
            console.error('Cannot update database: user not authenticated or no database path set');
            return Promise.reject('User not authenticated or no database path');
        }
        
        console.log('Updating database with weekly menus:', this.weeklyMenus?.length || 0, 'menus');
        const itemRef = ref(this.fireDatabase, this.DATABASE_PATH);
        
        return set(itemRef, this.weeklyMenus.slice())
            .then(() => {
                console.log('Successfully updated weekly menus in database');
            })
            .catch(e => {
                console.error('Failed to update weekly menus in database:', e);
                throw e;
            });
    }

    updateMenus(menus: WeeklyMenu[]) {
        if (this.weeklyMenus == null) {
            this.weeklyMenus = [];
        }
        this.weeklyMenus = menus;
        this.updateDatabase();
    }

    updateMenu(data: WeeklyMenu) {
        if (!this.weeklyMenus || !data || !data.uuid) {
            console.error('Cannot update weekly menu: invalid data or no menus loaded');
            return Promise.reject('Invalid data or no menus loaded');
        }
        
        const index = this.weeklyMenus.findIndex(menu => menu && menu.uuid === data.uuid);
        if (index !== -1) {
            this.weeklyMenus[index] = data;
            console.log('Weekly menu updated locally, saving to database:', data.uuid);
            return this.updateDatabase();
        } else {
            console.error('Weekly menu not found for update:', data.uuid);
            return Promise.reject('Weekly menu not found');
        }
    }

    findUsingUUID(searchTerm): WeeklyMenu {
        if (!this.weeklyMenus || !searchTerm) {
            return null;
        }
        return this.weeklyMenus.find(menu => menu && menu.uuid === searchTerm);
    }

    findUsingWeekStart(weekStart: string): WeeklyMenu {
        if (!this.weeklyMenus || !weekStart) {
            return null;
        }
        return this.weeklyMenus.find(menu => menu && menu.weekStart === weekStart);
    }
}
