import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import {Router} from '@angular/router';
import {IonList} from '@ionic/angular';
import {Guid} from 'guid-typescript';
import {Subscription} from 'rxjs';
import {ShoppingList} from '../models/shopping-list';
import {ShoppingListService} from '../services/shopping-list.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-shopping-list-items',
  templateUrl: './shopping-list-items.component.html',
  styleUrls: ['./shopping-list-items.component.scss']
})
export class ShoppingListItemsComponent implements OnInit, OnDestroy {

  shoppingLists: ShoppingList[] = [];
  inEditMode: string = null;
  shoppingListName: FormControl = null;

  private subscriptions: Subscription = new Subscription();
  @ViewChild('shoppingListsList', {static: false}) shoppingListsList: IonList;
  constructor(private slService: ShoppingListService, private router: Router, private changeDetector: ChangeDetectorRef) { }

  ngOnInit() {
    this.subscriptions.add(this.slService.shoppingListsEvent.subscribe(
        (shoppingLists: ShoppingList[]) => {
          this.shoppingLists = shoppingLists;
        }
    ));
  }

  toShoppingList(shoppingListID: string) {
    this.router.navigate(['/tabs/tab1', shoppingListID]).catch(e => console.log('Could not navigate to shopping list'));
    this.endEditMode();
  }

  onCreateNewList() {
    const shoppingList: ShoppingList = new ShoppingList(Guid.create().toString(), 'Shopping List', []);
    this.slService.addItem(shoppingList);
    this.router.navigate(['/tabs/tab1', shoppingList.uuid]).catch(e => console.log('Could not navigate to shopping list'));
  }

  onEdit(shoppingList: ShoppingList) {
    this.inEditMode = shoppingList.uuid;

    // this.shoppingListName = new FormControl('');
    // this.shoppingListName.setValue(shoppingList.name);
    this.shoppingListsList.closeSlidingItems().catch(e => console.log('Could not close sliding item'));
    console.log(this.shoppingListName);
  }

  onRemoveItem(shoppingList: ShoppingList) {
    this.slService.removeShoppingList(shoppingList);
    this.shoppingListsList.closeSlidingItems().catch(e => console.log('Could not close sliding item'));
    this.endEditMode();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onChangeShoppingListName(shoppingList: ShoppingList) {
    // shoppingList.name = this.shoppingListName.value;
    this.slService.updateShoppingList(shoppingList);
    this.endEditMode();
  }

  endEditMode() {
  	this.inEditMode = null;
  	if (this.shoppingListName !== null) {
		this.shoppingListName.reset(true);
	}
  	this.shoppingListName = null;
  }

  ionWillClose() {
    console.log('Menu closing');
  }
}
