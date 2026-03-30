class Login {
    constructor(page) {
        this.page = page;
        this.usernameInput = page.getByPlaceholder('Enter your Email');
        this.passwordInput = page.getByPlaceholder('Enter your Password');
        this.loginButton = page.getByRole('button', { name: 'Sign in' });
    }

    async abrir() { 
        await this.page.goto('/'); 
    }

    async realizarLogin(user, pass) {
        await this.usernameInput.fill(user);
        await this.passwordInput.fill(pass);
        await this.loginButton.click();
    }
}

module.exports = { Login };
