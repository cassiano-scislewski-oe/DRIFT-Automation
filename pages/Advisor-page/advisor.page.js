const { expect } = require('@playwright/test');

class AdvisorPage {
    constructor(page) {
        this.page = page;

        // --- Seletores de Navegação (Sidebar e Home) ---
        this.homeButton = page.locator('mat-sidenav a[href="/home"], mat-icon:text("home")').first();
        this.advisorCard = page.locator('div[ng-reflect-router-link="/advisor"]');

        // --- Seletores Internos (Tela Advisor) ---
        this.chatInput = page.locator('textarea[data-test-id="advisor-textarea"]'); 
        this.sendButton = page.locator('button').filter({ has: page.locator('mat-icon') }).last();
        this.responseArea = page.locator('.markdown-container, app-chat-message, .chat-message-content, mat-card-content');
        this.assistantResponse = page.locator('[data-test-id="response-message"]').last();

        // --- Seletores com Data-Test-ID (Os mais estáveis) ---
        this.modelDropdown = page.locator('[data-test-id="llm-model-dropdown"]');
        this.collectionDropdown = page.locator('[data-test-id="collections-dropdown"]');
        this.sourcePane = page.locator('[data-test-id="source-documents-pane"]');

        // --- SELETORES DE HISTÓRICO ---
        this.historyButton = page.locator('[data-test-id="history-button"]');
        this.historyModal = page.locator('[data-test-id="history-modal"]');
        this.historyItems = this.historyModal.locator('.discussion-card .summary p');

        this.collectionOption = (nome) => page.locator('mat-option').filter({ hasText: nome });
        this.menuOptions = page.locator('.mat-mdc-menu-content button .mat-mdc-menu-item-text');
    }

    /**
     * Navegação: Retorna para a Home
     */
    async clicarHome() {
        console.log('Retornando para a Home...');
        await this.homeButton.waitFor({ state: 'visible', timeout: 30000 });
        await this.homeButton.click();
        await this.page.waitForURL(/.*home/, { timeout: 30000 });
    }

    /**
     * Navegação: Entra na tela Advisor
     */
    async navegarParaAdvisor() {
        console.log('Navegando para o Advisor...');
        await this.advisorCard.waitFor({ state: 'visible', timeout: 15000 });
        await this.advisorCard.click();
        await this.page.waitForURL(/.*advisor/);
    }

    // --- ADICIONE ESTES MÉTODOS ABAIXO ---

    async validarModeloUnicoClaude() {
        console.log('Validando e selecionando o modelo Claude 4.5...');
        await this.modelDropdown.waitFor({ state: 'visible' });
        await this.modelDropdown.click();
        await this.menuOptions.first().waitFor({ state: 'visible' });
        const modelos = await this.menuOptions.allInnerTexts();
        expect(modelos.length).toEqual(1);
        expect(modelos[0].trim()).toBe('Claude Sonnet 4.5');
        await this.menuOptions.first().click();
        await this.page.locator('.mat-mdc-menu-panel').waitFor({ state: 'hidden' });
        await expect(this.modelDropdown).toContainText('Claude Sonnet 4.5');
    }

    async selecionarColecaoNoAdvisor(nomeCollection) {
        console.log(`Verificando seleção da coleção: ${nomeCollection}`);
        await this.collectionDropdown.waitFor({ state: 'visible' });
        const textoAtual = await this.collectionDropdown.innerText();
        if (textoAtual.includes(nomeCollection)) {
            console.log('Coleção correta já está selecionada.');
            return;
        }
        await this.collectionDropdown.click();
        const opcao = this.page.locator('mat-option, .mdc-list-item').filter({ hasText: nomeCollection }).first();
        await opcao.waitFor({ state: 'visible', timeout: 10000 });
        await opcao.click();
        await this.page.locator('.mat-mdc-autocomplete-panel, .mat-mdc-select-panel, .cdk-overlay-pane').last().waitFor({ state: 'hidden' });
        await expect(this.collectionDropdown).toContainText(nomeCollection);
    }

    async fazerPergunta(pergunta) {
        console.log(`Enviando pergunta ao Advisor: "${pergunta}"`);
        await this.chatInput.waitFor({ state: 'visible' });
        await this.chatInput.fill(pergunta);
        await this.sendButton.waitFor({ state: 'visible' });
        await this.sendButton.click();
    }

    async validarRespostaPresente(timeoutPersonalizado = 60000) {
        console.log('Aguardando resposta do Advisor (LLM)...');
        await expect(this.responseArea.first()).toBeVisible({ timeout: timeoutPersonalizado });
    }

    async validarConteudoEReferencias(textoEsperado, fonteEsperada) {
        console.log(`Validando conteúdo e fontes...`);
        await expect(this.assistantResponse).toContainText(textoEsperado, { timeout: 30000 });
        await this.sourcePane.waitFor({ state: 'visible', timeout: 15000 });
        const fonteEncontrada = this.sourcePane.locator('p', { hasText: fonteEsperada }).first();
        await expect(fonteEncontrada).toBeVisible();
    }

    async validarHistorico(termoEsperado) {
        console.log(`Abrindo histórico para validar: ${termoEsperado}`);
        await this.historyButton.click();
        await this.historyModal.waitFor({ state: 'visible' });
        const item = this.historyItems.filter({ hasText: termoEsperado }).first();
        await expect(item).toBeVisible({ timeout: 10000 });
        await this.page.keyboard.press('Escape');
    }
}

module.exports = { AdvisorPage };