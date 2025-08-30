import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonSegment, IonSegmentButton, IonLabel, IonContent, IonList, IonItemSliding, IonItem, IonBadge, IonItemOptions, IonItemOption, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { SimpleItem } from '../models/simple-item';
import { SimpleItemService } from '../services/simple-item.service';
import { Ingredient } from '../models/ingredient';
import { Guid } from 'guid-typescript';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-browse-items-modal',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonContent,
    IonList,
    IonItemSliding,
    IonItem,
    IonBadge,
    IonItemOptions,
    IonItemOption,
    IonInfiniteScroll,
    IonInfiniteScrollContent
  ],
  templateUrl: './browse-items-modal.component.html',
  styleUrls: ['./browse-items-modal.component.scss']
})
export class BrowseItemsModalComponent implements OnInit, OnDestroy {
  @ViewChild(IonContent, { static: false }) content: IonContent;
  @ViewChild(IonInfiniteScroll, { static: false }) infiniteScroll: IonInfiniteScroll;
  @ViewChild('itemsList', { static: false }) itemsList: IonList;

  allItems: SimpleItem[] = [];
  displayedItems: SimpleItem[] = [];
  groupedItems: Map<string, SimpleItem[]> = new Map();
  
  currentSortMode: 'color' | 'alphabetic' | 'popularity' = 'color';
  
  // Infinite scroll configuration
  private itemsPerLoad = 50;
  private currentIndex = 0;
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private modalCtrl: ModalController,
    private simpleItemService: SimpleItemService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    // Subscribe to items from service
    this.subscriptions.add(
      this.simpleItemService.newItemEvent.subscribe((items: SimpleItem[]) => {
        this.allItems = [...items];
        this.sortItems();
        this.loadInitialItems();
      })
    );

    // Get existing items
    const existingItems = this.simpleItemService.getItems();
    if (existingItems && existingItems.length > 0) {
      this.allItems = [...existingItems];
      this.sortItems();
      this.loadInitialItems();
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  onItemSelected(item: SimpleItem) {
    // Create ingredient from simple item and return it
    const ingredient = new Ingredient(item, 1);
    
    // Update usage statistics - ensure values are properly initialized
    if (typeof item.usageCount !== 'number' || isNaN(item.usageCount)) {
      item.usageCount = 0;
    }
    if (typeof item.lastUsed !== 'number' || isNaN(item.lastUsed)) {
      item.lastUsed = Date.now();
    }
    
    item.usageCount++;
    item.lastUsed = Date.now();
    this.simpleItemService.updateItem(item);
    
    this.modalCtrl.dismiss(ingredient);
  }

  onEditItem(item: SimpleItem) {
    // Close the sliding item
    this.itemsList.closeSlidingItems().catch(e => console.log('Could not close sliding item'));
    
    // For now, just log the edit action
    // In the future, this could open an edit modal
    console.log('Edit item:', item.itemName);
    // You could implement item editing functionality here
  }

  onRemoveItem(item: SimpleItem) {
    // Close the sliding item
    this.itemsList.closeSlidingItems().catch(e => console.log('Could not close sliding item'));
    
    // Remove the item from the service
    this.simpleItemService.removeItem(item);
    
    // Update the displayed items list
    this.allItems = this.allItems.filter(i => i.uuid !== item.uuid);
    this.displayedItems = this.displayedItems.filter(i => i.uuid !== item.uuid);
    
    // Re-sort and regroup items
    this.sortItems();
    this.createGroupedItems();
  }

  onSortModeChange(mode: 'color' | 'alphabetic' | 'popularity') {
    this.currentSortMode = mode;
    this.sortItems();
    this.resetInfiniteScroll();
  }

  private sortItems() {
    switch (this.currentSortMode) {
      case 'color':
        this.allItems.sort((a, b) => {
          if (a.itemColor < b.itemColor) return -1;
          if (a.itemColor > b.itemColor) return 1;
          return a.itemName.localeCompare(b.itemName);
        });
        break;
      case 'alphabetic':
        this.allItems.sort((a, b) => a.itemName.localeCompare(b.itemName));
        break;
      case 'popularity':
        this.allItems.sort((a, b) => {
          // Ensure values are numbers, default to 0 for usageCount and current time for lastUsed
          const aUsage = typeof a.usageCount === 'number' && !isNaN(a.usageCount) ? a.usageCount : 0;
          const bUsage = typeof b.usageCount === 'number' && !isNaN(b.usageCount) ? b.usageCount : 0;
          const aLastUsed = typeof a.lastUsed === 'number' && !isNaN(a.lastUsed) ? a.lastUsed : Date.now();
          const bLastUsed = typeof b.lastUsed === 'number' && !isNaN(b.lastUsed) ? b.lastUsed : Date.now();
          
          // Sort by usage count descending, then by last used descending
          if (bUsage !== aUsage) {
            return bUsage - aUsage;
          }
          return bLastUsed - aLastUsed;
        });
        break;
    }
    
    // Create grouped items for color-based styling
    this.createGroupedItems();
  }

  private createGroupedItems() {
    this.groupedItems = new Map();
    this.allItems.forEach(item => {
      const color = item.itemColor;
      if (!this.groupedItems.has(color)) {
        this.groupedItems.set(color, []);
      }
      this.groupedItems.get(color).push(item);
    });
  }

  private loadInitialItems() {
    this.currentIndex = 0;
    this.displayedItems = [];
    this.loadMoreItems();
  }

  private resetInfiniteScroll() {
    this.currentIndex = 0;
    this.displayedItems = [];
    this.loadMoreItems();
    
    // Reset infinite scroll
    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = false;
    }
    
    // Scroll to top
    if (this.content) {
      this.content.scrollToTop(300);
    }
  }

  loadMoreItems(event?: any) {
    const startIndex = this.currentIndex;
    const endIndex = Math.min(startIndex + this.itemsPerLoad, this.allItems.length);
    
    const newItems = this.allItems.slice(startIndex, endIndex);
    this.displayedItems.push(...newItems);
    this.currentIndex = endIndex;
    
    if (event) {
      event.target.complete();
      
      // Disable infinite scroll if no more items
      if (this.currentIndex >= this.allItems.length) {
        event.target.disabled = true;
      }
    }
  }

  getStyle(itemColor: string) {
    // Handle both new category colors and legacy itemColor variables
    let cssVariable = itemColor;
    
    // If itemColor doesn't start with --, it might be a legacy format or category name
    if (!itemColor.startsWith('--')) {
      // Try to get the proper CSS variable from theme service
      cssVariable = this.themeService.getCategoryVariable(itemColor);
    }
    
    // Ensure we have a valid CSS variable format
    if (!cssVariable.startsWith('--')) {
      cssVariable = '--ion-color-category-other';
    }
    
    return `5px solid var(${cssVariable})`;
  }

  getStyleClass(item: SimpleItem): string {
    if (!this.groupedItems || !item) {
      return 'roundedCornersTop';
    }
    
    const colorGroup = this.groupedItems.get(item.itemColor);
    if (!colorGroup) {
      return 'roundedCornersTop';
    }
    
    const indexInGroup = colorGroup.indexOf(item);
    const groupSize = colorGroup.length;
    
    if (indexInGroup === 0 && groupSize > 1) {
      return 'roundedCornersTop';
    } else if (indexInGroup === 0 && groupSize === 1) {
      return 'roundedCornersSingle';
    } else if (indexInGroup === groupSize - 1) {
      return 'roundedCornersBottom';
    } else {
      return 'roundedCornersMiddle';
    }
  }

  trackByItemId(index: number, item: SimpleItem): string {
    return item.uuid;
  }
}
