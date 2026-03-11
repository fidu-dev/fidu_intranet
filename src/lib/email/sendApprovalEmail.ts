import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendApprovalEmails(agencyName: string, emails: string[]) {
    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #3b5998; padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Fidu Viagens</h1>
        </div>
        <div style="padding: 32px 24px;">
            <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Parabéns! Sua agência foi aprovada 🎉</h2>
            <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
                A agência <strong>${agencyName}</strong> foi aprovada como parceira Fidu Viagens.
            </p>
            <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                Agora você já pode acessar nossa intranet e começar a consultar o tarifário, simular orçamentos e realizar reservas.
            </p>

            <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: #1a1a1a; font-size: 16px; margin: 0 0 16px;">Como acessar:</h3>
                <ol style="color: #4a4a4a; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Acesse <a href="https://intranet.fiduviagens.com" style="color: #3b5998; font-weight: 600;">intranet.fiduviagens.com</a></li>
                    <li>Clique em <strong>Entrar</strong></li>
                    <li>Utilize o e-mail cadastrado para criar sua senha e fazer login</li>
                </ol>
            </div>

            <div style="text-align: center; margin: 32px 0;">
                <a href="https://intranet.fiduviagens.com" style="display: inline-block; background: #3b5998; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
                    Acessar a Intranet
                </a>
            </div>

            <p style="color: #999999; font-size: 13px; line-height: 1.5; margin: 24px 0 0; text-align: center;">
                Em caso de dúvidas, entre em contato com nossa equipe.
            </p>
        </div>
        <div style="background: #f8f9fa; padding: 16px 24px; text-align: center; border-top: 1px solid #eee;">
            <p style="color: #999999; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Fidu Viagens. Todos os direitos reservados.</p>
        </div>
    </div>`;

    const results = [];
    for (const email of emails) {
        try {
            const { data, error } = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'Fidu Viagens <onboarding@resend.dev>',
                to: email,
                subject: `Agência ${agencyName} aprovada — Acesse a Intranet Fidu`,
                html,
            });
            if (error) {
                console.error(`Erro ao enviar e-mail para ${email}:`, error);
            }
            results.push({ email, success: !error, data, error });
        } catch (err) {
            console.error(`Erro ao enviar e-mail para ${email}:`, err);
            results.push({ email, success: false, error: err });
        }
    }
    return results;
}
