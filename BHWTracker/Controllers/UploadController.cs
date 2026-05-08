using Microsoft.AspNetCore.Mvc;
using BHWTracker.Data;

namespace BHWTracker.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public UploadController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpPost("admin/{id}")]
        public async Task<IActionResult> UploadAdminPhoto(int id, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded" });

            // ✅ Ensure uploads are always under wwwroot/uploads
            var uploadDir = Path.Combine(_env.WebRootPath, "uploads");
            if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);

            var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(uploadDir, fileName);

            // ✅ Log where file is being saved (for debugging)
            Console.WriteLine($"[UploadController] Saving file to: {filePath}");

            using (var stream = new FileStream(filePath, FileMode.Create))
                await file.CopyToAsync(stream);

            var admin = _context.admins.Find(id);
            if (admin == null) return NotFound(new { message = "Admin not found" });

            // ✅ Use forward slash for web path
            admin.Photo = $"/uploads/{fileName}";
            _context.SaveChanges();

            return Ok(new { photoPath = "/uploads/" + fileName });

        }

        [HttpPost("bhw/{id}")]
        public async Task<IActionResult> UploadBhwPhoto(int id, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded" });

            var uploadDir = Path.Combine(_env.WebRootPath, "uploads");
            if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);

            var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(uploadDir, fileName);

            Console.WriteLine($"[UploadController] Saving file to: {filePath}");

            using (var stream = new FileStream(filePath, FileMode.Create))
                await file.CopyToAsync(stream);

            var bhw = _context.Bhws.Find(id);
            if (bhw == null) return NotFound(new { message = "BHW not found" });

            bhw.Photo = $"/uploads/{fileName}";
            _context.SaveChanges();

           return Ok(new { photoPath = "/uploads/" + fileName });

        }
    }
}
