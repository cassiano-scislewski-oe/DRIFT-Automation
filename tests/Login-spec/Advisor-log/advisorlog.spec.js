const { test, expect } = require('@playwright/test');
const { POManager } = require('../../../pages/POManager');
const { handleMFA } = require('../../../helpers/mfaHelper');

test('Advisor Log: Login and navigate to Advisor Log page', async ({ page }) => {
    test.setTimeout(120000);
    const poManager = new POManager(page);
    const login = poManager.getLogin();
    const advisorPage = poManager.getAdvisorPage();
    const advisorlogPage = poManager.getAdvisorLog();
    const collectionName = process.env.COLLECTION_NAME;
    const expectedFirstEntry = 'Summarize California Electric Document';

    await test.step('1. LOGIN AND AUTHENTICATION', async () => {
        await login.open();
        await login.performLogin(process.env.USER_EMAIL, process.env.USER_PASS);
        await handleMFA(page, process.env.MFA_SECRET);
        await advisorPage.homeButton.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('2. NAVIGATE TO ADVISOR LOG', async () => {
        await advisorlogPage.navigateToAdvisorLog();
        await expect(advisorlogPage.pageTitle).toBeVisible({ timeout: 15000 });
    });

    await test.step('3. COLLECTION SELECTION', async () => {
        await advisorlogPage.selectCollectionInAdvisor(collectionName);
    });

    await test.step('4. VALIDATE FIRST LOG ENTRY', async () => {
        await advisorlogPage.validateFirstLogEntry(expectedFirstEntry);
    });

    await test.step('5. CLICK FIRST LOG ENTRY', async () => {
        await advisorlogPage.clickFirstLogEntry();
    });

    await test.step('6. VALIDATE LOG ENTRY DETAILS', async () => {
        await advisorlogPage.validateLogEntryDetails({
            user: process.env.USER_EMAIL,
            title: expectedFirstEntry,
            promptText: 'Summarize the main points of the California Electric document uploaded.'
        });
    });
});
