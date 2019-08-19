import {expect} from 'chai';
import {After, AfterAll, Before, Given, Then, When} from 'cucumber';

import {AppPage} from '../../pages/app.po';

let page: AppPage;

Before(() => {
    page = new AppPage();
});

Given(/^I am on the home page$/, async () => {
    await page.navigateTo();
});

When(/^I do nothing$/, () => {
});

Then(/^I should see log-in screen$/, async () => {
    expect(await page.getTitleText()).to.equal('Please log in..');
});

AfterAll(function () {
    // page.pushLogout();
});
