const { test, expect } = require('@playwright/test');
const { POManager } = require('../../../pages/POManager');
const { handleMFA } = require('../../../helpers/mfaHelper');
const path = require('path');
const fs = require('fs');

test('Fluxo RAG: Upload Admin, Retorno Home e Pergunta Advisor', async ({ page }) => {
    test.setTimeout(480000);
    const poManager = new POManager(page);
    const login = poManager.getLogin();
    const adminPage = poManager.getAdminPage();
    const advisorPage = poManager.getAdvisorPage();
    const nomeCollection = 'collection 18-march-V3';

    await test.step('1. LOGIN E AUTENTICAÇÃO', async () => {
        await login.abrir();
        await login.realizarLogin(process.env.USER_EMAIL, process.env.USER_PASS);
        await handleMFA(page, process.env.MFA_SECRET);
        await advisorPage.homeButton.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('2. ADMIN: SELEÇÃO E UPLOAD', async () => {
        await adminPage.navegarParaAdmin();
        await adminPage.selecionarCollection(nomeCollection);
        await adminPage.limparDocumentosSeExistirem();

        const pastaFiles = path.join(process.cwd(), 'fixtures', 'files');
        const arquivoReal = fs.readdirSync(pastaFiles).find(f => f.includes('Electric'));
        await adminPage.uploadArquivos(path.join(pastaFiles, arquivoReal));
        
        await expect(page.getByText('Upload Complete')).toBeVisible({ timeout: 60000 });
        await page.waitForTimeout(90000); // Aguarda ingestão
    });

    await test.step('3. RETORNO PARA HOME', async () => {
        await advisorPage.clicarHome();
    });

    await test.step('4. ACESSO AO ADVISOR', async () => {
        await advisorPage.navegarParaAdvisor();  
    });

    await test.step('5. VALIDAÇÃO DE MODELO', async () => {
        await advisorPage.validarModeloUnicoClaude();
    });

    await test.step('6. SELEÇÃO DE COLEÇÃO', async () => {
        await advisorPage.selecionarColecaoNoAdvisor(nomeCollection);
    });

    await test.step('7. REALIZAR PERGUNTA AO LLM', async () => {
        const pergunta = 'Summarize the main points of the California Electric document uploaded.';
        await advisorPage.fazerPergunta(pergunta);
        await page.waitForTimeout(20000); // Espera inicial para o LLM começar a escrever
    });

    await test.step('8. VALIDAR RESPOSTA E FONTES (RAG)', async () => {
        // Correção do erro do print: Regex mais abrangente para evitar falha por quebra de linha ou espaços
        const termoChaveResposta = /California Electric.*Reliability.*2006-2015/i;
        const fonteEsperada = 'Review of California Electric Utility Reliability 2006-2015';
        
        await advisorPage.validarRespostaPresente(90000);
        await advisorPage.validarConteudoEReferencias(termoChaveResposta, fonteEsperada);
    });

    await test.step('9. VALIDAR HISTÓRICO DE CHAT', async () => {
        await advisorPage.validarHistorico('California Electric');    
    });
});
