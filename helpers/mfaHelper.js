const OTPAuth = require('otpauth');

function generateTOTP(secretKey) {
    if (!secretKey) return null;
    const cleanSecret = secretKey.replace(/\s+/g, '').toUpperCase(); 
    let totp = new OTPAuth.TOTP({
        issuer: 'Drift',
        label: 'DriftAuth',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: cleanSecret 
    });
    return totp.generate();
}

// helpers/mfaHelper.js
async function handleMFA(page, fixedSecret) {
    const otpInput = page.getByRole('spinbutton', { name: 'Code *' });
    const confirmButton = page.getByRole('button', { name: 'Confirm' });
    const errorAlert = page.getByText(/Your software token has already been used/i);

    // Espera o campo aparecer (até 15s)
    await otpInput.waitFor({ state: 'visible', timeout: 15000 });
    
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
        attempts++;
        
        // Gera o token de 6 dígitos
        const token = generateTOTP(fixedSecret);
        console.log(`MFA attempt ${attempts}: Generated token: ${token}`);
        
        // Preenche e confirma
        await otpInput.fill('');
        await otpInput.fill(token);
        await confirmButton.click();
        
        // Aguarda até 10s para ver se o modal fecha (sucesso) ou se aparece erro
        try {
            await Promise.race([
                // Sucesso: o input desaparece quando MFA é aceito
                otpInput.waitFor({ state: 'hidden', timeout: 10000 }),
                // Ou o grupo do MFA desaparece
                page.locator('group').filter({ hasText: 'Confirm TOTP Code' }).waitFor({ state: 'hidden', timeout: 10000 })
            ]);
            console.log('MFA confirmado com sucesso!');
            return; // Sucesso!
        } catch (e) {
            // Verifica se é o erro de "token já usado"
            const alertCount = await errorAlert.count();
            if (alertCount > 0) {
                console.warn(`Attempt ${attempts}: Token already used. Waiting 5s and retrying...`);
                await page.waitForTimeout(5000);
                
                // Dismiss do alert se souber o seletor
                const dismissBtn = page.locator('button').filter({ has: page.locator('img[alt=""]') }).last();
                if (await dismissBtn.count() > 0) {
                    try {
                        await dismissBtn.click();
                    } catch (e2) {
                        console.warn('Could not dismiss the alert');
                    }
                }
                continue; // Próxima tentativa
            } else if (tentativas < maxTentativas) {
                console.warn(`Attempt ${attempts} failed. Waiting 3s...`);
                await page.waitForTimeout(3000);
                continue;
            } else {
                throw new Error(`MFA failed after ${maxAttempts} attempts. Check the secret or server time.`);
            }
        }
    }
    
    throw new Error('MFA not completed after all attempts');
}

module.exports = { handleMFA };
