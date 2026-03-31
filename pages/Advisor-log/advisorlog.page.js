const { expect } = require('@playwright/test');

class advisorlog {
    constructor(page) {
        this.page = page;

        // --- Seletores de Navegação (Sidebar) ---
        this.advisorLogMenuItem = page.locator('a[href="/prompt-log"]');

        // --- Seletores Internos (Tela Advisor Log) ---
        this.pageTitle = page.locator('text=Advisor Log').first();
        this.collectionDropdown = page.locator('mat-select').first();
        this.firstLogEntry = page.locator('mat-expansion-panel-header').first().locator('span.title-text');
        this.firstLogEntryHeader = page.locator('mat-expansion-panel-header').first();

        // --- Seletores do Painel Expandido ---
        this.expandedPanel = page.locator('mat-expansion-panel.mat-expanded .mat-expansion-panel-body').first();
        this.promptLogTitle = page.locator('mat-expansion-panel.mat-expanded h2').first();
        this.promptLogInfoCard = page.locator('mat-expansion-panel.mat-expanded mat-card').first();
        this.promptSection = page.locator('mat-expansion-panel.mat-expanded mat-card', { hasText: 'Prompt' }).first();
    }

    /**
     * Navegação: Entra na tela Advisor Log
     */
    async navigateToAdvisorLog() {
        console.log('Navigating to Advisor Log...');
        await this.advisorLogMenuItem.waitFor({ state: 'visible', timeout: 15000 });
        await this.advisorLogMenuItem.click();
        await this.page.waitForURL(/.*prompt-log/);
        await this.page.waitForTimeout(10000);
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
        await this.page.getByRole('option', { name: collectionName }).click({ timeout: 15000 });
        await expect(this.collectionDropdown).toContainText(collectionName);
    }

    async validateFirstLogEntry(expectedText) {
        console.log(`Validating first log entry contains: "${expectedText}"`);
        await this.firstLogEntry.waitFor({ state: 'visible', timeout: 15000 });
        await expect(this.firstLogEntry).toContainText(expectedText);
    }

    async clickFirstLogEntry() {
        console.log('Clicking first log entry...');
        await this.firstLogEntryHeader.waitFor({ state: 'visible', timeout: 15000 });
        await this.firstLogEntryHeader.click();
    }

    async validateLogEntryDetails({ user, title, promptText }) {
        console.log('Validating expanded log entry details...');
        await this.expandedPanel.waitFor({ state: 'visible', timeout: 15000 });
        await expect(this.promptLogTitle).toContainText('Prompt Log');
        await expect(this.promptLogInfoCard).toContainText(user);
        await expect(this.promptLogInfoCard).toContainText(title);
        await expect(this.promptSection).toContainText(promptText);
    }
}

module.exports = { advisorlog };
