import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

export interface ToastOptions {
  message: string;
  color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'medium' | 'light' | 'dark';
  duration?: number;
  position?: 'top' | 'bottom' | 'middle';
  cssClass?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private toastController: ToastController) {}

  /**
   * Show a non-blocking toast notification
   * Uses shorter duration and better positioning to avoid interfering with user interactions
   */
  async show(options: ToastOptions): Promise<void> {
    const toast = await this.toastController.create({
      message: options.message,
      duration: options.duration || 2000, // Shorter default duration
      color: options.color || 'primary',
      position: options.position || 'top',
      cssClass: options.cssClass || 'non-blocking-toast',
      buttons: [
        {
          icon: 'close',
          role: 'cancel',
          side: 'end'
        }
      ]
    });
    
    await toast.present();
  }

  /**
   * Show success toast
   */
  async showSuccess(message: string, duration: number = 2000): Promise<void> {
    await this.show({
      message,
      color: 'success',
      duration,
      position: 'top'
    });
  }

  /**
   * Show error toast
   */
  async showError(message: string, duration: number = 3000): Promise<void> {
    await this.show({
      message,
      color: 'danger',
      duration,
      position: 'top'
    });
  }

  /**
   * Show warning toast
   */
  async showWarning(message: string, duration: number = 2500): Promise<void> {
    await this.show({
      message,
      color: 'warning',
      duration,
      position: 'top'
    });
  }

  /**
   * Show info toast
   */
  async showInfo(message: string, duration: number = 2000): Promise<void> {
    await this.show({
      message,
      color: 'primary',
      duration,
      position: 'top'
    });
  }

  /**
   * Show bottom toast for less intrusive notifications
   */
  async showBottom(message: string, color: string = 'primary', duration: number = 1500): Promise<void> {
    await this.show({
      message,
      color: color as any,
      duration,
      position: 'bottom'
    });
  }
}
