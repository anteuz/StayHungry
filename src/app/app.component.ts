import {Component} from '@angular/core';
import {Auth, onAuthStateChanged, signOut} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {SplashScreen} from '@capacitor/splash-screen';
import {StatusBar, Style} from '@capacitor/status-bar';

import {Platform} from '@ionic/angular';
import {RecipeServiceService} from './services/recipe-service.service';
import {ShoppingListService} from './services/shopping-list.service';
import {SimpleItemService} from './services/simple-item.service';
import {SimpleStateService} from './services/simple-state-service';

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
    private slService: ShoppingListService,
    private itemService: SimpleItemService,
    private stateService: SimpleStateService,
    private recipeService: RecipeServiceService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.subscribeToAuthState();
      
      // Only set StatusBar style on native platforms
      if (this.platform.is('hybrid')) {
        StatusBar.setStyle({ style: Style.Default });
        SplashScreen.hide();
      }
    }).catch(e => console.log('Could not initialize platform'));
  }

  // Subscribe to Auth state changes, switch page automatically when loggin-in or out
  subscribeToAuthState() {
    onAuthStateChanged(this.fireAuth, (user) => {
          if (user) {
            console.log('Authed user');
            this.stateService.setupHandlers().then(() => {
              this.itemService.setupHandlers();
              this.slService.setupHandlers();
              this.recipeService.setupHandlers();
            }).catch(e => console.log(e));
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
    signOut(this.fireAuth);
  }
}
