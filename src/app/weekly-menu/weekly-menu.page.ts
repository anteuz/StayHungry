import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-weekly-menu',
  templateUrl: './weekly-menu.page.html',
  styleUrls: ['./weekly-menu.page.scss'],
})
export class WeeklyMenuPage implements OnInit {

  menu = ['Item 1', 'Item 2', 'Item 3'];

  constructor() { }

  ngOnInit() {
  }

}
