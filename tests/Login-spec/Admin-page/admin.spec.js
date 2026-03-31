const { test, expect } = require('@playwright/test');
const { POManager } = require('../../../pages/POManager');
const { handleMFA } = require('../../../helpers/mfaHelper');
const path = require('path');
const fs = require('fs');

test.describe('Admin Flow', () => {

    test('Admin Complete Flow: Upload, Year Edit and Rename', async ({ page }) => {
        test.setTimeout(420000);

        const poManager = new POManager(page);
        const login = poManager.getLogin();
        const adminPage = poManager.getAdminPage();
        
        const originalName = 'collection 18-march-V3';
        const updatedName = 'collection 18-march-V3(updated)';

        await test.step('1. LOGIN AND NAVIGATION', async () => {
            await login.open();
            await login.performLogin(process.env.USER_EMAIL, process.env.USER_PASS);
            await handleMFA(page, process.env.MFA_SECRET);
            await adminPage.navigateToAdmin();
            await expect(page).toHaveURL(/.*admin/);
        });

        await test.step('2. DOCUMENT SELECTION AND UPLOAD', async () => {
            await adminPage.selectCollection(originalName);
            await adminPage.clearDocumentsIfExist();
            const filesFolder = path.join(process.cwd(), 'fixtures', 'files');
            const files = fs.readdirSync(filesFolder);
            const actualFile = files.find(f => f.includes('Electric'));
            
            await adminPage.uploadFiles(path.join(filesFolder, actualFile));
        });

        await test.step('3. UPLOAD VALIDATION AND PROCESSING WAIT', async () => {
            await expect(page.getByText('Upload Complete')).toBeVisible({ timeout: 60000 });
            console.log('Waiting 90 seconds for processing...');
            await page.waitForTimeout(90000);
        });

        await test.step('4. REFRESH AND COLLECTION RE-SELECTION', async () => {
            await page.reload();
            await adminPage.selectCollection(originalName);
        });

        await test.step('5. TABLE TITLE VALIDATION', async () => {
            const titleCell = page.locator('.ag-cell[col-id="title"]');
            await expect(titleCell.filter({ hasText: 'Review of California Electric' }))
                .toBeVisible({ timeout: 60000 });
        });

        await test.step('6. DOCUMENT EDIT (Change Year)', async () => {
            console.log('Opening document edit in the table...');
            await adminPage.openDocumentEdit();

            console.log('Validating Processing Stage and changing year to 2026...');
            await adminPage.validateProcessingStage('complete');
            await adminPage.changeDocumentYear('2026');

            console.log('Saving document changes...');
            await adminPage.saveDocumentButton.click();

            await expect(adminPage.saveDocumentButton).toBeHidden({ timeout: 15000 });
            
            console.log('Validating if year 2026 reflects in the table...');

            await adminPage.validateYearInTable('2026');
        });

        await test.step('7. RENAME COLLECTION (Round Trip)', async () => {
            console.log(`Renaming collection to: ${updatedName}`);
            await page.waitForTimeout(2000); 
            await adminPage.renameCollection(updatedName);
            await expect(adminPage.collectionInput).toHaveValue(updatedName);

            console.log(`Restoring original name: ${originalName}`);
            await adminPage.renameCollection(originalName);
            await expect(adminPage.collectionInput).toHaveValue(originalName);
        });

        await test.step('8. INDEPENDENT FILTERING FLOW', async () => {
            console.log('Starting independent filtering flow for year 2026...');
            await adminPage.filterByYear('2026');
            
            const yearCell = page.locator('.ag-cell[col-id="year"]').first();
            await expect(yearCell).toHaveText('2026');
        });

        await test.step('9. CLEANUP: DOCUMENT REMOVAL', async () => {
            console.log('Starting cleanup: Removing the document used in the test...');
            await page.reload();
            await adminPage.selectCollection(originalName);

            await adminPage.clearDocumentsIfExist();

            await expect(page.getByText('Review of California Electric')).not.toBeVisible({ timeout: 10000 });
        });

        console.log('Complete flow finished successfully!');
    });

});
