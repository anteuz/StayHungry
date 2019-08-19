import { browser, by, element } from 'protractor';

export class AppPage {

  navigateTo() {
    return browser.get('/');
  }

  getTitleText() {
    return element(by.id('sign-in-title')).getText();
  }
  pushLogout() {
    if (element(by.css('ion-button[id=logout-button]')).isPresent()) {
      element(by.css('ion-button[id=logout-button]')).click();
    }
  }
}
