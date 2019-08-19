import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from './shared/auth-guard.service';

const routes: Routes = [
    {path: '', loadChildren: './tabs/tabs.module#TabsPageModule', canLoad: [AuthGuard]},
    {path: 'sign-in', loadChildren: './sign-in/sign-in.module#SignInPageModule'},
    {path: 'sign-up', loadChildren: './sign-up/sign-up.module#SignUpPageModule'},
  { path: 'weekly-menu', loadChildren: './weekly-menu/weekly-menu.module#WeeklyMenuPageModule' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
