using Microsoft.AspNetCore.Mvc;
using BHWTracker.Data;
using BHWTracker.Models;
using System.Linq;

namespace BHWTracker.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public AdminController(ApplicationDbContext context) => _context = context;

        // ---------------------------
        // GET: Get Admin Info
        // ---------------------------
        [HttpGet]
        public IActionResult GetAdmin()
        {
            var admin = _context.admins.FirstOrDefault();
            if (admin == null)
                return NotFound();

            // Format birthday as date-only (YYYY-MM-DD)
            var response = new
            {
                admin.AdminId,
                admin.Firstname,
                admin.Middlename,
                admin.Surname,
                admin.Age,
                Birthday = admin.Birthday.HasValue ? admin.Birthday.Value.ToString("yyyy-MM-dd") : null,
                admin.Email,
                admin.Contact,
                admin.Address,
                admin.Years,
                admin.Photo
            };

            return Ok(response);
        }

        // ---------------------------
        // PUT: Update Admin Profile
        // ---------------------------
        [HttpPut("{id}")]
        public IActionResult UpdateAdmin(int id, [FromBody] Admin updated)
        {
            var admin = _context.admins.Find(id);
            if (admin == null)
                return NotFound(new { message = "Admin not found" });

            // Update only non-null fields
            if (!string.IsNullOrEmpty(updated.Surname)) admin.Surname = updated.Surname;
            if (!string.IsNullOrEmpty(updated.Firstname)) admin.Firstname = updated.Firstname;
            if (!string.IsNullOrEmpty(updated.Middlename)) admin.Middlename = updated.Middlename;
            if (updated.Age != 0) admin.Age = updated.Age;
            if (updated.Birthday != default) admin.Birthday = updated.Birthday;
            if (updated.Years != null) admin.Years = updated.Years;
            if (!string.IsNullOrEmpty(updated.Address)) admin.Address = updated.Address;
            if (!string.IsNullOrEmpty(updated.Email)) admin.Email = updated.Email;
            if (!string.IsNullOrEmpty(updated.Contact)) admin.Contact = updated.Contact;
            if (!string.IsNullOrEmpty(updated.Photo)) admin.Photo = updated.Photo;

            _context.SaveChanges();
            return Ok(new { message = "Admin updated successfully." });
        }

        // ---------------------------
        // GET: Get Admin By Email
        // ---------------------------
        [HttpGet("by-email/{email}")]
        public IActionResult GetAdminByEmail(string email)
        {
            var admin = _context.admins.FirstOrDefault(a => a.Email == email);
            if (admin == null)
                return NotFound(new { message = "Admin not found" });

            // Format birthday as date-only (YYYY-MM-DD)
            var response = new
            {
                admin.AdminId,
                admin.Firstname,
                admin.Middlename,
                admin.Surname,
                admin.Age,
                Birthday = admin.Birthday.HasValue ? admin.Birthday.Value.ToString("yyyy-MM-dd") : null,
                admin.Email,
                admin.Contact,
                admin.Address,
                admin.Years,
                admin.Photo
            };

            return Ok(response);
        }

        // ---------------------------
        // POST: Add BHW (from Admin Panel → Auto-Approved)
        // ---------------------------
        [HttpPost("add-bhw")]
        public IActionResult AddBhw([FromBody] Bhw bhw)
        {
            if (bhw == null || string.IsNullOrEmpty(bhw.Email) || string.IsNullOrEmpty(bhw.Password))
                return BadRequest(new { message = "Email and password are required" });

            // ✅ Auto-approved when added by admin
            bhw.Status = "Approved";
            bhw.YearsOfService = bhw.YearsOfService ?? 0;

            var admin = _context.admins.FirstOrDefault();
            if (admin != null)
                bhw.AddedByAdminId = admin.AdminId;

            _context.Bhws.Add(bhw);
            _context.SaveChanges();

            return Ok(new
            {
                message = $"BHW {bhw.Firstname} {bhw.Surname} successfully added and auto-approved!",
                status = bhw.Status
            });
        }

        // ---------------------------
// ✅ GET: Illness chart data (for Admin dashboard)
// ---------------------------
[HttpGet("chart-data")]
public IActionResult GetAdminChartData()
{
    var illnessCounts = _context.Residents
        .GroupBy(r => r.Illness)
        .Select(g => new
        {
            Illness = g.Key ?? "None",
            Count = g.Count()
        })
        .ToList();

    return Ok(new
    {
        labels = illnessCounts.Select(i => i.Illness).ToList(),
        values = illnessCounts.Select(i => i.Count).ToList()
    });
}


    }
}
