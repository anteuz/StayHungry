import {EventEmitter, Injectable} from '@angular/core';
import {HttpClient}               from '@angular/common/http';
import {AuthService}              from './auth.service';
import {AngularFireDatabase}      from '@angular/fire/database';
import {Ingredient}               from './models/ingredient';
import {SimpleItem} from './models/simple-item';

@Injectable({
  providedIn: 'root'
})
export class SimpleItemService {

  ref = null;
  DATABASE_PATH = null;

  private items: SimpleItem[] = [];
  public newItemEvent = new EventEmitter<SimpleItem[]>();


  constructor(
      private httpClient: HttpClient,
      private authService: AuthService,
      private fireDatabase: AngularFireDatabase
  ) {}

  setupHandlers() {
    // Setup DB PATH
    this.DATABASE_PATH = 'users/' + this.authService.getUserUID() + '/items';
    // Subscribe to value changes
    this.fireDatabase.object(this.DATABASE_PATH).snapshotChanges().subscribe(action => {
      if (action) {
          this.items = <SimpleItem[]>action.payload.val();
          if (this.items === null) {
            this.items = [];
          }
          console.log(this.items);
          this.newItemEvent.emit(this.items.slice());
      }
    });
  }

  addItem(item: SimpleItem) {
    this.items.push(item);
    this.updateDatabase();
  }

  addItems(items: SimpleItem[]) {
    this.items.push(...items);
    this.updateDatabase();
  }

  getItems() {
    return this.items.slice();
  }

  removeItem(item: SimpleItem) {
    this.items.splice(this.items.indexOf(item), 1);
    this.updateDatabase();
  }

  updateDatabase() {
    const itemRef = this.fireDatabase.object(this.DATABASE_PATH);
    itemRef.set(this.items.slice());
  }

  updateItemStatuses(items: SimpleItem[]) {
    this.items = items;
    this.updateDatabase();
  }

  filterItems(searchTerm) {
    return this.items.filter((item) => {
      return item.itemName.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1;
    });

  }
}

export const snapshotToArray = snapshot => {
  const returnArr = [];

  snapshot.forEach(childSnapshot => {
    const item = childSnapshot.val();
    item.key = childSnapshot.key;
    returnArr.push(item);
  });

  return returnArr;
};

export const snapshotToObject = snapshot => {
  const item = snapshot.val();
  item.key = snapshot.key;

  return item;
};
