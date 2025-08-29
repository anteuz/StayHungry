import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-styled-button',
  templateUrl: './styled-button.component.html',
  styleUrls: ['./styled-button.component.scss']
})
export class StyledButtonComponent {
  @Input() color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'light' | 'medium' | 'dark' = 'primary';
  @Input() variant: 'solid' | 'outline' | 'clear' = 'solid';
  @Input() size: 'small' | 'default' | 'large' = 'default';
  @Input() expand: 'block' | 'full' | '' = '';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() icon: string = '';
  @Input() iconSlot: 'start' | 'end' | 'icon-only' = 'start';
  @Input() routerLink: string | any[] = '';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() text: string = '';

  @Output() buttonClick = new EventEmitter<Event>();

  onClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.buttonClick.emit(event);
    }
  }

  get buttonClasses(): string {
    const classes = ['styled-button'];
    
    classes.push(`styled-button--${this.color}`);
    classes.push(`styled-button--${this.variant}`);
    classes.push(`styled-button--${this.size}`);
    
    if (this.expand) {
      classes.push(`styled-button--${this.expand}`);
    }
    
    if (this.disabled) {
      classes.push('styled-button--disabled');
    }
    
    if (this.loading) {
      classes.push('styled-button--loading');
    }
    
    if (this.iconSlot === 'icon-only') {
      classes.push('styled-button--icon-only');
    }

    return classes.join(' ');
  }
}
