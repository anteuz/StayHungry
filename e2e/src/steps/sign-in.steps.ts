import {expect} from 'chai';
import {Before, Given, Then, When} from 'cucumber';

import {SignInPage} from '../pages/sign-in.po';

let page: SignInPage;

Before(() => {
    page = new SignInPage();
});

Given(/^I am on the sign-in page$/, async () => {
    await page.navigateTo();
});

When(/^I enter valid credentials$/, async () => {
    page.enterUsername('testi@testi.fi');
    page.enterPassword('ak47su1024');
    page.pushLogin();
});


Then(/^I should see shoppin-list page$/, async () => {
    expect(await page.getText()).to.equal('You have no shopping lists, please create one first!');
});
