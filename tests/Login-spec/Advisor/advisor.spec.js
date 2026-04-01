const { test, expect } = require('@playwright/test');
const { POManager } = require('../../../pages/POManager');
const { handleMFA } = require('../../../helpers/mfaHelper');
const path = require('path');
const fs = require('fs');

test('RAG Flow: Admin Upload (PDF), Return Home and Advisor Question', async ({ page }) => {
    test.setTimeout(480000);
    const poManager = new POManager(page);
    const login = poManager.getLogin();
    const adminPage = poManager.getAdminPage();
    const advisorPage = poManager.getAdvisorPage();
    const collectionName = process.env.COLLECTION_NAME;

    await test.step('1. LOGIN AND AUTHENTICATION', async () => {
        await login.open();
        await login.performLogin(process.env.USER_EMAIL, process.env.USER_PASS);
        await handleMFA(page, process.env.MFA_SECRET);
        await advisorPage.homeButton.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('2. ADMIN: SELECTION AND UPLOAD (PDF)', async () => {
        await adminPage.navigateToAdmin();
        await adminPage.selectCollection(collectionName);
        await adminPage.clearDocumentsIfExist();

        const filesFolder = path.join(process.cwd(), 'fixtures', 'files');
        const actualFile = fs.readdirSync(filesFolder).find(f => f.toLowerCase().endsWith('.pdf') && f.includes('Electric'));
        await adminPage.uploadFiles(path.join(filesFolder, actualFile));
        
        await expect(page.getByText('Upload Complete')).toBeVisible({ timeout: 60000 });
        await page.waitForTimeout(90000); // Aguarda ingestão
    });

    await test.step('3. RETURN TO HOME', async () => {
        await advisorPage.clickHome();
    });

    await test.step('4. ADVISOR ACCESS', async () => {
        await advisorPage.navigateToAdvisor();  
    });

    await test.step('5. MODEL VALIDATION', async () => {
        await advisorPage.validateSingleClaudeModel();
    });

    await test.step('6. COLLECTION SELECTION', async () => {
        await advisorPage.selectCollectionInAdvisor(collectionName);
    });

    await test.step('7. ASK A QUESTION TO THE LLM', async () => {
        const question = 'Summarize the main points of the California Electric document uploaded.';
        await advisorPage.askQuestion(question);
        await page.waitForTimeout(20000); // Espera inicial para o LLM começar a escrever
    });

    await test.step('8. VALIDATE RESPONSE AND SOURCES (RAG)', async () => {
        const termoChaveResposta = /California Electric.*Reliability.*2006-2015/i;
        const fonteEsperada = 'Review of California Electric Utility Reliability 2006-2015';
        
        await advisorPage.validateResponsePresent(120000);
        await advisorPage.validateContentAndReferences(termoChaveResposta, fonteEsperada);
    });

    await test.step('9. VALIDATE CHAT HISTORY', async () => {
        await advisorPage.validateHistory('California Electric');    
    });
});

test('RAG Flow: Admin Upload (DOCX), Return Home and Advisor Question', async ({ page }) => {
    test.setTimeout(480000);
    const poManager = new POManager(page);
    const login = poManager.getLogin();
    const adminPage = poManager.getAdminPage();
    const advisorPage = poManager.getAdvisorPage();
    const collectionName = process.env.COLLECTION_NAME;

    await test.step('1. LOGIN AND AUTHENTICATION', async () => {
        await login.open();
        await login.performLogin(process.env.USER_EMAIL, process.env.USER_PASS);
        await handleMFA(page, process.env.MFA_SECRET);
        await advisorPage.homeButton.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('2. ADMIN: SELECTION AND UPLOAD (DOCX)', async () => {
        await adminPage.navigateToAdmin();
        await adminPage.selectCollection(collectionName);
        await adminPage.clearDocumentsIfExist();

        const filesFolder = path.join(process.cwd(), 'fixtures', 'files');
        const actualFile = fs.readdirSync(filesFolder).find(f => f.toLowerCase().endsWith('.docx') && f.includes('Electric'));
        await adminPage.uploadFiles(path.join(filesFolder, actualFile));
        
        await expect(page.getByText('Upload Complete')).toBeVisible({ timeout: 60000 });
        await page.waitForTimeout(90000); // Aguarda ingestão
    });

    await test.step('3. RETURN TO HOME', async () => {
        await advisorPage.clickHome();
    });

    await test.step('4. ADVISOR ACCESS', async () => {
        await advisorPage.navigateToAdvisor();  
    });

    await test.step('5. MODEL VALIDATION', async () => {
        await advisorPage.validateSingleClaudeModel();
    });

    await test.step('6. COLLECTION SELECTION', async () => {
        await advisorPage.selectCollectionInAdvisor(collectionName);
    });

    await test.step('7. ASK A QUESTION TO THE LLM', async () => {
        const question = 'Summarize the main points of the California Electric document uploaded.';
        await advisorPage.askQuestion(question);
        await page.waitForTimeout(20000); // Espera inicial para o LLM começar a escrever
    });

    await test.step('8. VALIDATE RESPONSE AND SOURCES (RAG)', async () => {
        const termoChaveResposta = /California Electric.*Reliability.*2006-2015/i;
        const fonteEsperada = 'Review of California Electric Utility Reliability 2006-2015';
        
        await advisorPage.validateResponsePresent(120000);
        await advisorPage.validateContentAndReferences(termoChaveResposta, fonteEsperada);
    });

    await test.step('9. VALIDATE CHAT HISTORY', async () => {
        await advisorPage.validateHistory('California Electric');    
    });
});
