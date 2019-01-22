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
        const loadingDialog = await this.loadingCtrl.create({
            message: 'Signing you in...'
        });

        loadingDialog.present().catch(e => console.log('Could not present loading dialog'));

        this.authService.signin(form.value.email, form.value.password)
            .then(data => {
                    loadingDialog.dismiss().catch(e => console.log('Could not dismiss loading dialog'));
                    console.log('Navigating to shopping list..');
                    this.router.navigate(['/']).catch(e => console.log('Could not navigate'));
                }
            )
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
}
