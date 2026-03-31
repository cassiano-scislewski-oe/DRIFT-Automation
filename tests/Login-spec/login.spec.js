const { test, expect } = require('@playwright/test');
const { POManager } = require('../../pages/POManager');
const { handleMFA } = require('../../helpers/mfaHelper');

// Use describe to group related functionality
test.describe('Authentication and Access', () => {

    const expectedOrganization = 'EcoPower Utilities';
    const expectedTenant = 'EcoPower Utilities-DRIFT';
    const expectedTenantRole = 'TENANT_USER';
    const expectedTenantAppRole = 'DRIFT_ADMIN';

    test('Successful Login', async ({ page }) => {
        test.setTimeout(60000);
        const poManager = new POManager(page);
        const login = poManager.getLogin();

        // Use test.step so each action appears with a friendly name in the Playwright report
        await test.step('Open the login page', async () => {
            await login.open();
        });

        await test.step('Fill in access credentials', async () => {
            await login.performLogin(process.env.USER_EMAIL, process.env.USER_PASS);
        });

        await test.step('Resolve MFA challenge (TOTP)', async () => {
            await handleMFA(page, process.env.MFA_SECRET);
        });

        await page.waitForTimeout(30000);

    });

    test('Validate user profile information', async ({ page }) => {
        const poManager = new POManager(page);
        const login = poManager.getLogin();

        await test.step('Open the login page', async () => {
            await login.open();
        });

        await test.step('Fill in access credentials', async () => {
            await login.performLogin(process.env.USER_EMAIL, process.env.USER_PASS);
        });

        await test.step('Resolve MFA challenge (TOTP)', async () => {
            await handleMFA(page, process.env.MFA_SECRET);
            await page.waitForURL(/.*home/, { timeout: 30000 });
        });

        await test.step('Click on profile button and navigate to the profile page', async () => {
            await login.profileButton.waitFor({ state: 'visible', timeout: 30000 });
            await login.profileButton.click();
            await login.profileMenu.waitFor({ state: 'visible', timeout: 10000 });
            await login.profileMenuOption.click();
            await page.waitForURL(/.*profile/, { timeout: 15000 });
        });

        await test.step('Validate user information on the profile page', async () => {
            const profileContainer = page.locator('app-profile');
            await profileContainer.waitFor({ state: 'visible', timeout: 15000 });
            await expect(profileContainer).toContainText(process.env.USER_EMAIL);
            await expect(profileContainer).toContainText(expectedOrganization);
            await expect(profileContainer).toContainText(expectedTenant);
        });

    });

});