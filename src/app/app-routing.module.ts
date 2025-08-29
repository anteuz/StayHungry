import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from './shared/auth-guard.service';

const routes: Routes = [
    {path: '', loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule), canLoad: [AuthGuard]},
    {path: 'sign-in', loadChildren: () => import('./sign-in/sign-in.module').then(m => m.SignInPageModule)},
    {path: 'sign-up', loadChildren: () => import('./sign-up/sign-up.module').then(m => m.SignUpPageModule)},
  { path: 'weekly-menu', loadChildren: () => import('./weekly-menu/weekly-menu.module').then(m => m.WeeklyMenuPageModule) }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
