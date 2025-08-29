import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { RecipePage } from './recipe.page';

const routes: Routes = [
  {
    path: '',
    component: RecipePage
  },
  {
    path: ':mode',
    component: RecipePage
  },
  {
    path: ':mode/:id',
    component: RecipePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [RecipePage],
  providers: []
})
export class RecipePageModule {}
