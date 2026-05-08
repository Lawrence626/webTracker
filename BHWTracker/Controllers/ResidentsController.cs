using Microsoft.AspNetCore.Mvc;
using BHWTracker.Data;
using BHWTracker.Models;
using Microsoft.EntityFrameworkCore;

namespace BHWTracker.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ResidentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ResidentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ✅ Get all residents
        [HttpGet]
        public async Task<IActionResult> GetAllResidents()
        {
            var residents = await _context.Residents.ToListAsync();
            return Ok(residents);
        }

        // ✅ Get residents added by a specific BHW
        [HttpGet("bybhw/{bhwId}")]
        public async Task<IActionResult> GetResidentsByBhw(int bhwId)
        {
            var residents = await _context.Residents
                .Where(r => r.AddedByBhwId == bhwId)
                .ToListAsync();
            return Ok(residents);
        }

        // ✅ Add new resident
        [HttpPost]
        public async Task<IActionResult> AddResident([FromBody] Resident resident)
        {
            _context.Residents.Add(resident);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Resident added successfully!" });
        }

        // ✅ Update resident
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateResident(int id, [FromBody] Resident updated)
        {
            var existing = await _context.Residents.FindAsync(id);
            if (existing == null)
                return NotFound(new { message = "Resident not found." });

            // manually update fields
            existing.Surname = updated.Surname;
            existing.Firstname = updated.Firstname;
            existing.Middlename = updated.Middlename;
            existing.Age = updated.Age;
            existing.Birthday = updated.Birthday;
            existing.Occupation = updated.Occupation;
            existing.House = updated.House;
            existing.Years = updated.Years;
            existing.BloodType = updated.BloodType;
            existing.Illness = updated.Illness;
            existing.CivilStatus = updated.CivilStatus;
            existing.Education = updated.Education;
            existing.Children = updated.Children;
            existing.Contact = updated.Contact;
            existing.Address = updated.Address;
            existing.MapX = updated.MapX;
            existing.MapY = updated.MapY;
            existing.IsPwd = updated.IsPwd;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Resident updated successfully!" });
        }


        // ✅ Delete resident
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteResident(int id)
        {
            var resident = await _context.Residents.FindAsync(id);
            if (resident == null) return NotFound();

            _context.Residents.Remove(resident);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Resident deleted successfully!" });
        }

        // ✅ Get residents by category (Senior, Child, PWD)
        [HttpGet("by-category/{category}/bhw/{bhwId}")]
        public async Task<IActionResult> GetResidentsByCategory(string category, int bhwId)
        {
            var query = _context.Residents.Where(r => r.AddedByBhwId == bhwId);

            query = category.ToLower() switch
            {
                "senior" => query.Where(r => r.Age >= 60),
                "child" => query.Where(r => r.Age <= 17),
                "pwd" => query.Where(r => r.IsPwd == true),
                _ => query
            };

            var residents = await query.ToListAsync();
            return Ok(residents);
        }

        
    }
    
}
