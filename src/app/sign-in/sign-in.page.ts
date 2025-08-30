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
                await this.storeUserDataFromCredential(data);
                
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
                await this.storeUserDataFromCredential(data);
                
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

    private async storeUserDataFromCredential(data: { user: any }): Promise<void> {
        const user = data.user;
        const userData: UserData = {
            email: user.email || '',
            uid: user.uid,
            displayName: user.displayName || undefined,
            photoURL: user.photoURL || undefined,
            providerId: user.providerData[0]?.providerId || undefined,
            lastLogin: new Date()
        };
        await this.userStorageService.storeUserData(userData);
    }
}
