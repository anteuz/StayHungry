import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {provideFirebaseApp, initializeApp} from '@angular/fire/app';
import {provideAuth, getAuth} from '@angular/fire/auth';
import {provideDatabase, getDatabase} from '@angular/fire/database';
import {provideStorage, getStorage} from '@angular/fire/storage';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';


import {IonicModule, IonicRouteStrategy} from '@ionic/angular';
import {IonicStorageModule} from '@ionic/storage-angular';
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
import {WeeklyMenuService} from './services/weekly-menu.service';
import {UserProfileService} from './services/user-profile.service';
import {IngredientParserService} from './services/ingredient-parser.service';
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

        HttpClientModule,
        SharedModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
    ],
    providers: [
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideAuth(() => getAuth()),
        provideDatabase(() => getDatabase()),
        provideStorage(() => getStorage()),
        ShoppingListService,
        SimpleItemService,
        SimpleStateService,
        CloudStoreService,
        RecipeServiceService,
        WeeklyMenuService,
        UserProfileService,
        IngredientParserService,

        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
