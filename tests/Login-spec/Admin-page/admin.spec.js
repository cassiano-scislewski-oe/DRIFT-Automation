const { test, expect } = require('@playwright/test');
const { POManager } = require('../../../pages/POManager');
const { handleMFA } = require('../../../helpers/mfaHelper');
const path = require('path');
const fs = require('fs');

test.describe('Fluxo Admin', () => {

    test('Fluxo Completo Admin: Upload, Edição de Ano e Renomeação', async ({ page }) => {
        test.setTimeout(420000);

        const poManager = new POManager(page);
        const login = poManager.getLogin();
        const adminPage = poManager.getAdminPage();
        
        const nomeOriginal = 'collection 18-march-V3';
        const nomeUpdated = 'collection 18-march-V3(updated)';

        await test.step('1. LOGIN E NAVEGAÇÃO', async () => {
            await login.abrir();
            await login.realizarLogin(process.env.USER_EMAIL, process.env.USER_PASS);
            await handleMFA(page, process.env.MFA_SECRET);
            await adminPage.navegarParaAdmin();
            await expect(page).toHaveURL(/.*admin/);
        });

        await test.step('2. SELEÇÃO E UPLOAD DO DOCUMENTO', async () => {
            await adminPage.selecionarCollection(nomeOriginal);
            await adminPage.limparDocumentosSeExistirem();
            const pastaFiles = path.join(process.cwd(), 'fixtures', 'files');
            const arquivos = fs.readdirSync(pastaFiles);
            const arquivoReal = arquivos.find(f => f.includes('Electric'));
            
            await adminPage.uploadArquivos(path.join(pastaFiles, arquivoReal));
        });

        await test.step('3. VALIDAÇÃO UPLOAD E ESPERA DE PROCESSAMENTO', async () => {
            await expect(page.getByText('Upload Complete')).toBeVisible({ timeout: 60000 });
            console.log('Aguardando 90 segundos para o processamento...');
            await page.waitForTimeout(90000);
        });

        await test.step('4. REFRESH E RE-SELEÇÃO DA COLLECTION', async () => {
            await page.reload();
            await adminPage.selecionarCollection(nomeOriginal);
        });

        await test.step('5. VALIDAÇÃO DO TÍTULO NA TABELA', async () => {
            const celulaTitulo = page.locator('.ag-cell[col-id="title"]');
            await expect(celulaTitulo.filter({ hasText: 'Review of California Electric' }))
                .toBeVisible({ timeout: 60000 });
        });

        await test.step('6. EDIÇÃO DO DOCUMENTO (Alterar Ano)', async () => {
            console.log('Abrindo edição do documento na tabela...');
            await adminPage.abrirEdicaoDocumento();

            console.log('Validando Processing Stage e alterando ano para 2026...');
            await adminPage.validarProcessingStage('complete');
            await adminPage.alterarAnoDocumento('2026');

            console.log('Salvando alterações do documento...');
            await adminPage.saveDocumentButton.click();

            await expect(adminPage.saveDocumentButton).toBeHidden({ timeout: 15000 });
            
            console.log('Validando se o ano 2026 reflete na tabela...');

            await adminPage.validarAnoNaTabela('2026');
        });

        await test.step('7. RENOMEAR COLLECTION (Ida e Volta)', async () => {
            console.log(`Alterando nome da collection para: ${nomeUpdated}`);
            await page.waitForTimeout(2000); 
            await adminPage.renomearCollection(nomeUpdated);
            await expect(adminPage.collectionInput).toHaveValue(nomeUpdated);

            console.log(`Restaurando nome original: ${nomeOriginal}`);
            await adminPage.renomearCollection(nomeOriginal);
            await expect(adminPage.collectionInput).toHaveValue(nomeOriginal);
        });

        await test.step('8. FLUXO DE FILTRAGEM INDEPENDENTE', async () => {
            console.log('Iniciando fluxo de filtragem independente para o ano 2026...');
            await adminPage.filtrarPorAno('2026');
            
            const celulaAno = page.locator('.ag-cell[col-id="year"]').first();
            await expect(celulaAno).toHaveText('2026');
        });

        await test.step('9. LIMPEZA: REMOÇÃO DO DOCUMENTO', async () => {
            console.log('Iniciando limpeza: Removendo o documento utilizado no teste...');
            await page.reload();
            await adminPage.selecionarCollection(nomeOriginal);

            await adminPage.removerPrimeiroDocumento();

            await expect(page.getByText('Review of California Electric')).not.toBeVisible({ timeout: 10000 });
        });

        console.log('Fluxo completo finalizado com sucesso!');
    });

});
