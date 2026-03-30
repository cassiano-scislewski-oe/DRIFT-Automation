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
        this.yearOption = (ano) => page.locator('mat-option').filter({ hasText: ano.toString() });
        this.applyFiltersButton = page.getByRole('button', { name: 'Apply Filters' });

        //Remover arquivo
        this.firstRowCheckbox = page.locator('.ag-row-first .ag-selection-checkbox input').first();
        this.removeFloatingButton = page.locator('app-selected-documents-menu button').filter({ hasText: 'Remove' });
        this.confirmDeleteButton = page.locator('app-confirmation-modal button').filter({ hasText: 'Confirm' });

    }

    async navegarParaAdmin() {
        await this.adminCard.click();
    }

    getPageTitleSeletor() {
        return this.pageTitle;
    }

    async selecionarCollection(nome) {
        await this.collectionInput.click();
        await this.collectionOption(nome).waitFor({ state: 'visible' });
        await this.collectionOption(nome).click();
    }

    async uploadArquivos(caminhos) {
        await this.fileInput.setInputFiles(caminhos);
    }

    /**
     * Ação do 2º Lápis: Abre o modal do documento na tabela
     */
    async abrirEdicaoDocumento() {
        console.log('Clicando no lápis da linha da tabela (ao lado do ano)...');
        await this.editRowButton.waitFor({ state: 'visible', timeout: 20000 });
        await this.editRowButton.click();
    }

    /**
     * Validação interna do modal aberto pelo 2º lápis
     */
    async validarProcessingStage(valorEsperado) {
        console.log(`Validando se o campo Processing Stage contém: ${valorEsperado}`);
        await this.processingStageInput.waitFor({ state: 'visible', timeout: 15000 });
        
        const value = await this.processingStageInput.inputValue();
        console.log(`Valor real capturado: "${value}"`);
        
        if (value.toLowerCase().trim() !== valorEsperado.toLowerCase().trim()) {
            throw new Error(`Validação falhou! Esperado: "${valorEsperado}", Encontrado: "${value}"`);
        }
    }

    /**
     * Edição do ano (deve ser chamado com o modal do documento aberto)
     */
    async alterarAnoDocumento(novoAno) {
        console.log(`Alterando o campo Year para: ${novoAno}`);
        await this.yearInput.waitFor({ state: 'visible' });
        
        // Limpa o valor antigo e preenche com o novo
        await this.yearInput.fill(''); 
        await this.yearInput.fill(novoAno.toString());
        
        // Confirmação interna do preenchimento
        await expect(this.yearInput).toHaveValue(novoAno.toString());
    }

    /**
     * Ação do 1º Lápis: Altera o nome da Collection inteira
     */
    async renomearCollection(novoNome) {
        console.log(`Renomeando collection para: ${novoNome}`);
        await this.editCollectionNameButton.waitFor({ state: 'visible' });
        await this.editCollectionNameButton.click();
        await this.nameInput.waitFor({ state: 'visible' });
        await this.nameInput.fill(novoNome);
        await this.saveChangesButton.click();
        await this.page.waitForTimeout(3000);
    }

    /**
     * Valida o ano diretamente na célula da tabela AG-Grid
     */
    async validarAnoNaTabela(anoEsperado) {
        console.log(`Validando se o ano ${anoEsperado} aparece na tabela...`);
        // Localiza a célula da coluna 'year'
        const celulaAno = this.page.locator('.ag-cell[col-id="year"]').first();
        await expect(celulaAno).toHaveText(anoEsperado.toString(), { timeout: 10000 });
        console.log('Sucesso: Ano validado na tabela.');
    }

    /**
     * Fluxo independente de filtros
     */
    async filtrarPorAno(ano) {
        console.log(`Abrindo filtros para selecionar o ano: ${ano}`);
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
        console.log(`Buscando a opção ${ano} no menu...`);
        const opcao = this.page.locator('mat-option').filter({ hasText: new RegExp(`^\\s*${ano}\\s*$`) });
        await opcao.waitFor({ state: 'visible' });
        await opcao.click();
        
        // 6. Fecha o menu de opções e aplica
        await this.page.keyboard.press('Escape'); 
        await this.applyFiltersButton.click();
        
        // Espera o modal fechar
        await expect(this.page.locator('app-filter-modal')).toHaveCount(0);
        console.log('Filtro aplicado com sucesso.');
    }

        async removerPrimeiroDocumento() {
            console.log('Selecionando o primeiro documento da lista...');
            await this.firstRowCheckbox.waitFor({ state: 'visible' });
            await this.firstRowCheckbox.check();
            await this.page.waitForTimeout(1000);

            console.log('Clicando no botão Remove do menu flutuante...');
            await this.removeFloatingButton.waitFor({ state: 'visible', timeout: 15000 });
            
            // Retry com up to 3 tentativas para click
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    await this.page.waitForTimeout(1500);
                    await this.removeFloatingButton.click();
                    break;
                } catch (e) {
                    if (attempt < 3) {
                        console.warn(`Tentativa ${attempt} de clique no Remove falhou, aguardando...`);
                        await this.page.waitForTimeout(3000);
                    } else {
                        throw e;
                    }
                }
            }

            console.log('Confirmando a exclusão permanente...');
            await this.confirmDeleteButton.waitFor({ state: 'visible', timeout: 15000 });
            await this.confirmDeleteButton.click();

            // Espera o modal de confirmação sumir
            await expect(this.page.locator('app-confirmation-modal')).toHaveCount(0, { timeout: 15000 });
            console.log('Documento removido com sucesso.');
        }

        /**
     * Verifica se existem documentos na lista e os remove antes de iniciar o teste
     */
    async limparDocumentosSeExistirem() {
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