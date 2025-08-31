import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
})
export class SignUpPage implements OnInit, OnDestroy {
  private authSubscription?: Subscription;
  
  constructor(
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router,
    private platform: Platform
  ) {}

  ngOnInit() {
    // Check if already authenticated
    this.authSubscription = this.authService.authState$.subscribe(authState => {
      if (authState.isAuthenticated && !authState.isLoading) {
        this.navigateToHome();
      }
    });

    // Check for redirect result on page load
    this.checkRedirectResult();
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  /**
   * Handle Google sign-up (same as sign-in for Google)
   */
  async onGoogleSignUp(): Promise<void> {
    const loading = await this.loadingCtrl.create({
      message: 'Creating account with Google...',
      spinner: 'circular'
    });

    try {
      await loading.present();

      // Use popup for web, redirect for mobile
      if (this.platform.is('capacitor') || this.platform.is('cordova')) {
        await this.authService.signInWithGoogleRedirect();
        // Don't dismiss loading here - redirect will handle it
      } else {
        await this.authService.signInWithGooglePopup();
        await loading.dismiss();
        await this.showSuccessAlert();
        // Navigation will be handled by auth state subscription
      }
    } catch (error) {
      await loading.dismiss();
      await this.showErrorAlert('Google Sign-Up Failed', error.message);
    }
  }

  /**
   * Check for redirect result after Google redirect sign-up
   */
  private async checkRedirectResult(): Promise<void> {
    try {
      const result = await this.authService.getRedirectResult();
      if (result && result.user) {
        // User signed up via redirect
        console.log('Google redirect sign-up successful');
        await this.showSuccessAlert();
        // Navigation will be handled by auth state subscription
      }
    } catch (error) {
      console.error('Redirect result error:', error);
      await this.showErrorAlert('Sign-Up Error', error.message);
    }
  }

  /**
   * Navigate to home page
   */
  private navigateToHome(): void {
    this.router.navigate(['/']).catch(error => {
      console.error('Navigation error:', error);
    });
  }

  /**
   * Show success alert
   */
  private async showSuccessAlert(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Welcome!',
      message: 'Your account has been created successfully.',
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Show error alert
   */
  private async showErrorAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Navigate to sign-in page
   */
  goToSignIn(): void {
    this.router.navigate(['/sign-in']).catch(error => {
      console.error('Navigation to sign-in error:', error);
    });
  }
}