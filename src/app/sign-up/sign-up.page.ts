import {Component, OnInit} from '@angular/core';
import {NgForm} from '@angular/forms';
import {AlertController, LoadingController} from '@ionic/angular';
import {AuthService} from '../services/auth.service';
import {UserStorageService, UserData} from '../services/user-storage.service';

@Component({
    selector: 'app-sign-up',
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
        const loadingDialog = await this.loadingCtrl.create({
            message: 'Signing you up...'
        });
        loadingDialog.present().catch(e => console.log('Could not present loading dialog'));
        
        this.authService.signup(form.value.email, form.value.password)
            .then(async (data) => {
                loadingDialog.dismiss().catch(e => console.log('Could not dismiss dialog'));
                
                // Store user data
                const userData: UserData = {
                    email: data.user.email || '',
                    uid: data.user.uid,
                    displayName: data.user.displayName || undefined,
                    photoURL: data.user.photoURL || undefined,
                    providerId: data.user.providerData[0]?.providerId || undefined,
                    lastLogin: new Date()
                };
                await this.userStorageService.storeUserData(userData);
                
                // Show success message
                const alert = this.alertCtrl.create({
                    header: 'Sign up successful!',
                    message: 'Your account has been created successfully.',
                    buttons: ['Ok']
                });
                alert.then(alertWindow => alertWindow.present()).catch(e => console.log('Could not alert'));
            })
            .catch(error => {
                loadingDialog.dismiss().catch(e => console.log('Could not dismiss dialog'));
                const alert = this.alertCtrl.create({
                    header: 'Signup failed!',
                    message: error.message,
                    buttons: ['Ok']
                });
                alert.then(alertWindows => alertWindows.present()).catch(e => console.log('Could not alert'));
            });
    }

    async onGoogleSignup() {
        const loadingDialog = await this.loadingCtrl.create({
            message: 'Signing up with Google...'
        });
        loadingDialog.present().catch(e => console.log('Could not present loading dialog'));
        
        this.authService.signUpWithGoogle()
            .then(async (data) => {
                loadingDialog.dismiss().catch(e => console.log('Could not dismiss dialog'));
                
                // Store user data
                const userData: UserData = {
                    email: data.user.email || '',
                    uid: data.user.uid,
                    displayName: data.user.displayName || undefined,
                    photoURL: data.user.photoURL || undefined,
                    providerId: data.user.providerData[0]?.providerId || undefined,
                    lastLogin: new Date()
                };
                await this.userStorageService.storeUserData(userData);
                
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
