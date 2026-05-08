
namespace BHWTracker.Models

{
    using System.ComponentModel.DataAnnotations.Schema;
    [Table("admins")]
    public class Admin

    {
        public int AdminId { get; set; }
        public string? Firstname { get; set; }   // <-- allow null
        public string? Middlename { get; set; }  // <-- allow null
        public string? Surname { get; set; }     // <-- allow null
        public string? Email { get; set; }
        public string? Password { get; set; }
       

        public string? Address { get; set; }     // <-- allow null
        public int? Age { get; set; }            // optional
        public DateTime? Birthday { get; set; }  // ✅ Correct type for MySQL 'date'

        public string? Contact { get; set; }     // optional
        public string? Photo { get; set; }       // optional
        public int? Years { get; set; }          // optional
        
        // ✅ Login Verification Code Fields
        public string? LoginVerificationCode { get; set; }
        public DateTime? LoginVerificationCodeExpiry { get; set; }
    }

}
