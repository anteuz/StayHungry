import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';
import {SharedModule} from '../shared/shared-module';

import { ShoppingListPage } from './shopping-list.page';
import { BrowseItemsModalComponent } from '../browse-items-modal/browse-items-modal.component';

const routes: Routes = [
  {
    path: '',
    component: ShoppingListPage
  },
  {
    path: ':id',
    component: ShoppingListPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ShoppingListPage, BrowseItemsModalComponent]
})
export class ShoppingListPageModule {}
