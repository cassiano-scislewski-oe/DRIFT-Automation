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

        this.collectionOption = (name) => page.locator('mat-option').filter({ hasText: name });
        this.menuOptions = page.locator('.mat-mdc-menu-content button .mat-mdc-menu-item-text');
    }

    /**
     * Navegação: Retorna para a Home
     */
    async clickHome() {
        console.log('Returning to Home...');
        await this.homeButton.waitFor({ state: 'visible', timeout: 30000 });
        await this.homeButton.click();
        try {
            await this.page.waitForURL(/.*home/, { timeout: 30000 });
        } catch {
            console.log('First click did not redirect, trying again...');
            await this.homeButton.click();
            await this.page.waitForURL(/.*home/, { timeout: 30000 });
        }
    }

    /**
     * Navegação: Entra na tela Advisor
     */
    async navigateToAdvisor() {
        console.log('Navigating to Advisor...');
        await this.advisorCard.waitFor({ state: 'visible', timeout: 15000 });
        await this.advisorCard.click();
        await this.page.waitForURL(/.*advisor/);
    }

    // --- ADICIONE ESTES MÉTODOS ABAIXO ---

    async validateSingleClaudeModel() {
        console.log('Validating and selecting Claude 4.5 model...');
        await this.modelDropdown.waitFor({ state: 'visible' });
        await this.modelDropdown.click();
        await this.menuOptions.first().waitFor({ state: 'visible' });
        const models = await this.menuOptions.allInnerTexts();
        expect(models.length).toEqual(1);
        expect(models[0].trim()).toBe('Claude Sonnet 4.5');
        await this.menuOptions.first().click();
        await this.page.locator('.mat-mdc-menu-panel').waitFor({ state: 'hidden' });
        await expect(this.modelDropdown).toContainText('Claude Sonnet 4.5');
    }

    async selectCollectionInAdvisor(collectionName) {
        console.log(`Checking collection selection: ${collectionName}`);
        await this.collectionDropdown.waitFor({ state: 'visible' });
        const currentText = await this.collectionDropdown.innerText();
        if (currentText.includes(collectionName)) {
            console.log('Correct collection already selected.');
            return;
        }
        await this.collectionDropdown.click();
        const option = this.page.locator('mat-option, .mdc-list-item').filter({ hasText: collectionName }).first();
        await option.waitFor({ state: 'visible', timeout: 10000 });
        await option.click();
        await this.page.locator('.mat-mdc-autocomplete-panel, .mat-mdc-select-panel, .cdk-overlay-pane').last().waitFor({ state: 'hidden' });
        await expect(this.collectionDropdown).toContainText(collectionName);
    }

    async askQuestion(question) {
        console.log(`Sending question to Advisor: "${question}"`);
        await this.chatInput.waitFor({ state: 'visible' });
        await this.chatInput.fill(question);
        await this.sendButton.waitFor({ state: 'visible' });
        await this.sendButton.click();
    }

    async validateResponsePresent(customTimeout = 60000) {
        console.log('Waiting for Advisor response (LLM)...');
        await expect(this.responseArea.first()).toBeVisible({ timeout: customTimeout });
    }

    async validateContentAndReferences(expectedText, expectedSource) {
        console.log(`Validating content and sources...`);
        await expect(this.assistantResponse).toContainText(expectedText, { timeout: 30000 });
        await this.sourcePane.waitFor({ state: 'visible', timeout: 15000 });
        const sourceFound = this.sourcePane.locator('p', { hasText: expectedSource }).first();
        await expect(sourceFound).toBeVisible();
    }

    async validateHistory(expectedTerm) {
        console.log(`Opening history to validate: ${expectedTerm}`);
        await this.historyButton.click();
        await this.historyModal.waitFor({ state: 'visible' });
        const item = this.historyItems.filter({ hasText: expectedTerm }).first();
        await expect(item).toBeVisible({ timeout: 10000 });
        await this.page.keyboard.press('Escape');
    }
}

module.exports = { AdvisorPage };