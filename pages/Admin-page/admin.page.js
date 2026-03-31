const { expect } = require('@playwright/test');

class AdminPage {
    constructor(page) {
        this.page = page;
        this.adminCard = page.locator('div.card-grid__item[ng-reflect-router-link="/admin"]');
        this.pageTitle = page.getByRole('heading', { name: 'Collections Management', level: 1 });
        this.collectionInput = page.getByPlaceholder('Select collection');
        this.collectionOption = (name) => page.getByText(name, { exact: true });
        
        // Upload e Ingestão
        this.fileInput = page.locator('input[type="file"]');
        this.doneButton = page.getByRole('button', { name: 'Done' });

        // --- 1º LÁPIS: Renomear Collection (Topo da página) ---
        // Alterado para .first() para garantir resiliência se houver outros botões de edit
        this.editCollectionNameButton = page.getByRole('button', { name: /edit/i }).first();
        this.nameInput = page.getByPlaceholder('Enter new name');
        this.saveChangesButton = page.getByRole('button', { name: 'Save Changes' });

        // --- 2º LÁPIS: Edição de Documento na Tabela (Ao lado do ano "2006...") ---
        // Seletor específico para a linha da tabela (app-row-details)
        this.editRowButton = page.locator('app-row-details button').filter({ has: page.locator('mat-icon:text("edit")') }).first();        
        
        // --- CAMPOS DENTRO DO MODAL DE DOCUMENTO ---
        this.processingStageInput = page.locator('mat-form-field').filter({ hasText: 'Processing_stage' }).locator('input');
        this.yearInput = page.locator('mat-form-field').filter({ hasText: 'Year' }).locator('input');
        this.saveDocumentButton = page.locator('mat-dialog-container button:has-text("Save")').first();

        // --- FILTERS ---        
        this.filterButton = page.locator('button[mattooltip="Open filter selection"]');
        this.yearFilterDropdown = page.locator('mat-select').filter({ hasText: 'Select year' });
        // Seletor dinâmico para a opção do ano dentro do dropdown aberto
        this.yearOption = (year) => page.locator('mat-option').filter({ hasText: year.toString() });
        this.applyFiltersButton = page.getByRole('button', { name: 'Apply Filters' });

        //Remover arquivo
        this.firstRowCheckbox = page.locator('.ag-row-first .ag-selection-checkbox input').first();
        this.removeFloatingButton = page.locator('app-selected-documents-menu button').filter({ hasText: 'Remove' });
        this.confirmDeleteButton = page.locator('app-confirmation-modal button').filter({ hasText: 'Confirm' });

    }

    async navigateToAdmin() {
        await this.adminCard.click();
    }

    getPageTitleSelector() {
        return this.pageTitle;
    }

    async selectCollection(name) {
        await this.collectionInput.click();
        await this.collectionOption(name).waitFor({ state: 'visible' });
        await this.collectionOption(name).click();
    }

    async uploadFiles(paths) {
        await this.fileInput.setInputFiles(paths);
    }

    /**
     * Ação do 2º Lápis: Abre o modal do documento na tabela
     */
    async openDocumentEdit() {
        console.log('Clicando no lápis da linha da tabela (ao lado do ano)...');
        await this.editRowButton.waitFor({ state: 'visible', timeout: 20000 });
        await this.editRowButton.click();
    }

    /**
     * Validação interna do modal aberto pelo 2º lápis
     */
    async validateProcessingStage(expectedValue) {
        console.log(`Validating if Processing Stage field contains: ${expectedValue}`);
        await this.processingStageInput.waitFor({ state: 'visible', timeout: 15000 });
        
        const value = await this.processingStageInput.inputValue();
        console.log(`Valor real capturado: "${value}"`);
        
        if (value.toLowerCase().trim() !== expectedValue.toLowerCase().trim()) {
            throw new Error(`Validation failed! Expected: "${expectedValue}", Found: "${value}"`);
        }
    }

    /**
     * Edição do ano (deve ser chamado com o modal do documento aberto)
     */
    async changeDocumentYear(newYear) {
        console.log(`Changing the Year field to: ${newYear}`);
        await this.yearInput.waitFor({ state: 'visible' });
        
        // Limpa o valor antigo e preenche com o novo
        await this.yearInput.fill(''); 
        await this.yearInput.fill(newYear.toString());
        
        // Confirmação interna do preenchimento
        await expect(this.yearInput).toHaveValue(newYear.toString());
    }

    /**
     * Ação do 1º Lápis: Altera o nome da Collection inteira
     */
    async renameCollection(newName) {
        console.log(`Renaming collection to: ${newName}`);
        await this.editCollectionNameButton.waitFor({ state: 'visible' });
        await this.editCollectionNameButton.click();
        await this.nameInput.waitFor({ state: 'visible' });
        await this.nameInput.fill(newName);
        await this.saveChangesButton.click();
        await this.page.waitForTimeout(3000);
    }

    /**
     * Valida o ano diretamente na célula da tabela AG-Grid
     */
    async validateYearInTable(expectedYear) {
        console.log(`Validating if year ${expectedYear} appears in the table...`);
        // Localiza a célula da coluna 'year'
        const celulaAno = this.page.locator('.ag-cell[col-id="year"]').first();
        await expect(celulaAno).toHaveText(expectedYear.toString(), { timeout: 10000 });
        console.log('Sucesso: Ano validado na tabela.');
    }

    /**
     * Fluxo independente de filtros
     */
    async filterByYear(year) {
        console.log(`Opening filters to select year: ${year}`);
        await this.filterButton.click();
        
        // 1. Localiza o corpo do modal que contém o scroll
        const modalContent = this.page.locator('.mat-mdc-dialog-content, .mat-dialog-content');
        await modalContent.waitFor({ state: 'visible' });

        // 2. Localiza o dropdown usando o label "Select year"
        // No Angular Material, o mat-select costuma estar associado a um mat-label ou ter o texto interno
        const dropdown = this.page.locator('mat-form-field').filter({ hasText: 'Select year' }).locator('mat-select');

        // 3. FORÇA O SCROLL: Rola o container do modal até o dropdown aparecer
        console.log('Descendo o scroll do modal até o campo Year...');
        await dropdown.evaluate(el => el.scrollIntoView({ behavior: 'auto', block: 'center' }));
        
        // 4. Clica no dropdown
        await dropdown.waitFor({ state: 'visible', timeout: 10000 });
        await dropdown.click();
        
        // 5. Seleciona a opção no overlay que abriu
        console.log(`Searching for option ${year} in the menu...`);
        const option = this.page.locator('mat-option').filter({ hasText: new RegExp(`^\\s*${year}\\s*$`) });
        await option.waitFor({ state: 'visible' });
        await option.click();
        
        // 6. Fecha o menu de opções e aplica
        await this.page.keyboard.press('Escape'); 
        await this.applyFiltersButton.click();
        
        // Espera o modal fechar
        await expect(this.page.locator('app-filter-modal')).toHaveCount(0);
        console.log('Filtro aplicado com sucesso.');
    }

        async removeFirstDocument() {
            const selectAllCheckbox = this.page.locator('.ag-header-cell[col-id="ag-Grid-SelectionColumn"] input').first();
            await selectAllCheckbox.click();

            console.log('Clicando no botão Remove do menu flutuante...');
            await this.removeFloatingButton.waitFor({ state: 'visible' });
            await this.page.waitForTimeout(4000);
            await this.removeFloatingButton.dispatchEvent('click');

            console.log('Confirmando a exclusão de todos os documentos...');
            await this.confirmDeleteButton.waitFor({ state: 'visible' });
            await this.confirmDeleteButton.click();

            await expect(this.page.locator('app-confirmation-modal')).toHaveCount(0);
            console.log('Documento removido com sucesso.');
        }

        /**
     * Verifica se existem documentos na lista e os remove antes de iniciar o teste
     */
    async clearDocumentsIfExist() {
        console.log('Verificando se existem documentos antigos para limpar...');
        
        // Localizador para as linhas da tabela (ajustado para AG-Grid)
        const linhas = this.page.locator('.ag-center-cols-container .ag-row');
        
        // Espera um pouco para garantir que a tabela carregou (ou não)
        await this.page.waitForTimeout(2000); 
        
        const quantidade = await linhas.count();
        
        if (quantidade > 0) {
            console.log(`Encontrados ${quantidade} documento(s). Iniciando limpeza...`);
            
            // Seleciona o checkbox "Select All" no cabeçalho para apagar tudo de uma vez
            const selectAllCheckbox = this.page.locator('.ag-header-cell[col-id="ag-Grid-SelectionColumn"] input').first();
            await selectAllCheckbox.click();

            console.log('Clicando no botão Remove do menu flutuante...');
            await this.removeFloatingButton.waitFor({ state: 'visible' });
            await this.removeFloatingButton.click();

            console.log('Confirmando a exclusão de todos os documentos...');
            await this.confirmDeleteButton.waitFor({ state: 'visible' });
            await this.confirmDeleteButton.click();

            // Espera o modal sumir e a tabela ficar vazia
            await expect(this.page.locator('app-confirmation-modal')).toHaveCount(0);
            await expect(linhas).toHaveCount(0, { timeout: 15000 });
            console.log('Limpeza concluída com sucesso.');
        } else {
            console.log('Nenhum documento encontrado. Prosseguindo...');
        }
    }

}

module.exports = { AdminPage };