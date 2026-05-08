namespace BHWTracker.Models
{
using System.ComponentModel.DataAnnotations.Schema;
[Table("residents")]
    public class Resident
    {
        public int ResidentId { get; set; }

        public string Surname { get; set; } = "";
        public string Firstname { get; set; } = "";
        public string Middlename { get; set; } = "";
        public int Age { get; set; }
        public int? AddedByBhwId { get; set; }
        public DateTime? Birthday { get; set; } 
        public string Occupation { get; set; } = "";
        public string House { get; set; } = "";
        public int Years { get; set; }
        public string BloodType { get; set; } = "";
        public string Illness { get; set; } = "";
        public string CivilStatus { get; set; } = "";
        public string Education { get; set; } = "";
        public int Children { get; set; }
        public string Contact { get; set; } = "";
        public string Address { get; set; } = "";
        public double MapX { get; set; }
        public double MapY { get; set; }
        public bool IsPwd { get; set; } = false;
    }
}
