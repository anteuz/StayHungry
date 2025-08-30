import {Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonButtons, IonMenuToggle, IonButton, IonIcon, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput } from '@ionic/angular/standalone';
import {NgForm} from '@angular/forms';
import {AlertController, LoadingController} from '@ionic/angular';
import {AuthService} from '../services/auth.service';
import {UserStorageService, UserData} from '../services/user-storage.service';

@Component({
    selector: 'app-sign-up',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonMenuToggle,
        IonButton,
        IonIcon,
        IonTitle,
        IonContent,
        IonList,
        IonItem,
        IonLabel,
        IonInput
    ],
    templateUrl: './sign-up.page.html',
    styleUrls: ['./sign-up.page.scss'],
})
export class SignUpPage implements OnInit {

    showEmailForm = false;

    constructor(
        private authService: AuthService,
        private userStorageService: UserStorageService,
        private loadingCtrl: LoadingController,
        private alertCtrl: AlertController
    ) {
    }

    ngOnInit() {
    }

    async onSignup(form: NgForm) {
        if (!form.valid) {
            return;
        }

        const loadingDialog = await this.loadingCtrl.create({
            message: 'Creating your account...'
        });

      try {
            await loadingDialog.present();
            
            await this.authService.signup(form.value.email, form.value.password);
            await loadingDialog.dismiss();
            
            const successAlert = await this.alertCtrl.create({
                header: 'Account Created',
                message: 'Your account has been created successfully. You can now sign in.',
                buttons: ['OK']
            });
            await successAlert.present();
            
        } catch (error) {
            await loadingDialog.dismiss();
            
            // Sanitize error message to prevent information disclosure
            let userMessage = 'Account creation failed. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                userMessage = 'An account with this email already exists.';
            } else if (error.code === 'auth/weak-password') {
                userMessage = 'Password is too weak. Please choose a stronger password.';
            } else if (error.code === 'auth/invalid-email') {
                userMessage = 'Invalid email format.';
            } else if (error.code === 'auth/password-too-short') {
                userMessage = 'Password must be at least 8 characters.';
            } else if (typeof error.message === 'string' && (error.message.includes('Invalid email format') || error.message.includes('Password must be at least 8 characters'))) {
                userMessage = error.message;
            }
            
            const alert = await this.alertCtrl.create({
                header: 'Sign Up Failed',
                message: userMessage,
                buttons: ['OK']
            });
            await alert.present();
        }

    }

    async onGoogleSignup() {
        const loadingDialog = await this.loadingCtrl.create({
            message: 'Signing up with Google...'
        });
        loadingDialog.present().catch(e => console.log('Could not present loading dialog'));
        
        this.authService.signUpWithGoogle()
            .then(async (data) => {
                loadingDialog.dismiss().catch(e => console.log('Could not dismiss dialog'));
                await this.userStorageService.storeFromCredential(data);
                
                // Show success message
                const alert = this.alertCtrl.create({
                    header: 'Google Sign up successful!',
                    message: 'Your account has been created successfully with Google.',
                    buttons: ['Ok']
                });
                alert.then(alertWindow => alertWindow.present()).catch(e => console.log('Could not alert'));
            })
            .catch(error => {
                loadingDialog.dismiss().catch(e => console.log('Could not dismiss dialog'));
                const alert = this.alertCtrl.create({
                    header: 'Google Signup failed!',
                    message: error.message,
                    buttons: ['Ok']
                });
                alert.then(alertWindows => alertWindows.present()).catch(e => console.log('Could not alert'));
            });
    }

}
