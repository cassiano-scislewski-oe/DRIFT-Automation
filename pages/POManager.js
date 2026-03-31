const { Login } = require('./Login-page/login.page.js');
const { AdminPage } = require('./Admin-page/admin.page.js'); 
const { AdvisorPage } = require('./Advisor-page/advisor.page.js'); 

class POManager {
    constructor(page) {
        this.page = page;
        this.loginPage = new Login(this.page);
        this.adminPage = new AdminPage(this.page); 
        this.advisorPage = new AdvisorPage(this.page);
    }

    getLogin() {
        return this.loginPage;
    }

    getAdminPage() {
        return this.adminPage;
    }

     getAdvisorPage() {
        return this.advisorPage;
    }
}

module.exports = { POManager };