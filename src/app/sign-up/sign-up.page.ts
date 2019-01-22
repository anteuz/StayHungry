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
        const loadingDialog = await this.loadingCtrl.create({
            message: 'Signing you up...'
        });
        loadingDialog.present().catch(e => console.log('Could not present loading dialog'));
        this.authService.signup(form.value.email, form.value.password)
            .then(
                data => {
                    loadingDialog.dismiss().catch(e => console.log('Could not dismiss dialog'));
                }
            ).catch(
            error => {
                loadingDialog.dismiss().catch(e => console.log('Could not dismiss dialog'));
                const alert = this.alertCtrl.create({
                    header: 'Signup failed!',
                    message: error.message,
                    buttons: ['Ok']
                });
                alert.then(alertWindows => alertWindows.present()).catch(e => console.log('Could not alert'));
            }
        );
    }
}
