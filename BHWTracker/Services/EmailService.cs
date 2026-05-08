using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace BHWTracker.Services
{
    public interface IEmailService
    {
        Task<bool> SendLoginVerificationCodeAsync(string email, string code, string firstname);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<bool> SendLoginVerificationCodeAsync(string email, string code, string firstname)
        {
            try
            {
                var smtpHost = _configuration["Email:SmtpHost"];
                var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
                var smtpUsername = _configuration["Email:SmtpUsername"];
                var smtpPassword = _configuration["Email:SmtpPassword"];
                var fromEmail = _configuration["Email:FromEmail"];
                var fromName = _configuration["Email:FromName"] ?? "BHW Tracker";

                // If credentials are not configured, log to console instead
                if (string.IsNullOrEmpty(smtpUsername) || string.IsNullOrEmpty(smtpPassword))
                {
                    Console.WriteLine($"⚠️  Email not configured. Code for {email}: {code}");
                    return true;
                }

                using (var client = new SmtpClient(smtpHost, smtpPort))
                {
                    client.EnableSsl = true;
                    client.UseDefaultCredentials = false;
                    client.Credentials = new NetworkCredential(smtpUsername, smtpPassword);
                    client.Timeout = 10000; // 10 second timeout

                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress(fromEmail ?? smtpUsername, fromName),
                        Subject = "BHW Tracker - Login Verification Code",
                        Body = $@"
Hello {firstname},

Your login verification code is:

{code}

This code will expire in 5 minutes. Do not share this code with anyone.

If you did not request this code, please ignore this email.

Best regards,
BHW Tracker Team
",
                        IsBodyHtml = false
                    };

                    mailMessage.To.Add(email);

                    await client.SendMailAsync(mailMessage);
                    Console.WriteLine($"✅ Verification code email sent to: {email}");
                    return true;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error sending email: {ex.Message}");
                Console.WriteLine($"❌ Inner Exception: {ex.InnerException?.Message}");
                // Return true anyway to allow login flow to continue (fallback to console code)
                return true;
            }
        }
    }
}
