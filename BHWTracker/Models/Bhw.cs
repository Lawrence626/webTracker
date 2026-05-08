namespace BHWTracker.Models
{
    using System.ComponentModel.DataAnnotations.Schema;
    using System.ComponentModel.DataAnnotations;

    [Table("bhws")]
    public class Bhw
    {
        [Key]
        public int BhwId { get; set; }

        public string? Firstname { get; set; }
        public string? Middlename { get; set; }
        
        public int? AddedByAdminId { get; set; }
        public string? Surname { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? Status { get; set; }
        public int? YearsOfService { get; set; }

        public string? Address { get; set; }
        public int? Age { get; set; }
        public DateTime? Birthday { get; set; }

        public string? Contact { get; set; }
        public string? Photo { get; set; }

        // ✅ Login Verification Code Fields
        public string? LoginVerificationCode { get; set; }
        public DateTime? LoginVerificationCodeExpiry { get; set; }
    }
}
