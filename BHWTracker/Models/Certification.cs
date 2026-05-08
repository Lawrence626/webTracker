namespace BHWTracker.Models
{
    using System.ComponentModel.DataAnnotations.Schema;
    using System.ComponentModel.DataAnnotations;

    [Table("certifications")]
    public class Certification
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int CertificationId { get; set; }

        public int? BhwId { get; set; }
        
        public int? AdminId { get; set; }
        
        public string? Title { get; set; }
        
        public string? Organization { get; set; }
        
        public DateTime? DateReceived { get; set; }
        
        public string? Description { get; set; }
        
        public string? CertificateLink { get; set; }
        
        public string? DocumentName { get; set; }
        
        public string? DocumentPath { get; set; }
        
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
