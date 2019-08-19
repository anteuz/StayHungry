import {Component, OnInit} from '@angular/core';
import {ModalController, NavParams, PopoverController} from '@ionic/angular';
import {Cart} from '../models/cart';
import {ShoppingListTransferComponent} from '../shopping-list-transfer/shopping-list-transfer.component';

@Component({
    selector: 'app-cart-popover',
    templateUrl: './cart-popover.component.html',
    styleUrls: ['./cart-popover.component.scss']
})
export class CartPopoverComponent implements OnInit {

    cart: Cart;

    constructor(private navParams: NavParams,
                private popoverCtrl: PopoverController,
                private modalController: ModalController) {
    }

    ngOnInit() {
        this.cart = this.navParams.get('cart');
    }

    removeFromCart(recipe) {
        this.cart.recipes.splice(this.cart.recipes.indexOf(recipe), 1);
        if (this.cart.recipes.length === 0) {
            this.popoverCtrl.dismiss(this.cart).catch(e => console.log('Could not pop-over modal'));
        }
    }

    onDismiss(event: Event) {
    	//TODO: FIXME
    	console.log(event);
        if (event.type === 'ion-content') {
            this.popoverCtrl.dismiss(this.cart).catch(e => console.log('Could not pop-over modal'));
        }
    }

    async moveToShoppingList() {
        let modal = await this.modalController.create({
            component: ShoppingListTransferComponent,
            animated: true,
            showBackdrop: true,
            cssClass: 'noBackground',
            backdropDismiss: false,
            componentProps:
                {
                    'cart': this.cart
                }
        });
        modal.present().catch(e => console.log('Could not show modal!'));

        const {data} = await modal.onDidDismiss(); // Maybe later?

        console.log(data);

        if (data !== undefined) {
           if (data === 'itemsMovedToShoppingList') {
               modal = null;
               this.popoverCtrl.dismiss(null).catch(e => console.log('Could not pop-over modal'));
           }
           else {
               // do nothing
               modal = null;
               this.popoverCtrl.dismiss(this.cart).catch(e => console.log('Could not pop-over modal'));
           }
        }
    }
}
