import {Component, OnInit} from '@angular/core';
import {NgForm} from '@angular/forms';
import {Router} from '@angular/router';
import {AlertController, LoadingController} from '@ionic/angular';
import {AuthService} from '../services/auth.service';
import {UserStorageService, UserData} from '../services/user-storage.service';

@Component({
    selector: 'app-sign-in',
    templateUrl: './sign-in.page.html',
    styleUrls: ['./sign-in.page.scss'],
})
export class SignInPage implements OnInit {

    showEmailForm = false;

    constructor(
        private authService: AuthService,
        private userStorageService: UserStorageService,
        private loadingCtrl: LoadingController,
        private alertCtrl: AlertController,
        private router: Router
    ) {
    }

    ngOnInit() {
    }

    async onSignin(form: NgForm) {
        const loadingDialog = await this.loadingCtrl.create({
            message: 'Signing you in...'
        });

        loadingDialog.present().catch(e => console.log('Could not present loading dialog'));

        this.authService.signin(form.value.email, form.value.password)
            .then(async (data) => {
                loadingDialog.dismiss().catch(e => console.log('Could not dismiss loading dialog'));
                
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
                
                console.log('Navigating to shopping list..');
                this.router.navigate(['/']).catch(e => console.log('Could not navigate'));
            })
            .catch(error => {
                loadingDialog.dismiss().catch(e => console.log('Could not dismiss loading dialog'));
                const alert = this.alertCtrl.create({
                    header: 'Signing failed!',
                    message: error.message,
                    buttons: ['Ok']
                });
                alert.then(alertWindow => alertWindow.present()).catch(e => console.log('Could not alert'));
            });
    }

    async onGoogleSignin() {
        const loadingDialog = await this.loadingCtrl.create({
            message: 'Signing in with Google...'
        });

        loadingDialog.present().catch(e => console.log('Could not present loading dialog'));

        this.authService.signInWithGoogle()
            .then(async (data) => {
                loadingDialog.dismiss().catch(e => console.log('Could not dismiss loading dialog'));
                
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
                
                console.log('Navigating to shopping list..');
                this.router.navigate(['/']).catch(e => console.log('Could not navigate'));
            })
            .catch(error => {
                loadingDialog.dismiss().catch(e => console.log('Could not dismiss loading dialog'));
                const alert = this.alertCtrl.create({
                    header: 'Google Sign-in failed!',
                    message: error.message,
                    buttons: ['Ok']
                });
                alert.then(alertWindow => alertWindow.present()).catch(e => console.log('Could not alert'));
            });
    }
}
