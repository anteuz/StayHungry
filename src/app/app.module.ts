import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {AngularFireModule} from '@angular/fire';
import {AngularFireAuth, AngularFireAuthModule} from '@angular/fire/auth';
import {AngularFireDatabase, AngularFireDatabaseModule} from '@angular/fire/database';
import {AngularFireStorageModule} from '@angular/fire/storage';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';
import {ImageResizer} from '@ionic-native/image-resizer/ngx';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';

import {IonicModule, IonicRouteStrategy} from '@ionic/angular';
import {IonicStorageModule} from '@ionic/storage';
import {environment} from '../environments/environment';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {IngredientOverlayPage} from './ingredient-overlay/ingredient-overlay.page';
import {CloudStoreService} from './services/cloud-store.service';
import {RecipeServiceService} from './services/recipe-service.service';
import {SimpleStateService} from './services/simple-state-service';
import {SharedModule} from './shared/shared-module';
import {ShoppingListService} from './services/shopping-list.service';
import {SimpleItemService} from './services/simple-item.service';
import { ServiceWorkerModule } from '@angular/service-worker';
import { ShoppingListItemsComponent } from './shopping-list-items/shopping-list-items.component';
import { CartPopoverComponent } from './cart-popover/cart-popover.component';
import { ShoppingListTransferComponent } from './shopping-list-transfer/shopping-list-transfer.component';

@NgModule({
    declarations: [
        AppComponent,
        IngredientOverlayPage,
        ShoppingListItemsComponent,
        CartPopoverComponent,
        ShoppingListTransferComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        IonicModule.forRoot(),
        IonicStorageModule.forRoot(),
        AppRoutingModule,
        AngularFireModule.initializeApp(environment.firebase, 'my-recipe-book-anteuz'),
        AngularFireDatabaseModule,
        AngularFireAuthModule,
        AngularFireStorageModule,
        HttpClientModule,
        SharedModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
    ],
    providers: [
        StatusBar,
        SplashScreen,
        AngularFireDatabase,
        AngularFireAuth,
        ShoppingListService,
        SimpleItemService,
        SimpleStateService,
        CloudStoreService,
        RecipeServiceService,
        ImageResizer,
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
