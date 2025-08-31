import {Component, OnDestroy, OnInit, ViewChild, ElementRef, HostListener} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {IonList, ModalController, PopoverController, Platform} from '@ionic/angular';
import {Subscription} from 'rxjs';
import {IngredientOverlayPage} from '../ingredient-overlay/ingredient-overlay.page';
import {BrowseItemsModalComponent} from '../browse-items-modal/browse-items-modal.component';
import {AppState} from '../models/app-state';
import {Ingredient} from '../models/ingredient';
import {ShoppingList} from '../models/shopping-list';
import {ShoppingListService} from '../services/shopping-list.service';
import {SimpleStateService} from '../services/simple-state-service';
import {ThemeService} from '../services/theme.service';
import {IngredientMergerService} from '../services/ingredient-merger.service';
import {CategoryDetectionService} from '../services/category-detection.service';
import {DragDropService} from '../services/drag-drop.service';
import {ToastService} from '../shared/services/toast.service';


@Component({
    selector: 'app-shopping-list',
    templateUrl: './shopping-list.page.html',
    styleUrls: ['./shopping-list.page.scss'],
})
export class ShoppingListPage implements OnInit, OnDestroy {

    shoppingListID: string;
    shoppingList: ShoppingList;
    ingredients: Ingredient[] = [];
    ingredientMap: Map<string, Ingredient[]> = new Map();
    categorizedIngredients: Array<{category: any, items: Ingredient[]}> = [];
    showSearchBar = true;
    @ViewChild('ingredientList', {static: false}) ingredientList: IonList;
    @ViewChild('shoppingListContent', {static: false}) shoppingListContent: ElementRef;
    loading = true;
    appState: AppState = null;
    private subscriptions: Subscription = new Subscription();
    
    // Drag and drop properties
    isDragging = false;
    draggedItem: Ingredient | null = null;
    dragStartX = 0;
    dragStartY = 0;
    dragGhost: HTMLElement | null = null;
    dragStartElement: HTMLElement | null = null;
    currentDropZone: HTMLElement | null = null;
    dragThreshold = 10; // Minimum distance to start dragging
    isDragStarted = false;
    
    // Touch-specific properties
    touchStartX = 0;
    touchStartY = 0;
    touchStartTime = 0;
    longPressTimeout: any = null;
    longPressDelay = 300; // Reduced for better responsiveness
    isLongPress = false;
    touchMoved = false;
    touchStartElement: HTMLElement | null = null;

    constructor(
        public slService: ShoppingListService,
        public modalCtrl: ModalController,
        public router: Router,
        public route: ActivatedRoute,
        private stateService: SimpleStateService,
        private themeService: ThemeService,
        private ingredientMergerService: IngredientMergerService,
        private categoryDetectionService: CategoryDetectionService,
        private dragDropService: DragDropService,
        private toastService: ToastService,
        private popoverController: PopoverController,
        private platform: Platform
    ) {
        console.log('Created constructor');
        // If route param is empty, go to last opened shopping list
        if (this.shoppingListID == null) {
            this.stateService.getAppState().then(appState => this.appState = appState).catch(e => console.log('Could not get app state'));
        }
        
        // Apply mobile-specific fixes
        this.applyMobileFixes();
    }

    private applyMobileFixes() {
        // Apply mobile-specific fixes to prevent black screen
        if (this.platform.is('mobile') || this.platform.is('ios')) {
            // Ensure proper background color on mobile
            if (typeof document !== 'undefined') {
                document.documentElement.style.setProperty('--ion-background-color', '#ffffff');
                document.documentElement.style.setProperty('--ion-text-color', '#000000');
            }
            
            // Adjust touch handling for mobile
            this.longPressDelay = 200; // Shorter delay for mobile
            this.dragThreshold = 15; // Larger threshold for mobile
        }
    }

    async ionViewWillEnter() {
        console.log('ion view will enter');
        // If route param is empty, go to last opened shopping list
        if (this.shoppingListID == null) {
            if (this.appState) {
                this.shoppingListID = this.appState.lastVisited_ShoppingList;
            }
        }
        
        // Only try to get shopping list if service has data loaded
        const existingShoppingLists = this.slService.getItems();
        if (existingShoppingLists && existingShoppingLists.length > 0) {
            try {
                this.shoppingList = this.slService.findUsingUUID(this.shoppingListID);
                console.log(this.shoppingList);
                if (this.shoppingList) {
                    this.loading = false;
                    this.initializeIngredients();
                } else {
                    // If specific shopping list not found but lists exist, don't show error yet
                    // The subscription will handle it when data is fully loaded
                    console.log('Shopping list not found with ID:', this.shoppingListID);
                }
            } catch (e) {
                console.log('Error finding shopping list:', e);
            }
        }
        // If no shopping lists loaded yet, let the subscription handle it
    }

    async ngOnInit() {
        console.log('onInit');
        // Get Route parameter
        this.route.params
            .subscribe(
                (params: Params) => {
                    this.shoppingListID = params['id'];
                    if (this.shoppingListID != null) {
                        this.stateService.updateLastVisitedShoppingList(this.shoppingListID);
                    }
                }
            );

        // If route param is empty, go to last opened shopping list
        if (this.shoppingListID == null) {
            const appState = await this.stateService.getAppState();
            if (appState) {
                this.shoppingListID = appState.lastVisited_ShoppingList;
                this.router.navigate(['/tabs/tab1', this.shoppingListID]).catch(e => console.log('Could not navigate to tabs!'));
            }
        }

        // Subscribe for changes - this will handle the initial load and subsequent updates
        this.subscriptions.add(this.slService.shoppingListsEvent.subscribe(
            (shoppingLists: ShoppingList[]) => {
                this.loading = false; // Set loading to false once we have data from the service
                
                if (this.shoppingListID != null) {
                    this.shoppingList = this.slService.findUsingUUID(this.shoppingListID);
                    if (this.shoppingList) {
                        this.initializeIngredients();
                    }
                } else {
                    // If no shopping list ID, try to get the first available shopping list
                    if (shoppingLists && shoppingLists.length > 0) {
                        this.shoppingListID = shoppingLists[0].uuid;
                        this.shoppingList = shoppingLists[0];
                        this.initializeIngredients();
                        this.router.navigate(['/tabs/tab1', this.shoppingListID]).catch(e => console.log('Could not navigate to tabs!'));
                    }
                }
            }
        ));

        // Try to get shopping list immediately if service already has data
        const existingShoppingLists = this.slService.getItems();
        if (existingShoppingLists && existingShoppingLists.length > 0) {
            this.loading = false;
            if (this.shoppingListID != null) {
                this.shoppingList = this.slService.findUsingUUID(this.shoppingListID);
                if (this.shoppingList) {
                    this.initializeIngredients();
                }
            }
        }
    }

    async onRemoveItem(index: Ingredient) {
        this.ingredientList.closeSlidingItems().catch(e => console.log('Could not close sliding item'));
        this.ingredients.splice(this.ingredients.indexOf(index), 1);
        this.shoppingList.items = this.ingredients;
        
        try {
            await this.slService.updateShoppingList(this.shoppingList);
            console.log('Successfully removed item from shopping list');
        } catch (error) {
            console.error('Failed to remove item from shopping list:', error);
            // Revert the change if database update fails
            this.ingredients.push(index);
            this.shoppingList.items = this.ingredients;
            this.initializeIngredients();
        }
    }

    async onEdit(ingredient: Ingredient) {
        // Blur the main search bar to ensure clean focus transition
        const mainSearchBar = document.querySelector('ion-searchbar') as HTMLIonSearchbarElement;
        if (mainSearchBar) {
            mainSearchBar.blur();
        }

        let modal = await this.modalCtrl.create({
            component: IngredientOverlayPage,
            animated: false,
            showBackdrop: true,
            cssClass: 'searchbar-dropdown',
            backdropDismiss: true,
            componentProps:
                {
                    'mode': 'edit',
                    'ingredient': ingredient
                }
        });
        modal.present().catch(e => console.log('Could not present modal!'));

        const {data} = await modal.onDidDismiss();
        // if data is provided, if action is cancelled data is undefined (backdrop tapped)
        if (data !== undefined) {
            // Find and replace the existing ingredient
            const existingIngredientIndex = this.ingredients.findIndex(ing => ing.uuid === data.uuid);
            if (existingIngredientIndex !== -1) {
                this.ingredients[existingIngredientIndex] = data;
            }
            // Update the shopping list items
            this.shoppingList.items = this.ingredients;
            this.initializeIngredients();
            
            try {
                await this.slService.updateShoppingList(this.shoppingList);
                console.log('Successfully updated ingredient in shopping list');
            } catch (error) {
                console.error('Failed to update ingredient in shopping list:', error);
                // Revert the change if database update fails
                if (existingIngredientIndex !== -1) {
                    this.ingredients[existingIngredientIndex] = ingredient; // Revert to original
                }
                this.shoppingList.items = this.ingredients;
                this.initializeIngredients();
            }
        }
        modal = null;
        this.ingredientList.closeSlidingItems().catch(e => console.log('Could not close sliding item'));
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    // Enhanced drag and drop methods with multi-input support
    onMouseDown(event: MouseEvent, ingredient: Ingredient, categoryKey: string, index: number) {
        this.startDrag(event.clientX, event.clientY, ingredient, categoryKey, index, event.target as HTMLElement);
    }

    onTouchStart(event: TouchEvent, ingredient: Ingredient, categoryKey: string, index: number) {
        const touch = event.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
        this.touchMoved = false;
        this.touchStartElement = event.target as HTMLElement;
        
        // Start long press timer
        this.longPressTimeout = setTimeout(() => {
            if (!this.touchMoved) {
                this.isLongPress = true;
                this.startDrag(touch.clientX, touch.clientY, ingredient, categoryKey, index, this.touchStartElement);
            }
        }, this.longPressDelay);
        
        // Don't prevent default here - let the click event fire for collection
        // Only prevent default if we start dragging
    }

    onTouchMove(event: TouchEvent) {
        if (!this.isDragging && !this.isLongPress) {
            const touch = event.touches[0];
            const deltaX = Math.abs(touch.clientX - this.touchStartX);
            const deltaY = Math.abs(touch.clientY - this.touchStartY);
            
            // Mark as moved if significant movement detected
            if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
                this.touchMoved = true;
                this.cancelLongPress();
                // Prevent default only when we detect significant movement
                event.preventDefault();
            }
        }
        
        if (this.isDragging) {
            const touch = event.touches[0];
            this.updateDragPosition(touch.clientX, touch.clientY);
            event.preventDefault();
        }
    }

    onTouchEnd(event: TouchEvent) {
        this.cancelLongPress();
        
        if (this.isDragging) {
            this.stopDrag();
            event.preventDefault();
        }
        
        // Check if this was a short touch (tap) vs a long touch (potential drag)
        const touchDuration = Date.now() - this.touchStartTime;
        const isShortTouch = touchDuration < this.longPressDelay;
        
        // Reset touch state
        this.touchMoved = false;
        this.touchStartElement = null;
        
        // Only prevent default if we moved significantly or it was a long touch
        if ((this.touchMoved && !this.isDragging) || (!isShortTouch && !this.isDragging)) {
            event.preventDefault();
        }
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (this.isDragging) {
            this.updateDragPosition(event.clientX, event.clientY);
        }
    }

    @HostListener('document:mouseup', ['$event'])
    onMouseUp(event: MouseEvent) {
        if (this.isDragging) {
            this.stopDrag();
        }
    }

    @HostListener('document:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        if (this.isDragging) {
            if (event.key === 'Escape') {
                this.cancelDrag();
            }
        }
    }

    private startDrag(clientX: number, clientY: number, ingredient: Ingredient, categoryKey: string, index: number, element: HTMLElement) {
        this.isDragging = true;
        this.draggedItem = ingredient;
        this.dragStartX = clientX;
        this.dragStartY = clientY;
        this.dragStartElement = element;
        this.isDragStarted = false;
        
        // Create drag ghost
        this.createDragGhost(ingredient, element);
        
        // Add dragging class to original element
        if (element) {
            element.classList.add('dragging');
        }
        
        // Update drag drop service
        this.dragDropService.startDrag(ingredient, categoryKey, index);
        
        // Prevent text selection
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
    }

    private updateDragPosition(clientX: number, clientY: number) {
        if (!this.isDragging || !this.dragGhost) return;
        
        const deltaX = Math.abs(clientX - this.dragStartX);
        const deltaY = Math.abs(clientY - this.dragStartY);
        
        // Start dragging only after threshold
        if (!this.isDragStarted && (deltaX > this.dragThreshold || deltaY > this.dragThreshold)) {
            this.isDragStarted = true;
        }
        
        if (this.isDragStarted) {
            // Update ghost position
            this.dragGhost.style.left = (clientX - this.dragGhost.offsetWidth / 2) + 'px';
            this.dragGhost.style.top = (clientY - this.dragGhost.offsetHeight / 2) + 'px';
            
            // Check for drop zones
            this.checkDropZones(clientX, clientY);
        }
    }

    private checkDropZones(clientX: number, clientY: number) {
        const dropZones = document.querySelectorAll('.drop-zone');
        let foundDropZone = false;
        
        dropZones.forEach((zone: Element) => {
            const rect = zone.getBoundingClientRect();
            const isOver = clientX >= rect.left && clientX <= rect.right &&
                          clientY >= rect.top && clientY <= rect.bottom;
            
            if (isOver) {
                zone.classList.add('drag-over');
                this.currentDropZone = zone as HTMLElement;
                foundDropZone = true;
            } else {
                zone.classList.remove('drag-over');
            }
        });
        
        if (!foundDropZone) {
            this.currentDropZone = null;
        }
    }

    private stopDrag() {
        if (!this.isDragging) return;
        
        if (this.currentDropZone && this.draggedItem) {
            const targetCategory = this.currentDropZone.getAttribute('data-category');
            if (targetCategory) {
                this.handleCategoryChange(this.draggedItem, this.draggedItem.item.itemColor, targetCategory);
            }
        }
        
        this.cleanupDrag();
    }

    private cancelDrag() {
        this.cleanupDrag();
    }

    private cleanupDrag() {
        this.isDragging = false;
        this.isDragStarted = false;
        this.isLongPress = false;
        
        // Remove drag ghost
        if (this.dragGhost) {
            document.body.removeChild(this.dragGhost);
            this.dragGhost = null;
        }
        
        // Remove dragging class from original element
        if (this.dragStartElement) {
            this.dragStartElement.classList.remove('dragging');
            this.dragStartElement = null;
        }
        
        // Remove drag-over classes from all drop zones
        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.classList.remove('drag-over');
        });
        
        this.currentDropZone = null;
        this.draggedItem = null;
        
        // Restore text selection
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        
        // Update drag drop service
        this.dragDropService.stopDrag();
    }

    private cancelLongPress() {
        if (this.longPressTimeout) {
            clearTimeout(this.longPressTimeout);
            this.longPressTimeout = null;
        }
        this.isLongPress = false;
    }

    private createDragGhost(ingredient: Ingredient, originalElement: HTMLElement) {
        // Create ghost element
        this.dragGhost = document.createElement('div');
        this.dragGhost.className = 'drag-ghost';
        this.dragGhost.style.position = 'fixed';
        this.dragGhost.style.zIndex = '10000';
        this.dragGhost.style.pointerEvents = 'none';
        this.dragGhost.style.userSelect = 'none';
        this.dragGhost.style.transform = 'rotate(3deg) scale(1.05)'; // Enhanced visual feedback
        
        // Copy the content from the original element
        const label = originalElement.querySelector('.ingredient-label');
        if (label) {
            this.dragGhost.innerHTML = label.innerHTML;
        } else {
            this.dragGhost.textContent = ingredient.item.itemName;
        }
        
        // Position the ghost at the original element's position
        const rect = originalElement.getBoundingClientRect();
        this.dragGhost.style.left = rect.left + 'px';
        this.dragGhost.style.top = rect.top + 'px';
        this.dragGhost.style.width = rect.width + 'px';
        
        // Add a subtle shadow for better visual separation
        this.dragGhost.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
        
        document.body.appendChild(this.dragGhost);
        
        // Add a brief animation to make the ghost appear more smoothly
        setTimeout(() => {
            if (this.dragGhost) {
                this.dragGhost.style.transition = 'all 0.1s ease-out';
            }
        }, 10);
    }

    async handleCategoryChange(ingredient: Ingredient, oldCategory: string, newCategory: string) {
        if (oldCategory === newCategory) {
            return; // No change needed
        }

        try {
            // Update the ingredient's category
            const newCategoryVariable = this.themeService.getCategoryVariable(newCategory);
            ingredient.item.itemColor = newCategoryVariable;
            
            // Learn from this change
            await this.categoryDetectionService.learnFromUserChange(
                ingredient.item.itemName, 
                newCategory
            );
            
            // Update the shopping list
            this.shoppingList.items = [...this.ingredients];
            await this.slService.updateShoppingList(this.shoppingList);
            
            // Refresh the display
            this.initializeIngredients();
            
            // Show success message
            this.showToast(`Moved "${ingredient.item.itemName}" to ${newCategory}`, 'success');
            
        } catch (error) {
            console.error('Error changing category:', error);
            this.showToast('Failed to change category', 'danger');
        }
    }

    private async showToast(message: string, color: string = 'primary') {
        await this.toastService.showBottom(message, color, 1500);
    }

    getStyle(ingredientColor: string) {
        // Handle both new category colors and legacy itemColor variables
        let cssVariable = ingredientColor;
        
        // If itemColor doesn't start with --, it might be a legacy format or category name
        if (!ingredientColor.startsWith('--')) {
            // Try to get the proper CSS variable from theme service
            cssVariable = this.themeService.getCategoryVariable(ingredientColor);
        }
        
        // Ensure we have a valid CSS variable format
        if (!cssVariable.startsWith('--')) {
            cssVariable = '--ion-color-category-other';
        }
        
        return `5px solid var(${cssVariable})`;
    }

    getCategoryStyle(ingredient: Ingredient) {
        const cssVariable = this.getCategoryColor(ingredient.item.itemColor);
        
        // All items use the same border-left styling
        return {
            'border-left': `5px solid var(${cssVariable})`
        };
    }

    private getCategoryColor(ingredientColor: string): string {
        // Handle both new category colors and legacy itemColor variables
        let cssVariable = ingredientColor;
        
        // If itemColor doesn't start with --, it might be a legacy format or category name
        if (!ingredientColor.startsWith('--')) {
            // Try to get the proper CSS variable from theme service
            cssVariable = this.themeService.getCategoryVariable(ingredientColor);
        }
        
        // Ensure we have a valid CSS variable format
        if (!cssVariable.startsWith('--')) {
            cssVariable = '--ion-color-category-other';
        }
        
        return cssVariable;
    }

    getStyleClass(ingredient: Ingredient) {
        if (this.ingredientMap === undefined || ingredient === undefined) {
            return 'roundedCornersTop';
        }
        
        const categoryItems = this.ingredientMap.get(ingredient.item.itemColor);
        if (!categoryItems) {
            return 'roundedCornersMiddle';
        }
        
        const itemIndex = categoryItems.indexOf(ingredient);
        const totalItems = categoryItems.length;
        
        // Single item in category
        if (totalItems === 1) {
            return 'roundedCornersMiddle';
        }
        
        // First item (top)
        if (itemIndex === 0) {
            return 'roundedCornersTop';
        }
        
        // Last item (bottom)
        if (itemIndex === totalItems - 1) {
            return 'roundedCornersBottom';
        }
        
        // Middle items
        return 'roundedCornersMiddle';
    }
    async onCollect(ingredient: Ingredient) {
        console.log('Collecting ingredient:', ingredient.item.itemName);
        ingredient.isCollected = true;
        ingredient.isBeingCollected = false;
        
        // Ensure the shopping list items array is properly updated
        this.shoppingList.items = [...this.ingredients]; // Create new array reference
        
        // Sort ingredients to move collected items to bottom
        this.sortIngredients();
        
        // Update the service and database
        try {
            await this.slService.updateShoppingList(this.shoppingList);
            console.log('Successfully saved collected state to database');
        } catch (error) {
            console.error('Failed to save collected state to database:', error);
            // Revert the change if database update fails
            ingredient.isCollected = false;
            ingredient.isBeingCollected = false;
        }
        
        // Refresh local state
        this.initializeIngredients();
    }

    async onDeCollect(ingredient: Ingredient) {
        console.log('De-collecting ingredient:', ingredient.item.itemName);
        ingredient.isCollected = false;
        
        // Ensure the shopping list items array is properly updated
        this.shoppingList.items = [...this.ingredients]; // Create new array reference
        
        // Sort ingredients to move uncollected items to top
        this.sortIngredients();
        
        // Update the service and database
        try {
            await this.slService.updateShoppingList(this.shoppingList);
            console.log('Successfully saved de-collected state to database');
        } catch (error) {
            console.error('Failed to save de-collected state to database:', error);
            // Revert the change if database update fails
            ingredient.isCollected = true;
        }
        
        // Refresh local state
        this.initializeIngredients();
    }

    async beingCollected(ingredient: Ingredient) {
        if (ingredient.isBeingCollected) {
            return 'collected';
        } else {
            return '';
        }
    }

    onStartCollect(ingredient: Ingredient) {
        ingredient.isBeingCollected = true;
    }

    cancelCollect(ingredient: Ingredient) {
        ingredient.isBeingCollected = false;
    }

    onTransitionEnd(event: TransitionEvent, ingredient: Ingredient) {
        // Only trigger onCollect for the transform transition to avoid multiple calls
        if (event.propertyName === 'transform' && ingredient.isBeingCollected) {
            this.onCollect(ingredient);
        }
    }

    async openIngredientOverlay() {
        // Blur the main search bar to ensure clean focus transition
        const mainSearchBar = document.querySelector('ion-searchbar') as HTMLIonSearchbarElement;
        if (mainSearchBar) {
            mainSearchBar.blur();
        }

        let modal = await this.modalCtrl.create({
            component: IngredientOverlayPage,
            animated: false,
            showBackdrop: true,
            cssClass: 'searchbar-dropdown',
            backdropDismiss: true,
            componentProps:
                {
                    'mode': 'insert'
                }
        });
        modal.present().catch(e => console.log('Could not present modal!'));

        const {data} = await modal.onDidDismiss();
        // if data is provided, if action is cancelled data is undefined (backdrop tapped)
        if (data !== undefined) {
            // Add new ingredients to the shopping list with merging
            if (Array.isArray(data)) {
                this.addItemsToShoppingListWithMerge(data);
            } else {
                // Single ingredient (shouldn't happen in insert mode, but handle it)
                if (this.shoppingList.items == null) {
                    this.shoppingList.items = [];
                }
                this.shoppingList.items.push(data);
            }
            this.initializeIngredients();
            
            try {
                await this.slService.updateShoppingList(this.shoppingList);
                console.log('Successfully added ingredients to shopping list');
            } catch (error) {
                console.error('Failed to add ingredients to shopping list:', error);
                // Revert the changes if database update fails
                if (Array.isArray(data)) {
                    this.shoppingList.items.splice(-data.length);
                } else {
                    this.shoppingList.items.pop();
                }
                this.initializeIngredients();
            }
        }
        modal = null;
    }

    async onOpenItemsList() {
        const modal = await this.modalCtrl.create({
            component: BrowseItemsModalComponent,
            animated: true,
            showBackdrop: true,
            cssClass: 'browse-items-modal',
            backdropDismiss: true
        });
        
        await modal.present();
        
        const { data } = await modal.onDidDismiss();
        if (data) {
            // data is an Ingredient object returned from the modal
            if (this.shoppingList.items == null) {
                this.shoppingList.items = [];
            }
            
            // Use merging to handle potential duplicates
            this.shoppingList.items = this.ingredientMergerService.mergeIngredients(
                this.shoppingList.items, 
                [data]
            );
            
            this.initializeIngredients();
            
            try {
                await this.slService.updateShoppingList(this.shoppingList);
                console.log('Successfully added item to shopping list');
            } catch (error) {
                console.error('Failed to add item to shopping list:', error);
                // Revert the change if database update fails
                this.shoppingList.items = this.shoppingList.items.filter(item => item.uuid !== data.uuid);
                this.initializeIngredients();
            }
        }
    }

    findIngredientUsingUUID(searchTerm) {
        return this.ingredients.filter((ingredient) => {
            return ingredient.uuid.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1;
        });
    }

    initializeIngredients() {

        if (this.shoppingList != null && this.shoppingList.items != null) {
            this.shoppingList.items.sort(compare);
            this.ingredients = this.shoppingList.items;
            this.ingredientMap = groupByVanilla2(this.ingredients, ingredient => ingredient.item.itemColor);
            this.categorizedIngredients = this.getCategorizedIngredients();
        }
        // Create groups by color for ui magic
        this.loading = false;
    }

    /**
     * Efficient method to just sort ingredients without recreating maps or resetting loading state
     */
    private sortIngredients() {
        if (this.ingredients && this.ingredients.length > 0) {
            this.ingredients.sort(compare);
            this.shoppingList.items = this.ingredients;
            this.categorizedIngredients = this.getCategorizedIngredients();
        }
    }

    async clearCollected() {
        const originalIngredients = [...this.ingredients];
        
        for (let i = this.ingredients.length - 1; i >= 0; --i) {
            if (this.ingredients[i].isCollected === true) {
                this.ingredients.splice(i, 1);
            }
        }
        this.shoppingList.items = this.ingredients;
        
        try {
            await this.slService.updateShoppingList(this.shoppingList);
            console.log('Successfully cleared collected items from shopping list');
        } catch (error) {
            console.error('Failed to clear collected items from shopping list:', error);
            // Revert the change if database update fails
            this.ingredients = originalIngredients;
            this.shoppingList.items = this.ingredients;
            this.initializeIngredients();
        }
    }

    private addItemsToShoppingList(data) {
        if (this.shoppingList.items == null) {
            this.shoppingList.items = [];
        }
        this.shoppingList.items.push(...data);
    }

    /**
     * Add items to shopping list with intelligent merging
     */
    private addItemsToShoppingListWithMerge(newIngredients: Ingredient[]) {
        if (this.shoppingList.items == null) {
            this.shoppingList.items = [];
        }
        
        // Use the ingredient merger service to merge ingredients
        this.shoppingList.items = this.ingredientMergerService.mergeIngredients(
            this.shoppingList.items, 
            newIngredients
        );
    }

    /**
     * Get category information from itemColor using the theme service
     */
    getCategoryFromItemColor(itemColor: string): any {
        const categoryKey = this.themeService.getCategoryKey(itemColor);
        const availableCategories = this.themeService.getAvailableCategories();
        const result = availableCategories.find(cat => cat.key === categoryKey) || 
                      availableCategories.find(cat => cat.key === 'other');
        
        // Debug logging to help identify category mapping issues
        if (categoryKey === 'other' && itemColor !== '--ion-color-category-other') {
            console.log('Item defaulting to Other category:', {
                itemColor: itemColor,
                categoryKey: categoryKey,
                mappedCategory: result
            });
        }
        
        return result;
    }

    /**
     * Organize ingredients by category for display with category headers
     */
    getCategorizedIngredients(): Array<{category: any, items: Ingredient[]}> {
        if (!this.ingredients || this.ingredients.length === 0) {
            return [];
        }

        // Filter out collected items for categorization
        const uncollectedIngredients = this.ingredients.filter(ingredient => !ingredient.isCollected);
        
        // Group ingredients by category
        const categoryMap = new Map<string, Ingredient[]>();
        
        uncollectedIngredients.forEach(ingredient => {
            const category = this.getCategoryFromItemColor(ingredient.item.itemColor);
            const categoryKey = category.key;
            
            if (!categoryMap.has(categoryKey)) {
                categoryMap.set(categoryKey, []);
            }
            categoryMap.get(categoryKey).push(ingredient);
        });

        // Convert map to array and sort categories
        const categorizedResults: Array<{category: any, items: Ingredient[]}> = [];
        const availableCategories = this.themeService.getAvailableCategories();
        
        // Iterate through categories in predefined order
        availableCategories.forEach(category => {
            const items = categoryMap.get(category.key);
            if (items && items.length > 0) {
                // Sort items within category by name
                items.sort((a, b) => a.item.itemName.localeCompare(b.item.itemName));
                categorizedResults.push({
                    category: category,
                    items: items
                });
            }
        });

        return categorizedResults;
    }
}

export function groupByVanilla2(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection && item.isCollected !== true) {
            map.set(key, [item]);
        } else {
            if (item.isCollected !== true) {
                collection.push(item);
            }
        }
    });
    return map;
}

export function compare(a: Ingredient, b: Ingredient) {
    // First sort by collection status - uncollected items first
    if (a.isCollected !== b.isCollected) {
        return a.isCollected ? 1 : -1;
    }
    
    // Then sort by item color for visual grouping
    if (a.item.itemColor < b.item.itemColor) {
        return -1;
    }
    if (a.item.itemColor > b.item.itemColor) {
        return 1;
    }
    
    // Finally sort by item name for consistent ordering within same color group
    return a.item.itemName.localeCompare(b.item.itemName);
}
