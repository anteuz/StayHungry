import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../shared/shared-module';

import { RecipeScrapingPage } from './recipe-scraping.page';

const routes: Routes = [
  {
    path: '',
    component: RecipeScrapingPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    IonicModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  declarations: [RecipeScrapingPage]
})
export class RecipeScrapingPageModule {}
