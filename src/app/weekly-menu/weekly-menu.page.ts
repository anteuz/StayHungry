import {Component, OnInit, ViewChild} from '@angular/core';
import {WeeklyMenuService, WeeklyMenu} from '../services/weekly-menu.service';
import {AuthService} from '../services/auth.service';

@Component({
    selector: 'app-weekly-menu',
    templateUrl: './weekly-menu.page.html',
    styleUrls: ['./weekly-menu.page.scss'],
})
export class WeeklyMenuPage implements OnInit {

    weeklyMenus: WeeklyMenu[] = [];
    currentWeekMenu: WeeklyMenu | null = null;
    menu: string[] = [];

    constructor(
        private weeklyMenuService: WeeklyMenuService,
        private authService: AuthService
    ) {
    }

    ngOnInit() {
        this.setupWeeklyMenuHandlers();
    }

    setupWeeklyMenuHandlers() {
        if (this.authService.isAuthenticated()) {
            this.weeklyMenuService.setupHandlers();
            this.weeklyMenuService.weeklyMenuEvent.subscribe((menus: WeeklyMenu[]) => {
                this.weeklyMenus = menus;
                this.loadCurrentWeekMenu();
            });
        }
    }

    loadCurrentWeekMenu() {
        // Get current week start (Monday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so we need 6 days back
        const monday = new Date(now);
        monday.setDate(now.getDate() - daysToMonday);
        monday.setHours(0, 0, 0, 0);
        
        const weekStart = monday.toISOString().split('T')[0];
        this.currentWeekMenu = this.weeklyMenuService.findUsingWeekStart(weekStart);
        
        if (!this.currentWeekMenu) {
            // Create a new menu for current week
            this.currentWeekMenu = {
                uuid: this.generateUUID(),
                weekStart: weekStart,
                days: {
                    monday: {},
                    tuesday: {},
                    wednesday: {},
                    thursday: {},
                    friday: {},
                    saturday: {},
                    sunday: {}
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.weeklyMenuService.addMenu(this.currentWeekMenu);
        }
        
        // Prepare array used by the reorder group
        if (this.currentWeekMenu) {
            this.menu = Object.keys(this.currentWeekMenu.days || {});
        } else {
            this.menu = [];
        }
    }

    doReorder(ev: any) {
        // The `from` and `to` properties contain the index of the item
        // when the drag started and ended, respectively
        console.log('Dragged from index', ev.detail.from, 'to', ev.detail.to);
        console.log('Before:' + this.currentWeekMenu);
        
        // Finish the reorder and position the item in the DOM based on
        // where the gesture ended. This method can also be called directly
        // by the reorder group
        this.menu = ev.detail.complete(this.menu);
        console.log('After:' + this.currentWeekMenu);
        
        // Update the menu in database
        if (this.currentWeekMenu) {
            this.currentWeekMenu.updatedAt = new Date().toISOString();
            this.weeklyMenuService.updateMenu(this.currentWeekMenu);
        }
    }

    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
