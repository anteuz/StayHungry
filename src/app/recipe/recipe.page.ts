import {Component, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {Camera, CameraResultType, CameraSource} from '@capacitor/camera';
import {Filesystem} from '@capacitor/filesystem';
import {LoadingController, Platform, ToastController} from '@ionic/angular';
import {v4 as uuidv4} from 'uuid';
import {Observable} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {Recipe} from '../models/recipe';
import {CloudStoreService} from '../services/cloud-store.service';
import {RecipeServiceService} from '../services/recipe-service.service';
import {IngredientParserService} from '../services/ingredient-parser.service';
import {ShoppingListService} from '../services/shopping-list.service';
import {SimpleStateService} from '../services/simple-state-service';
import {Ingredient} from '../models/ingredient';
import {ShoppingList} from '../models/shopping-list';
import {IngredientMergerService} from '../services/ingredient-merger.service';

@Component({
    selector: 'app-recipe',
    templateUrl: './recipe.page.html',
    styleUrls: ['./recipe.page.scss'],
})
export class RecipePage implements OnInit, OnDestroy {

    mode;
    recipe: Recipe;
    recipeUUID;
    recipeImageUploadPercentage: number;
    downloadURL: Observable<string>;
    recipeForm: UntypedFormGroup;
    platformTypeCordova: boolean;
    showInstructions = false;

    // Recipe category options with labels
    readonly categoryOptions = [
        { value: 'all', label: 'All Recipes', icon: 'globe' },
        { value: 'basicStuff', label: 'Basic Stuff', icon: 'basket' },
        { value: 'food', label: 'Food', icon: 'pizza' },
        { value: 'drinks', label: 'Drinks', icon: 'wine' },
        { value: 'desserts', label: 'Desserts', icon: 'ice-cream' },
        { value: 'householdUtilities', label: 'Household', icon: 'construct' },
        { value: 'apothecary', label: 'Health', icon: 'medkit' },
        { value: 'clothes', label: 'Clothes', icon: 'shirt' }
    ];

    constructor(
        private platform: Platform,
        private route: ActivatedRoute,
        private router: Router,
        private cloudStore: CloudStoreService,
        private loadingCtrl: LoadingController,
        private recipeService: RecipeServiceService,
        private ingredientParser: IngredientParserService,
        private ingredientMergerService: IngredientMergerService,
        private shoppingListService: ShoppingListService,
        private stateService: SimpleStateService,
        private toastController: ToastController
    ) {
    }

    async ngOnInit() {
        this.platformTypeCordova = this.platform.is('desktop');

        console.log('onInit');
        // Get Route parameter
        this.route.params
            .subscribe(
                (params: Params) => {
                    this.mode = params['mode'];
                    this.recipeUUID = params['id'];
                }
            );

        console.log(this.mode);
        if (this.mode === 'new') {
           this.recipe = new Recipe(uuidv4(), null, null, null, [], 'food');
            this.initializeForm();
        }
        if (this.mode === 'view' || this.mode === 'edit') {
            this.recipe = this.recipeService.findUsingUUID(this.recipeUUID);
            this.initializeForm();
        }
    }



    onDeleteRecipe() {
        this.cloudStore.removeImage(this.recipe.uuid);
        this.recipeService.removeRecipe(this.recipe);
        this.router.navigate(['/tabs/tab2'], {relativeTo: this.route});
    }



    initializeForm() {
        this.recipeForm = new UntypedFormGroup({
            'recipeName': new UntypedFormControl(this.recipe.name, Validators.required),
            'recipeDescription': new UntypedFormControl(this.recipe.description || null)
        });
    }

    onChangeImageUpload(event) {
        const files = event.srcElement.files;
        console.log(files);
        this.recipe.imageURI = files[0];
        this.uploadFile();
    }

    private async uploadFile() {
        const loadingDialog = await this.loadingCtrl.create({
            message: 'Uploading image...',
            translucent: false,
            cssClass: 'loadingDialog'
        });

        loadingDialog.present().catch(e => console.log('Could not present loading dialog'));

        try {
            // Upload the image
            const uploadResult = await this.cloudStore.storeRecipeImage(this.recipe.imageURI, this.recipe.uuid);
            console.log('Upload completed:', uploadResult);
            
            // Get download URL
            const downloadURL = await this.cloudStore.getReferenceToUploadedFile(this.recipe.uuid);
            
            // Save download url as recipe img src
            this.recipe.imageURI = downloadURL;
            console.log('Download URL:', downloadURL);
            
            loadingDialog.dismiss().catch(e => console.log('Could not dismiss dialog'));
        } catch (error) {
            console.error('Upload failed:', error);
            loadingDialog.dismiss().catch(e => console.log('Could not dismiss dialog'));
        }
    }

    onSubmit() {
        this.recipe.name =  this.recipeForm.get('recipeName').value;
        this.recipe.description = this.recipeForm.get('recipeDescription').value;
        if (this.mode === 'new') {
            this.recipeService.addItem(this.recipe);
            this.router.navigate(['/tabs/tab2'], {relativeTo: this.route});
        }
        if (this.mode === 'edit') {
            this.recipeService.updateRecipe(this.recipe);
            this.router.navigate(['/tabs/tab2/recipe', 'view', this.recipe.uuid], {relativeTo: this.route});
        }
    }

    async getRecipeImageFromCamera() {
        try {
            const image = await Camera.getPhoto({
                quality: 70,
                allowEditing: false,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Camera
            });

            if (image.dataUrl) {
                // Convert data URL to Blob
                const response = await fetch(image.dataUrl);
                const blob = await response.blob();
                this.recipe.imageURI = blob;
                this.uploadFile();
            }
        } catch (error) {
            console.log('Error taking picture:', error);
        }
    }

    onEditRecipe() {
        this.router.navigate(['/tabs/tab2/recipe', 'edit', this.recipe.uuid], {relativeTo: this.route});
    }

    onCancel() {
        // Camera cleanup not needed with Capacitor Camera

        if (this.downloadURL != null && this.mode === 'new') {
            // remove picture as this will not be persisted
            this.cloudStore.removeImage(this.recipe.uuid);
        }
        if (this.mode === 'new') {
            this.router.navigate(['/tabs/tab2'], {relativeTo: this.route});
        } else {
            this.router.navigate(['/tabs/tab2/recipe', 'view', this.recipe.uuid], {relativeTo: this.route});
        }
    }

    ngOnDestroy() {
        console.log('On destroy');
        this.recipe = null;
        this.mode = null;
        this.downloadURL = null;
        this.recipeForm = null;
    }



    segmentChanged(event: any) {
        this.recipe.category = event.detail.value;
    }

    /**
     * Get category label for display
     */
    getCategoryLabel(categoryValue: string): string {
        const category = this.categoryOptions.find(opt => opt.value === categoryValue);
        return category ? category.label : 'Unknown';
    }

    /**
     * Get category icon for display
     */
    getCategoryIcon(categoryValue: string): string {
        const category = this.categoryOptions.find(opt => opt.value === categoryValue);
        return category ? category.icon : 'help-circle';
    }

    /**
     * Toggle instructions visibility
     */
    toggleInstructions() {
        this.showInstructions = !this.showInstructions;
    }

    /**
     * Add ingredients to shopping list
     */
    async onAddIngredients() {
        if (!this.recipe || !this.recipe.recipeIngredient || this.recipe.recipeIngredient.length === 0) {
            await this.showToast('No ingredients found in this recipe', 'warning');
            return;
        }

        const loading = await this.loadingCtrl.create({
            message: 'Adding ingredients to shopping list...',
            translucent: false,
            cssClass: 'loadingDialog'
        });

        try {
            await loading.present();

            // Get the active shopping list
            const appState = await this.stateService.getAppState();
            let activeShoppingList: ShoppingList;

            if (appState && appState.lastVisited_ShoppingList) {
                activeShoppingList = this.shoppingListService.findUsingUUID(appState.lastVisited_ShoppingList);
            }

            // If no active shopping list, get the first available one
            if (!activeShoppingList) {
                const shoppingLists = this.shoppingListService.getItems();
                if (shoppingLists && shoppingLists.length > 0) {
                    activeShoppingList = shoppingLists[0];
                }
            }

            if (!activeShoppingList) {
                await loading.dismiss();
                await this.showToast('No shopping list available. Please create one first.', 'warning');
                return;
            }

            // Parse recipe ingredients using the ingredient parser service with merging
            const parsedIngredients = this.ingredientParser.parseRecipeToIngredients(
                this.recipe.recipeIngredient,
                { confidenceThreshold: 0.6 }
            );

            if (parsedIngredients.length === 0) {
                await loading.dismiss();
                await this.showToast('No ingredients could be parsed from this recipe', 'warning');
                return;
            }

            // Get the current ingredients from the shopping list
            const existingIngredients = activeShoppingList.items || [];
            
            // Use the ingredient merger service to merge ingredients properly
            const mergedIngredients = this.ingredientMergerService.mergeIngredients(
                existingIngredients,
                parsedIngredients
            );

            // Update the shopping list with merged ingredients
            activeShoppingList.items = mergedIngredients;
            
            // Save the updated shopping list
            await this.shoppingListService.updateShoppingList(activeShoppingList);

            // Get merge summary for user feedback
            const mergeSummary = this.ingredientMergerService.getMergeSummary(
                existingIngredients,
                parsedIngredients
            );

            // Update the last visited shopping list
            this.stateService.updateLastVisitedShoppingList(activeShoppingList.uuid);

            await loading.dismiss();
            
            // Show appropriate message based on merge results
            let message: string;
            if (mergeSummary.merged > 0 && mergeSummary.added > 0) {
                message = `Added ${mergeSummary.added} new ingredients and merged ${mergeSummary.merged} existing ones to "${activeShoppingList.name}"`;
            } else if (mergeSummary.merged > 0) {
                message = `Merged ${mergeSummary.merged} ingredients with existing ones in "${activeShoppingList.name}"`;
            } else {
                message = `Added ${mergeSummary.added} ingredients to "${activeShoppingList.name}"`;
            }
            
            await this.showToast(message, 'success');

            // Navigate to the shopping list
            this.router.navigate(['/tabs/tab1', activeShoppingList.uuid], { relativeTo: this.route });

        } catch (error) {
            console.error('Error adding ingredients to shopping list:', error);
            await loading.dismiss();
            await this.showToast('Failed to add ingredients to shopping list', 'danger');
        }
    }

    /**
     * Show toast message
     */
    private async showToast(message: string, color: string = 'primary') {
        const toast = await this.toastController.create({
            message,
            duration: 3000,
            color,
            position: 'bottom'
        });
        await toast.present();
    }

    /**
     * Open source URL in new tab
     */
    openSourceUrl(url: string) {
        window.open(url, '_blank');
    }
}
