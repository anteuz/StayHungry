import { Component, OnInit } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [IonButton, IonIcon],
  template: `
    <ion-button 
      fill="clear" 
      size="small"
      (click)="toggleTheme()"
      class="theme-toggle-btn"
      [attr.aria-label]="getAriaLabel()">
      <ion-icon 
        [name]="currentTheme === 'dark' ? 'sunny' : 'moon'"
        slot="icon-only">
      </ion-icon>
    </ion-button>
  `,
  styles: [`
    .theme-toggle-btn {
      --color: var(--ion-color-medium);
      --color-hover: var(--ion-color-primary);
      transition: all 0.2s ease-in-out;
    }
    
    .theme-toggle-btn:hover {
      --color: var(--ion-color-primary);
      transform: scale(1.1);
    }
    
    .theme-toggle-btn ion-icon {
      font-size: 1.2em;
    }
  `]
})
export class ThemeToggleComponent implements OnInit {
  currentTheme: 'light' | 'dark' = 'light';

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  getAriaLabel(): string {
    return `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} theme`;
  }
}