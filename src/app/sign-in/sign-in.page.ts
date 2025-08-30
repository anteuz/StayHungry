import {Component, OnInit} from '@angular/core';
import {NgForm} from '@angular/forms';
import {Router} from '@angular/router';
import {AlertController, LoadingController} from '@ionic/angular';
import {AuthService} from '../services/auth.service';

@Component({
    selector: 'app-sign-in',
    templateUrl: './sign-in.page.html',
    styleUrls: ['./sign-in.page.scss'],
})
export class SignInPage implements OnInit {

    constructor(
        private authService: AuthService,
        private loadingCtrl: LoadingController,
        private alertCtrl: AlertController,
        private router: Router
    ) {
    }

    ngOnInit() {
    }

    async onSignin(form: NgForm) {
        if (!form.valid) {
            return;
        }

        const loadingDialog = await this.loadingCtrl.create({
            message: 'Signing you in...'
        });

        try {
            await loadingDialog.present();
            
            await this.authService.signin(form.value.email, form.value.password);
            await loadingDialog.dismiss();
            await this.router.navigate(['/']);
            
        } catch (error) {
            await loadingDialog.dismiss();
            
            // Sanitize error message to prevent information disclosure
            let userMessage = 'Sign in failed. Please check your credentials.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                userMessage = 'Invalid email or password.';
            } else if (error.code === 'auth/too-many-requests') {
                userMessage = 'Too many failed attempts. Please try again later.';
            } else if (error.code === 'auth/invalid-email') {
                userMessage = 'Invalid email format.';
            } else if (typeof error.message === 'string' && error.message.includes('Invalid email format')) {
                userMessage = error.message;
            }
            
            const alert = await this.alertCtrl.create({
                header: 'Sign In Failed',
                message: userMessage,
                buttons: ['OK']
            });
            await alert.present();
        }
    }

}
