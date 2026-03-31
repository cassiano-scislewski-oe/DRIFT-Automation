class Login {
    constructor(page) {
        this.page = page;
        this.usernameInput = page.getByPlaceholder('Enter your Email');
        this.passwordInput = page.getByPlaceholder('Enter your Password');
        this.loginButton = page.getByRole('button', { name: 'Sign in' });
        this.profileButton = page.locator('button.user-menu-trigger');
        this.profileMenu = page.locator('.mat-mdc-menu-panel, .mat-menu-panel');
        this.profileMenuOption = page.locator('button[routerlink="/profile"]');
    }

    async open() { 
        await this.page.goto('/'); 
    }

    async performLogin(user, pass) {
        await this.usernameInput.fill(user);
        await this.passwordInput.fill(pass);
        await this.loginButton.click();
    }
}

module.exports = { Login };
