import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-recipes',
  templateUrl: './recipes.page.html',
  styleUrls: ['./recipes.page.scss'],
})
export class RecipesPage implements OnInit {

  constructor(
      private router: Router,
      private route: ActivatedRoute) { }

  ngOnInit() {

  }

  onNewRecipe() {
    this.router.navigate(['/tabs/tab2/recipe', 'edit'], {relativeTo: this.route});
  }
}
