import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {AngularFireModule} from '@angular/fire';
import {AngularFireAuth, AngularFireAuthModule} from '@angular/fire/auth';
import {AngularFireDatabase, AngularFireDatabaseModule} from '@angular/fire/database';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';

import {IonicModule, IonicRouteStrategy} from '@ionic/angular';
import {IonicStorageModule} from '@ionic/storage';
import {environment} from '../environments/environment';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {IngredientOverlayPage} from './ingredient-overlay/ingredient-overlay.page';
import {PersistenceOverlayComponent} from './persistence-overlay/persistence-overlay.component';
import {SimpleStateService} from './services/simple-state-service';
import {SharedModule} from './shared/shared-module';
import {ShoppingListService} from './services/shopping-list.service';
import {SimpleItemService} from './services/simple-item.service';
import { ServiceWorkerModule } from '@angular/service-worker';
import { ShoppingListItemsComponent } from './shopping-list-items/shopping-list-items.component';
import { ObjectNamePipe } from './shared/object-name.pipe';

@NgModule({
    declarations: [
        AppComponent,
        PersistenceOverlayComponent,
        IngredientOverlayPage,
        ShoppingListItemsComponent,
        ObjectNamePipe
    ],
    entryComponents: [PersistenceOverlayComponent, IngredientOverlayPage],
    imports: [
        BrowserModule,
        IonicModule.forRoot(),
        IonicStorageModule.forRoot(),
        AppRoutingModule,
        AngularFireModule.initializeApp(environment.firebase, 'my-recipe-book-anteuz'),
        AngularFireDatabaseModule,
        AngularFireAuthModule,
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
        {provide: RouteReuseStrategy, useClass: IonicRouteStrategy}
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
