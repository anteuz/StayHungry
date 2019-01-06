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
import {environment} from '../environments/environment';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {PersistenceOverlayComponent} from './persistence-overlay/persistence-overlay.component';
import {SharedModule} from './shared/shared-module';
import {ShoppingListService} from './shopping-list.service';
import {SimpleItemService} from './simple-item.service';

@NgModule({
    declarations: [
        AppComponent,
        PersistenceOverlayComponent
    ],
    entryComponents: [PersistenceOverlayComponent],
    imports: [
        BrowserModule,
        IonicModule.forRoot(),
        AppRoutingModule,
        AngularFireModule.initializeApp(environment.firebase, 'my-recipe-book-anteuz'),
        AngularFireDatabaseModule,
        AngularFireAuthModule,
        HttpClientModule,
        SharedModule
    ],
    providers: [
        StatusBar,
        SplashScreen,
        AngularFireDatabase,
        AngularFireAuth,
        ShoppingListService,
        SimpleItemService,
        {provide: RouteReuseStrategy, useClass: IonicRouteStrategy}
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
