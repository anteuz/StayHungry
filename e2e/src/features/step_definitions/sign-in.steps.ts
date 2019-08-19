import {expect} from 'chai';
import {After, AfterAll, Before, Given, Then, When} from 'cucumber';

import {SignInPage} from '../../pages/sign-in.po';

let page: SignInPage;

Before(() => {
    page = new SignInPage();
});

Given(/^I am on the sign-in page$/,  async () => {
     await page.navigateTo();
});

When(/^I enter valid username$/,  async () => {
     page.enterUsername('testi@testi.fi');
});

When(/^I have correct password$/,  async () => {
     page.enterPassword('ak47su1024');
});

When(/^I click log-in$/,   async () => {
     page.pushLogin();
});

Then(/^I should see shoppin-list page$/, {timeout: 2 * 5000}, async () => {
    expect(await page.getText()).to.equal('Create Shopping List');
});

AfterAll(function () {
    page.pushLogout();
});
