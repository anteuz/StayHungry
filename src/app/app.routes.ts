import { Routes } from '@angular/router';
import { AuthGuard } from './shared/auth-guard.service';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/tabs',
    pathMatch: 'full'
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.router.module').then(m => m.TabsPageRoutingModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'sign-in',
    loadComponent: () => import('./sign-in/sign-in.page').then(m => m.SignInPage)
  },
  {
    path: 'sign-up',
    loadComponent: () => import('./sign-up/sign-up.page').then(m => m.SignUpPage)
  },
  {
    path: 'recipes',
    loadComponent: () => import('./recipes/recipes.page').then(m => m.RecipesPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'weekly-menu',
    loadComponent: () => import('./weekly-menu/weekly-menu.page').then(m => m.WeeklyMenuPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'recipe/:mode/:id',
    loadComponent: () => import('./recipe/recipe.page').then(m => m.RecipePage),
    canActivate: [AuthGuard]
  },
  {
    path: 'recipe/:mode',
    loadComponent: () => import('./recipe/recipe.page').then(m => m.RecipePage),
    canActivate: [AuthGuard]
  },
  {
    path: 'shopping-list/:id',
    loadComponent: () => import('./shopping-list/shopping-list.page').then(m => m.ShoppingListPage),
    canActivate: [AuthGuard]
  }
];
