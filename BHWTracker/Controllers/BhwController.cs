using Microsoft.AspNetCore.Mvc;
using BHWTracker.Data;
using BHWTracker.Models;
using Microsoft.EntityFrameworkCore;

namespace BHWTracker.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BhwController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public BhwController(ApplicationDbContext context) => _context = context;

        [HttpGet("approved")]
        public IActionResult GetApproved()
        {
            try
            {
                var approved = _context.Bhws
                    .Where(b => b.Status == "Approved")
                    .OrderByDescending(b => b.BhwId)
                    .ToList();

                return Ok(approved);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error loading approved BHWs", detail = ex.Message });
            }
        }

        [HttpGet("pending")]
        public IActionResult GetPending()
        {
            try
            {
                var pending = _context.Bhws
                    .Where(b => b.Status == "Pending")
                    .OrderByDescending(b => b.BhwId)
                    .ToList();

                return Ok(pending);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error loading pending BHWs", detail = ex.Message });
            }
        }

        [HttpGet("rejected")]
public IActionResult GetRejected()
{
    try
    {
        var rejected = _context.Bhws
            .Where(b => b.Status == "Rejected")  
            .OrderByDescending(b => b.BhwId)
            .ToList();

        return Ok(rejected);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Error loading rejected BHWs", detail = ex.Message });
    }
}



        [HttpGet("all")]
        public IActionResult GetAll()
        {
            try
            {
                var all = _context.Bhws
                    .OrderByDescending(b => b.BhwId)
                    .ToList();

                return Ok(all);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error loading all BHWs", detail = ex.Message });
            }
        }


        [HttpPut("{id}/approve")]
        public IActionResult Approve(int id)
        {
            var bhw = _context.Bhws.FirstOrDefault(b => b.BhwId == id);
            if (bhw == null) return NotFound();

            bhw.Status = "Approved";
            _context.SaveChanges();

            return Ok(new { message = $"{bhw.Firstname} {bhw.Surname} approved!" });
        }


        [HttpPut("{id}/reject")]
        public IActionResult Reject(int id)
        {
            var bhw = _context.Bhws.FirstOrDefault(b => b.BhwId == id);
            if (bhw == null) return NotFound();

            bhw.Status = "Rejected";
            _context.SaveChanges();

            return Ok(new { message = $"{bhw.Firstname} {bhw.Surname} rejected." });
        }


        [HttpPost("add")]
        public IActionResult AddBhw([FromBody] Bhw newBhw)
        {
            if (newBhw == null || string.IsNullOrEmpty(newBhw.Email)) 
                return BadRequest("Invalid data. Email is required.");

            var exists = _context.Bhws
                .Any(b => b.Email != null && b.Email.ToLower() == newBhw.Email.ToLower());

            if (exists)
                return Conflict(new { message = "BHW with this email already exists." });

            newBhw.Status = "Pending";
            _context.Bhws.Add(newBhw);
            _context.SaveChanges();

            return Ok(new { message = "BHW added successfully!" });
        }






        // ✅ NEW: Get single BHW by ID (for Edit form)
        [HttpGet("{id}")]
        public IActionResult GetBhwById(int id)
        {
            var bhw = _context.Bhws.FirstOrDefault(b => b.BhwId == id);
            if (bhw == null)
                return NotFound(new { message = "BHW not found" });

            // ✅ Return all fields, including password and birthday
            return Ok(new
            {
                bhw.BhwId,
                bhw.Firstname,
                bhw.Middlename,
                bhw.Surname,
                bhw.Age,
                bhw.Birthday,

                bhw.Address,
                bhw.Contact,
                bhw.Email,
                bhw.Password,
                bhw.YearsOfService,
                bhw.Status
            });
        }

        // ✅ Update (Edit)
        [HttpPut("{id}")]
        public IActionResult UpdateBhw(int id, [FromBody] Bhw updated)
        {
            var bhw = _context.Bhws.FirstOrDefault(b => b.BhwId == id);
            if (bhw == null) return NotFound();

            bhw.Firstname = updated.Firstname ?? bhw.Firstname;
            bhw.Middlename = updated.Middlename ?? bhw.Middlename;
            bhw.Surname = updated.Surname ?? bhw.Surname;
            bhw.Age = updated.Age;
            bhw.Birthday = updated.Birthday;
            bhw.YearsOfService = updated.YearsOfService;
            bhw.Address = updated.Address ?? bhw.Address;
            bhw.Contact = updated.Contact ?? bhw.Contact;
            bhw.Email = updated.Email ?? bhw.Email;
            bhw.Password = updated.Password ?? bhw.Password;
            bhw.Status = updated.Status ?? bhw.Status;

            _context.SaveChanges();
            return Ok(new { message = "BHW updated successfully." });
        }


        [HttpDelete("{id}")]
        public IActionResult DeleteBhw(int id)
        {
            var bhw = _context.Bhws.FirstOrDefault(b => b.BhwId == id);
            if (bhw == null) return NotFound();

            _context.Bhws.Remove(bhw);
            _context.SaveChanges();
            return Ok(new { message = "BHW deleted successfully." });
        }


        [HttpGet("by-email/{email}")]
        public async Task<IActionResult> GetByEmail(string email)
        {
            var bhw = await _context.Bhws.FirstOrDefaultAsync(b => b.Email == email);

            if (bhw == null)
                return NotFound(new { message = "BHW not found" });

            return Ok(bhw);
        }

        
    }
}
