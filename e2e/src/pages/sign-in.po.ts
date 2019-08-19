import {browser, by, element, protractor} from 'protractor';

export class SignInPage {


    navigateTo() {
        return browser.get('/sign-in');
    }

    getText() {
        return element(by.id('shoppingListTitle')).getText();
    }

    enterUsername(username: string) {
        element(by.css('ion-input[id=username] > input')).sendKeys(username);
    }
    enterPassword(password: string) {
        element(by.css('ion-input[name=password] > input')).sendKeys(password);
    }
    pushLogin() {
        element(by.css('ion-button[id=login-button]')).click();
    }

    pushLogout() {
        if (element(by.css('ion-button[id=logout-button]')).isPresent()) {
            element(by.css('ion-button[id=logout-button]')).click();
        }
    }
}
