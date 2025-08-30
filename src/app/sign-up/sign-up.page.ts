import {Component, OnInit} from '@angular/core';
import {NgForm} from '@angular/forms';
import {AlertController, LoadingController} from '@ionic/angular';
import {AuthService} from '../services/auth.service';

@Component({
    selector: 'app-sign-up',
    templateUrl: './sign-up.page.html',
    styleUrls: ['./sign-up.page.scss'],
})
export class SignUpPage implements OnInit {

    constructor(private authService: AuthService,
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
}
