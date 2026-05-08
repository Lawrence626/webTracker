using Microsoft.EntityFrameworkCore;
using BHWTracker.Models;

namespace BHWTracker.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<Admin> admins { get; set; }
        public DbSet<Bhw> Bhws { get; set; }
        public DbSet<Resident> Residents { get; set; }
        public DbSet<Certification> Certifications { get; set; }
    }
}
