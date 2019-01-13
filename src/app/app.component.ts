import {Component} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';

import {Platform} from '@ionic/angular';
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
    private stateService: SimpleStateService
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready().then(() => {
      this.subscribeToAuthState();
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  // Subscribe to Auth state changes, switch page automatically when loggin-in or out
  async subscribeToAuthState() {
    await this.fireAuth.auth.onAuthStateChanged(user => {
          if (user) {
            console.log('Authed user');
            this.isAuthenticated = true;
            this.stateService.setupHandlers();
            this.itemService.setupHandlers();
            this.slService.setupHandlers();
            this.router.navigate(['/']);


          } else {
            console.log('Signed off user');
            this.isAuthenticated = false;
            this.router.navigate(['sign-in']);
          }
        }
    );
  }
}
