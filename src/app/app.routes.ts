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
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'tab1',
        children: [
          {
            path: '',
            loadComponent: () => import('./shopping-list/shopping-list.page').then(m => m.ShoppingListPage)
          },
          {
            path: ':id',
            loadComponent: () => import('./shopping-list/shopping-list.page').then(m => m.ShoppingListPage)
          }
        ]
      },
      {
        path: 'tab2',
        children: [
          {
            path: '',
            loadComponent: () => import('./recipes/recipes.page').then(m => m.RecipesPage)
          },
          {
            path: 'recipe',
            children: [
              {
                path: '',
                loadComponent: () => import('./recipe/recipe.page').then(m => m.RecipePage)
              },
              {
                path: ':mode',
                loadComponent: () => import('./recipe/recipe.page').then(m => m.RecipePage)
              },
              {
                path: ':mode/:id',
                loadComponent: () => import('./recipe/recipe.page').then(m => m.RecipePage)
              }
            ]
          }
        ]
      },
      {
        path: 'tab3',
        children: [
          {
            path: '',
            loadComponent: () => import('./weekly-menu/weekly-menu.page').then(m => m.WeeklyMenuPage)
          }
        ]
      },
      {
        path: '',
        redirectTo: '/tabs/tab1',
        pathMatch: 'full'
      }
    ]
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
  // Legacy direct routes have been moved under tabs for consistency
];
