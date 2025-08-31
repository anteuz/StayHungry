import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.page.html',
  styleUrls: ['./sign-in.page.scss'],
})
export class SignInPage implements OnInit, OnDestroy {
  private authSubscription?: Subscription;
  private returnUrl = '/';
  
  constructor(
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router,
    private route: ActivatedRoute,
    private platform: Platform
  ) {}

  ngOnInit() {
    // Get return URL from query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Check if already authenticated
    this.authSubscription = this.authService.authState$.subscribe(authState => {
      if (authState.isAuthenticated && !authState.isLoading) {
        this.navigateToReturnUrl();
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
   * Handle Google sign-in
   */
  async onGoogleSignIn(): Promise<void> {
    const loading = await this.loadingCtrl.create({
      message: 'Signing in with Google...',
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
        // Navigation will be handled by auth state subscription
      }
    } catch (error) {
      await loading.dismiss();
      await this.showErrorAlert('Google Sign-In Failed', error.message);
    }
  }

  /**
   * Check for redirect result after Google redirect sign-in
   */
  private async checkRedirectResult(): Promise<void> {
    try {
      const result = await this.authService.getRedirectResult();
      if (result && result.user) {
        // User signed in via redirect, navigation will be handled by auth state subscription
        console.log('Google redirect sign-in successful');
      }
    } catch (error) {
      console.error('Redirect result error:', error);
      await this.showErrorAlert('Sign-In Error', error.message);
    }
  }

  /**
   * Navigate to return URL or default route
   */
  private navigateToReturnUrl(): void {
    this.router.navigate([this.returnUrl]).catch(error => {
      console.error('Navigation error:', error);
      // Fallback to home page
      this.router.navigate(['/']).catch(e => {
        console.error('Fallback navigation error:', e);
      });
    });
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
   * Navigate to sign-up page
   */
  goToSignUp(): void {
    this.router.navigate(['/sign-up']).catch(error => {
      console.error('Navigation to sign-up error:', error);
    });
  }
}