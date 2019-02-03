import { browser, by, element } from 'protractor';

export class SignInPage {

    navigateTo() {
        return browser.get('/sign-in');
    }

    getText() {
        return element(by.id('no-shopping-list-text')).getText();
    }

    enterUsername(username: string) {
        element(by.id('username')).sendKeys(username);
    }
    enterPassword(password: string) {
        element(by.id('password')).sendKeys(password);
    }
    pushLogin() {
        element(by.id('login-button')).click();
        browser.pause();
    }
}
