import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {IonList} from '@ionic/angular';
import {Guid} from 'guid-typescript';
import {Subscription} from 'rxjs';
import {ShoppingList} from '../models/shopping-list';
import {ShoppingListService} from '../services/shopping-list.service';

@Component({
  selector: 'app-shopping-list-items',
  templateUrl: './shopping-list-items.component.html',
  styleUrls: ['./shopping-list-items.component.scss']
})
export class ShoppingListItemsComponent implements OnInit, OnDestroy {

  shoppingLists: ShoppingList[] = [];
  private subscriptions: Subscription = new Subscription();
  @ViewChild('shoppingListsList') shoppingListsList: IonList;
  constructor(private slService: ShoppingListService, private router: Router) { }

  ngOnInit() {
    this.subscriptions.add(this.slService.shoppingListsEvent.subscribe(
        (shoppingLists: ShoppingList[]) => {
          this.shoppingLists = shoppingLists;
        }
    ));
  }

  toShoppingList(shoppingListID: string) {
    this.router.navigate(['/tabs/tab1', shoppingListID]);
  }

  onCreateNewList() {
    const shoppingList: ShoppingList = new ShoppingList(Guid.create().toString(), 'Shopping List', []);
    this.slService.addItem(shoppingList);
    this.router.navigate(['/tabs/tab1', shoppingList.uuid]);
  }

  onEdit(shoppingList: ShoppingList) {

  }

  onRemoveItem(shoppingList: ShoppingList) {
    this.slService.removeShoppingList(shoppingList);
    this.shoppingListsList.closeSlidingItems();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
