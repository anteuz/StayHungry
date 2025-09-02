import {Component} from '@angular/core';
import {Auth, onAuthStateChanged} from '@angular/fire/auth';
import {Router} from '@angular/router';

import {Platform} from '@ionic/angular';
import {RecipeServiceService} from './services/recipe-service.service';
import {ShoppingListService} from './services/shopping-list.service';
import {SimpleItemService} from './services/simple-item.service';
import {WeeklyMenuService} from './services/weekly-menu.service';
import {SimpleStateService} from './services/simple-state-service';
import {ThemeService} from './services/theme.service';
import {AuthService} from './services/auth.service';
import {UserStorageService, UserData} from './services/user-storage.service';
import {UserProfileService} from './services/user-profile.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {

  public isAuthenticated = false;

  constructor(
    private platform: Platform,
    private router: Router,
    private fireAuth: Auth,
    private authService: AuthService,
    private userStorageService: UserStorageService,
    private slService: ShoppingListService,
    private itemService: SimpleItemService,
    private stateService: SimpleStateService,
    private recipeService: RecipeServiceService,
    private themeService: ThemeService,
    private userProfileService: UserProfileService,
    private weeklyMenuService: WeeklyMenuService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    console.log('Initializing app...');
    
    // Web-specific initialization
    this.applyWebFixes();
    
    this.platform.ready().then(() => {
      console.log('Platform ready');
      this.subscribeToAuthState();
      
      // Initialize theme service - this will auto-detect system preferences
      // and apply the appropriate theme
      
      // Web-only status bar handling
      this.updateStatusBarForTheme();
    }).catch(e => console.log('Could not initialize platform:', e));
  }

  private applyWebFixes() {
    // Apply web-specific CSS fixes
    if (typeof document !== 'undefined') {
      // Ensure proper background color on web
      document.documentElement.style.setProperty('--ion-background-color', '#ffffff');
      document.documentElement.style.setProperty('--ion-text-color', '#000000');
      
      // Add web-specific class to body
      document.body.classList.add('web-app');
    }
  }

  private updateStatusBarForTheme() {
    // Web-only theme handling - no native status bar
    const currentTheme = this.themeService.getCurrentTheme();
    console.log('Current theme:', currentTheme);
    
    // Apply theme to document body
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-theme', currentTheme);
    }
  }

  // Subscribe to Auth state changes, switch page automatically when loggin-in or out
  subscribeToAuthState() {
    onAuthStateChanged(this.fireAuth, async (user) => {
          if (user) {
            console.log('Authed user');
            
            // Store user data
            const userData: UserData = {
              email: user.email || '',
              uid: user.uid,
              displayName: user.displayName || undefined,
              photoURL: user.photoURL || undefined,
              providerId: user.providerData[0]?.providerId || undefined,
              lastLogin: new Date()
            };
            await this.userStorageService.storeUserData(userData);
            
            // Initialize services consistently
            try {
              await this.stateService.setupHandlers();
              console.log('State service initialized');

              // Following services are synchronous setup; wrap in try/catch for safety
              try {
                this.itemService.setupHandlers();
                console.log('Item service initialized');
              } catch (e) {
                console.error('Error initializing item service:', e);
              }

              try {
                this.slService.setupHandlers();
                console.log('Shopping list service initialized');
              } catch (e) {
                console.error('Error initializing shopping list service:', e);
              }

              try {
                this.recipeService.setupHandlers();
                console.log('Recipe service initialized');
              } catch (e) {
                console.error('Error initializing recipe service:', e);
              }

              try {
                this.userProfileService.setupHandlers();
                console.log('User profile service initialized');
              } catch (e) {
                console.error('Error initializing user profile service:', e);
              }

              // WeeklyMenuService may not exist in this codebase; guard call
              try {
                if (this.weeklyMenuService && typeof this.weeklyMenuService.setupHandlers === 'function') {
                  this.weeklyMenuService.setupHandlers();
                  console.log('Weekly menu service initialized');
                }
              } catch (e) {
                console.error('Error initializing weekly menu service:', e);
              }

            } catch (e) {
              console.error('Error during service initialization:', e);
            }
            
            this.isAuthenticated = true;
            // this.router.navigate(['/']);

          } else {
            console.log('Signed off user');
            this.isAuthenticated = false;
            this.router.navigate(['sign-in']).catch(e => console.log(e));
          }
        }
    );
  }
  
  onLogout() {
    this.authService.logout();
  }
}
