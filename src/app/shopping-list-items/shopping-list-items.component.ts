import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
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
    this.shoppingListsList.closeSlidingItems().catch(e => console.log('Could not close sliding item'));
    
    // Use setTimeout to ensure the input is rendered before trying to focus
    setTimeout(() => {
      const el = document.getElementById(`${shoppingList.uuid}_inputField`);
      const inputElement = el && (el as any).setFocus ? (el as any) : null;
      if (inputElement && typeof inputElement.setFocus === 'function') {
        inputElement.setFocus();
      }
    }, 100);
  }

  onRemoveItem(shoppingList: ShoppingList) {
    this.slService.removeShoppingList(shoppingList);
    this.shoppingListsList.closeSlidingItems().catch(e => console.log('Could not close sliding item'));
    this.endEditMode();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onChangeShoppingListName(shoppingList: ShoppingList, event?: Event) {
    const target: any = event?.target as any;
    const value = target?.value ?? '';
    if (value) {
      shoppingList.name = String(value);
      this.slService.updateShoppingList(shoppingList);
    }
    this.endEditMode();
  }

  endEditMode() {
    this.inEditMode = null;
  }

  ionWillClose() {
    console.log('Menu closing');
  }
}
