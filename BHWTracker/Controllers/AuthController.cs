using Microsoft.AspNetCore.Mvc;
using BHWTracker.Data;
using BHWTracker.Models;
using BHWTracker.Services;
using System.Linq;

namespace BHWTracker.Controllers
{
    // DTO for login requests
    public class LoginDto
    {
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
    }

    // DTO for forgot password
    public class ForgotPasswordDto
    {
        public string Email { get; set; } = "";
    }

    public class ResetPasswordDto
    {
        public string Email { get; set; } = "";
        public string NewPassword { get; set; } = "";
    }

    public class VerificationCodeDto
    {
        public string Email { get; set; } = "";
        public string Code { get; set; } = "";
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;

        public AuthController(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // ======================
        // 🧩 BHW Register (self-register -> Pending)
        // ======================
        [HttpPost("bhw-register")]
        public IActionResult BhwRegister([FromBody] Bhw bhw)
        {
            if (bhw == null || string.IsNullOrEmpty(bhw.Email) || string.IsNullOrEmpty(bhw.Password))
                return BadRequest(new { message = "Email and password are required" });

            // ✅ BHW self-registration = Pending by default
            bhw.Status = "Pending";
            bhw.AddedByAdminId = null;

            _context.Bhws.Add(bhw);
            _context.SaveChanges();

            return Ok(new
            {
                message = "Registration successful! Your account is pending admin approval.",
                status = bhw.Status
            });
        }

        /*
        */
        // ======================
        // 🧩 Get Pending BHWs
        // ======================
        [HttpGet("pending")]
        public IActionResult GetPendingBHWs()
        {
            var pending = _context.Bhws
                .Where(b => b.Status == "Pending")
                .ToList();

            return Ok(pending);
        }

        // ======================
        // 🧩 Get Approved BHWs
        // ======================
        [HttpGet("approved")]
        public IActionResult GetApprovedBHWs()
        {
            var approved = _context.Bhws
                .Where(b => b.Status == "Approved")
                .ToList();

            return Ok(approved);
        }

        // ======================
        // 🧩 DEBUG: Check BHW Status by Email
        // ======================
        [HttpGet("debug-status/{email}")]
        public IActionResult DebugBhwStatus(string email)
        {
            var bhw = _context.Bhws.FirstOrDefault(b => b.Email == email);
            if (bhw == null)
                return NotFound(new { message = "BHW not found" });

            return Ok(new
            {
                bhwId = bhw.BhwId,
                firstname = bhw.Firstname,
                email = bhw.Email,
                status = bhw.Status ?? "NULL",
                statusIsNull = bhw.Status == null,
                statusLength = bhw.Status?.Length ?? 0
            });
        }

        // ======================
        // 🧩 Verify Email is Legitimate (Valid Email Format)
        // ======================
        [HttpPost("verify-email")]
        public IActionResult VerifyEmail([FromBody] ForgotPasswordDto request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Email))
                    return BadRequest(new { message = "Email is required", isValid = false });

                string email = request.Email.Trim().ToLower();

                // ✅ Check if email format is valid
                bool isValidFormat = IsValidEmailFormat(email);

                if (!isValidFormat)
                {
                    return Ok(new
                    {
                        isValid = false,
                        message = "❌ Email format is not valid. Please enter a legitimate email address.",
                        reason = "Invalid Format"
                    });
                }

                // ✅ Check if email is from known spam/disposable domains
                bool isLegitimateEmail = !IsDisposableEmail(email);

                if (!isLegitimateEmail)
                {
                    return Ok(new
                    {
                        isValid = false,
                        message = "❌ This email appears to be a temporary/disposable email. Please use a real email address.",
                        reason = "Disposable Email"
                    });
                }

                // ✅ All checks passed
                return Ok(new
                {
                    isValid = true,
                    message = "✅ Email is valid and legitimate",
                    reason = "Valid"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Server Error: " + ex.Message, isValid = false });
            }
        }

        // ======================
        // 🧩 Send Login Verification Code (First step of login)
        // ======================
        [HttpPost("send-login-code")]
        public async Task<IActionResult> SendLoginCode([FromBody] LoginDto login)
        {
            try
            {
                if (string.IsNullOrEmpty(login.Email) || string.IsNullOrEmpty(login.Password))
                    return BadRequest(new { message = "Email and password are required" });

                string email = login.Email.Trim().ToLower();

                // Check if it's a BHW
                var bhw = _context.Bhws.FirstOrDefault(b => !string.IsNullOrEmpty(b.Email) && b.Email.ToLower() == email && b.Password == login.Password);
                if (bhw != null)
                {
                    if (bhw.Status != "Approved")
                        return Unauthorized(new { message = "Your account is pending approval by the Admin" });

                    // Generate verification code
                    var code = GenerateVerificationCode();
                    bhw.LoginVerificationCode = code;
                    bhw.LoginVerificationCodeExpiry = DateTime.UtcNow.AddMinutes(5);
                    _context.SaveChanges();

                    // Send code via email
                    await _emailService.SendLoginVerificationCodeAsync(bhw.Email, code, bhw.Firstname);

                    return Ok(new
                    {
                        message = "Verification code sent to your email. Please enter it to complete login.",
                        requiresCode = true,
                        email = bhw.Email,
                        role = "BHW"
                    });
                }

                // Check if it's an Admin
                var admin = _context.admins.FirstOrDefault(a => !string.IsNullOrEmpty(a.Email) && a.Email.ToLower() == email && a.Password == login.Password);
                if (admin != null)
                {
                    // Generate verification code
                    var code = GenerateVerificationCode();
                    admin.LoginVerificationCode = code;
                    admin.LoginVerificationCodeExpiry = DateTime.UtcNow.AddMinutes(5);
                    _context.SaveChanges();

                    // Send code via email
                    await _emailService.SendLoginVerificationCodeAsync(admin.Email, code, admin.Firstname);

                    return Ok(new
                    {
                        message = "Verification code sent to your email. Please enter it to complete login.",
                        requiresCode = true,
                        email = admin.Email,
                        role = "Admin"
                    });
                }

                // Invalid credentials
                return Unauthorized(new { message = "Invalid email or password" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error: " + ex.Message });
            }
        }

        // ======================
        // 🧩 Verify Login Code (Second step of login)
        // ======================
        [HttpPost("verify-login-code")]
        public IActionResult VerifyLoginCode([FromBody] VerificationCodeDto request)
        {
            try
            {
                string email = request.Email;
                string code = request.Code;

                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(code))
                    return BadRequest(new { message = "Email and verification code are required" });

                email = email.Trim().ToLower();

                // Check BHW
                var bhw = _context.Bhws.FirstOrDefault(b => !string.IsNullOrEmpty(b.Email) && b.Email.ToLower() == email);
                if (bhw != null)
                {
                    // Verify code
                    if (bhw.LoginVerificationCode != code)
                        return Unauthorized(new { message = "Invalid verification code" });

                    if (bhw.LoginVerificationCodeExpiry < DateTime.UtcNow)
                        return Unauthorized(new { message = "Verification code has expired. Please request a new one." });

                    // Clear the code
                    bhw.LoginVerificationCode = null;
                    bhw.LoginVerificationCodeExpiry = null;
                    _context.SaveChanges();

                    return Ok(new
                    {
                        message = "Login successful",
                        bhwId = bhw.BhwId,
                        firstname = bhw.Firstname,
                        email = bhw.Email,
                        status = bhw.Status,
                        role = "BHW"
                    });
                }

                // Check Admin
                var admin = _context.admins.FirstOrDefault(a => !string.IsNullOrEmpty(a.Email) && a.Email.ToLower() == email);
                if (admin != null)
                {
                    // Verify code
                    if (admin.LoginVerificationCode != code)
                        return Unauthorized(new { message = "Invalid verification code" });

                    if (admin.LoginVerificationCodeExpiry < DateTime.UtcNow)
                        return Unauthorized(new { message = "Verification code has expired. Please request a new one." });

                    // Clear the code
                    admin.LoginVerificationCode = null;
                    admin.LoginVerificationCodeExpiry = null;
                    _context.SaveChanges();

                    return Ok(new
                    {
                        message = "Login successful",
                        adminId = admin.AdminId,
                        firstname = admin.Firstname,
                        email = admin.Email,
                        role = "Admin"
                    });
                }

                return NotFound(new { message = "User not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error: " + ex.Message });
            }
        }



        // ======================
        // 🧩 BHW Login (only for approved)
        // ======================
        [HttpPost("bhw-login")]
        public IActionResult BhwLogin([FromBody] LoginDto login)
        {
            if (login == null || string.IsNullOrEmpty(login.Email) || string.IsNullOrEmpty(login.Password))
                return BadRequest(new { message = "Email and password are required" });

            var bhw = _context.Bhws.FirstOrDefault(b => b.Email == login.Email && b.Password == login.Password);
            if (bhw == null)
                return Unauthorized(new { message = "Invalid credentials" });

            // ✅ STRICT CHECK: Only allow login if status is EXACTLY "Approved"
            if (string.IsNullOrEmpty(bhw.Status) || bhw.Status.ToLower() != "approved")
                return Unauthorized(new { message = "Your account is still pending approval by the Admin. Please wait for approval before attempting to login.", currentStatus = bhw.Status ?? "None" });

            return Ok(new
            {
                message = "Login success",
                bhwId = bhw.BhwId,
                firstname = bhw.Firstname,
                email = bhw.Email,
                status = bhw.Status
            });
        }

        // ======================
        // 🧩 Admin Login
        // ======================
        [HttpPost("admin-login")]
        public IActionResult AdminLogin([FromBody] LoginDto login)
        {
            try
            {
                if (login == null || string.IsNullOrEmpty(login.Email) || string.IsNullOrEmpty(login.Password))
                    return BadRequest(new { message = "Email and password are required" });

                var found = _context.admins.FirstOrDefault(a => a.Email == login.Email && a.Password == login.Password);

                if (found == null)
                    return Unauthorized(new { message = "Invalid admin credentials" });

                return Ok(new
                {
                    firstname = found.Firstname,
                    email = found.Email,
                    role = "Admin",
                    message = "Admin login successful!"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Server Error: " + ex.Message });
            }
        }

        // ======================
        // 🧩 Get ALL emails (BHW + Admin)
        // ======================
        [HttpGet("all-emails")]
        public IActionResult GetAllEmails()
        {
            try
            {
                var bhwEmails = _context.Bhws
                    .Select(b => new
                    {
                        firstname = b.Firstname,
                        surname = b.Surname,
                        email = b.Email,
                        role = "BHW",
                        status = b.Status
                    })
                    .ToList();

                var adminEmails = _context.admins
                    .Select(a => new
                    {
                        firstname = a.Firstname,
                        surname = a.Surname,
                        email = a.Email,
                        role = "Admin",
                        status = "Active"
                    })
                    .ToList();

                return Ok(new
                {
                    bhws = bhwEmails,
                    admins = adminEmails
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error loading emails", detail = ex.Message });
            }
        }

        // ======================
        // 🧩 Forgot Password (BHW & Admin)
        // ======================
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.Email))
                    return BadRequest(new { message = "Email is required", found = false });

                string email = request.Email.Trim().ToLower();

                // Check BHW
                var bhw = _context.Bhws.FirstOrDefault(b => !string.IsNullOrEmpty(b.Email) && b.Email.ToLower() == email);
                if (bhw != null)
                {
                    // Generate reset code
                    var resetCode = GenerateVerificationCode();
                    bhw.LoginVerificationCode = resetCode;
                    bhw.LoginVerificationCodeExpiry = DateTime.UtcNow.AddMinutes(15);
                    _context.SaveChanges();

                    // Send reset email
                    await _emailService.SendLoginVerificationCodeAsync(bhw.Email, resetCode, bhw.Firstname);

                    return Ok(new
                    {
                        found = true,
                        message = "Password reset code sent to your email!",
                        role = "BHW"
                    });
                }

                // Check Admin
                var admin = _context.admins.FirstOrDefault(a => !string.IsNullOrEmpty(a.Email) && a.Email.ToLower() == email);
                if (admin != null)
                {
                    // Generate reset code
                    var resetCode = GenerateVerificationCode();
                    admin.LoginVerificationCode = resetCode;
                    admin.LoginVerificationCodeExpiry = DateTime.UtcNow.AddMinutes(15);
                    _context.SaveChanges();

                    // Send reset email
                    await _emailService.SendLoginVerificationCodeAsync(admin.Email, resetCode, admin.Firstname);

                    return Ok(new
                    {
                        found = true,
                        message = "Password reset code sent to your email!",
                        role = "Admin"
                    });
                }

                return NotFound(new
                {
                    found = false,
                    message = "No account found with this email address."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Server Error: " + ex.Message, found = false });
            }
        }

        // ======================
        // 🧩 Reset Password (BHW & Admin)
        // ======================
        [HttpPost("reset-password")]
        public IActionResult ResetPassword([FromBody] ResetPasswordDto request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.NewPassword))
                    return BadRequest(new { message = "Email and new password are required" });

                string email = request.Email.Trim().ToLower();

                // Check BHW
                var bhw = _context.Bhws.FirstOrDefault(b => !string.IsNullOrEmpty(b.Email) && b.Email.ToLower() == email);
                if (bhw != null)
                {
                    bhw.Password = request.NewPassword;
                    _context.SaveChanges();
                    return Ok(new { message = "BHW password reset successful!" });
                }

                // Check Admin
                var admin = _context.admins.FirstOrDefault(a => !string.IsNullOrEmpty(a.Email) && a.Email.ToLower() == email);
                if (admin != null)
                {
                    admin.Password = request.NewPassword;
                    _context.SaveChanges();
                    return Ok(new { message = "Admin password reset successful!" });
                }

                return NotFound(new { message = "Account not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error: " + ex.Message });
            }
        }

        // ======================
        // 🧩 Helper: Validate Email Format
        // ======================
        private bool IsValidEmailFormat(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }

        // ======================
        // 🧩 Helper: Check if Email is Disposable/Temporary
        // ======================
        private bool IsDisposableEmail(string email)
        {
            // List of common disposable email domains
            var disposableDomains = new[]
            {
                "tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com",
                "10minutemail.com", "temp-mail.org", "fakeinbox.com", "trashmail.com",
                "yopmail.com", "temp-mail.io", "maildrop.cc", "mytrashmail.com",
                "sharklasers.com", "spam4.me", "tempmail.info", "tempmail.net",
                "10minutesmail.com", "minutemail.com", "throwawaymail.com"
            };

            var domain = email.Split('@')[1];
            return disposableDomains.Contains(domain);
        }

        // ======================
        // 🧩 Helper: Generate Verification Code
        // ======================
        private string GenerateVerificationCode()
        {
            Random random = new Random();
            return random.Next(100000, 999999).ToString();
        }
    }
}
