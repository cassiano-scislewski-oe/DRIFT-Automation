const { test, expect } = require('@playwright/test');
const { POManager } = require('../../pages/POManager');
const { handleMFA } = require('../../helpers/mfaHelper');

// Use describe para agrupar funcionalidades relacionadas
test.describe('Autenticação e Acesso', () => {

    test('Login com sucesso', async ({ page }) => {
        const poManager = new POManager(page);
        const login = poManager.getLogin();

        // Use test.step para que cada ação apareça com um nome amigável no relatório do Playwright
        await test.step('Abrir a página de login', async () => {
            await login.abrir();
        });

        await test.step('Preencher credenciais de acesso', async () => {
            await login.realizarLogin(process.env.USER_EMAIL, process.env.USER_PASS);
        });

        await test.step('Resolver desafio de MFA (TOTP)', async () => {
            await handleMFA(page, process.env.MFA_SECRET);
        });

    });

});