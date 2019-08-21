import {Component, OnInit, ViewChild} from '@angular/core';

@Component({
    selector: 'app-weekly-menu',
    templateUrl: './weekly-menu.page.html',
    styleUrls: ['./weekly-menu.page.scss'],
})
export class WeeklyMenuPage implements OnInit {

    menu = [1,2,3,4,5];

    constructor() {
    }


    ngOnInit() {
    }

    doReorder(ev: any) {
        // The `from` and `to` properties contain the index of the item
        // when the drag started and ended, respectively
        console.log('Dragged from index', ev.detail.from, 'to', ev.detail.to);
		console.log('Before:' + this.menu);
        // Finish the reorder and position the item in the DOM based on
        // where the gesture ended. This method can also be called directly
        // by the reorder group

        ev.detail.complete(this.menu);
		console.log('After:' + this.menu);
    }

}
