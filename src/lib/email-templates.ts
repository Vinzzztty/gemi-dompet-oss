export function getPasswordResetEmailTemplate(resetLink: string, userName: string): string {
    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - Gemi Dompet</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #4176ED 0%, #3160D8 100%); border-radius: 16px 16px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                🔐 Reset Password
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 16px; color: #1A1A2E; font-size: 16px; line-height: 1.6;">
                                Halo <strong>${userName}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 24px; color: #4A5568; font-size: 15px; line-height: 1.6;">
                                Kami menerima permintaan untuk mereset password akun Gemi Dompet Anda. Klik tombol di bawah ini untuk membuat password baru:
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${resetLink}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #4176ED 0%, #3160D8 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(65, 118, 237, 0.4);">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 24px 0 16px; color: #4A5568; font-size: 14px; line-height: 1.6;">
                                Atau copy dan paste link berikut ke browser Anda:
                            </p>
                            
                            <div style="padding: 16px; background-color: #F7FAFC; border-radius: 8px; border-left: 4px solid #4176ED; margin-bottom: 24px;">
                                <a href="${resetLink}" style="color: #4176ED; text-decoration: none; word-break: break-all; font-size: 13px;">
                                    ${resetLink}
                                </a>
                            </div>
                            
                            <!-- Warning Box -->
                            <div style="padding: 16px; background-color: #FFF5F5; border-radius: 8px; border-left: 4px solid #FC8181; margin-bottom: 24px;">
                                <p style="margin: 0; color: #C53030; font-size: 14px; line-height: 1.5;">
                                    ⚠️ <strong>Penting:</strong> Link ini hanya berlaku selama <strong>1 jam</strong> dan hanya bisa digunakan sekali.
                                </p>
                            </div>
                            
                            <p style="margin: 0 0 8px; color: #4A5568; font-size: 14px; line-height: 1.6;">
                                Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 40px; background-color: #F7FAFC; border-radius: 0 0 16px 16px; border-top: 1px solid #E2E8F0;">
                            <p style="margin: 0 0 8px; color: #718096; font-size: 13px; text-align: center; line-height: 1.5;">
                                Email ini dikirim oleh <strong style="color: #4176ED;">Gemi Dompet</strong>
                            </p>
                            <p style="margin: 0; color: #A0AEC0; font-size: 12px; text-align: center; line-height: 1.5;">
                                © ${new Date().getFullYear()} Gemi Dompet. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `.trim();
}
