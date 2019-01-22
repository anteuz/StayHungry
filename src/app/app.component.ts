import {Component} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';

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
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private router: Router,
    private fireAuth: AngularFireAuth,
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
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    }).catch(e => console.log('Could not initialize platform'));
  }

  // Subscribe to Auth state changes, switch page automatically when loggin-in or out
  subscribeToAuthState() {
    this.fireAuth.auth.onAuthStateChanged(user => {
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
}
