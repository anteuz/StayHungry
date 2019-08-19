import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { WeeklyMenuPage } from './weekly-menu.page';

const routes: Routes = [
  {
    path: '',
    component: WeeklyMenuPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [WeeklyMenuPage]
})
export class WeeklyMenuPageModule {}
