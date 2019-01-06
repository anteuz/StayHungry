import { Component, OnInit } from '@angular/core';
import {PopoverController}   from '@ionic/angular';

@Component({
  selector: 'app-persistence-overlay',
  templateUrl: 'persistence-overlay.component.html',
  styleUrls: ['./persistence-overlay.component.scss']
})
export class PersistenceOverlayComponent implements OnInit {

  constructor(private viewCtrl: PopoverController) {}

  onAction(action: string) {
    console.log('On action: ' + action);
    this.viewCtrl.dismiss({action: action});
  }

  ngOnInit(): void {}

}
