using Microsoft.AspNetCore.Mvc;
using BHWTracker.Data;
using BHWTracker.Models;
using Microsoft.EntityFrameworkCore;

namespace BHWTracker.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CertificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public CertificationsController(ApplicationDbContext context, IWebHostEnvironment webHostEnvironment)
        {
            _context = context;
            _webHostEnvironment = webHostEnvironment;
        }

        // ✅ Get all certifications for an Admin
        [HttpGet("admin/{adminId}")]
        public IActionResult GetAdminCertifications(int adminId)
        {
            try
            {
                var certs = _context.Certifications
                    .Where(c => c.AdminId == adminId)
                    .OrderByDescending(c => c.CreatedAt)
                    .ToList();

                return Ok(certs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error loading certifications", detail = ex.Message });
            }
        }

        // ✅ Get all certifications for a BHW
        [HttpGet("bhw/{bhwId}")]
        public IActionResult GetBhwCertifications(int bhwId)
        {
            try
            {
                var certs = _context.Certifications
                    .Where(c => c.BhwId == bhwId)
                    .OrderByDescending(c => c.CreatedAt)
                    .ToList();

                return Ok(certs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error loading certifications", detail = ex.Message });
            }
        }

        // ✅ Add a new certification for Admin
        [HttpPost("admin/add")]
        public IActionResult AddAdminCertification([FromForm] int adminId, [FromForm] string title, [FromForm] string organization, [FromForm] string dateReceived, [FromForm] string? description, [FromForm] string? certificateLink, [FromForm] IFormFile? document)
        {
            try
            {
                if (string.IsNullOrEmpty(title) || string.IsNullOrEmpty(organization) || string.IsNullOrEmpty(dateReceived))
                    return BadRequest("Title, Organization, and Date are required.");

                if (!DateTime.TryParse(dateReceived, out DateTime date))
                    return BadRequest("Invalid date format.");

                var cert = new Certification
                {
                    AdminId = adminId,
                    Title = title.Trim(),
                    Organization = organization.Trim(),
                    DateReceived = date,
                    Description = description?.Trim(),
                    CertificateLink = certificateLink?.Trim(),
                    CreatedAt = DateTime.UtcNow
                };

                // ✅ Handle file upload if provided
                if (document != null && document.Length > 0)
                {
                    var uploadsFolder = Path.Combine(_webHostEnvironment.WebRootPath, "uploads", "certifications", "admin", adminId.ToString());
                    Directory.CreateDirectory(uploadsFolder);

                    var fileName = $"{Guid.NewGuid()}_{document.FileName}";
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        document.CopyTo(fileStream);
                    }

                    cert.DocumentName = document.FileName;
                    cert.DocumentPath = $"/uploads/certifications/admin/{adminId}/{fileName}";
                }

                _context.Certifications.Add(cert);
                _context.SaveChanges();

                return Ok(new { message = "Certification added successfully!", certificationId = cert.CertificationId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error adding certification", detail = ex.Message });
            }
        }

        // ✅ Add a new certification
        [HttpPost("add")]
        public IActionResult AddCertification([FromForm] int bhwId, [FromForm] string title, [FromForm] string organization, [FromForm] string dateReceived, [FromForm] string? description, [FromForm] string? certificateLink, [FromForm] IFormFile? document)
        {
            try
            {
                if (string.IsNullOrEmpty(title) || string.IsNullOrEmpty(organization) || string.IsNullOrEmpty(dateReceived))
                    return BadRequest("Title, Organization, and Date are required.");

                if (!DateTime.TryParse(dateReceived, out DateTime date))
                    return BadRequest("Invalid date format.");

                var cert = new Certification
                {
                    BhwId = bhwId,
                    Title = title.Trim(),
                    Organization = organization.Trim(),
                    DateReceived = date,
                    Description = description?.Trim(),
                    CertificateLink = certificateLink?.Trim(),
                    CreatedAt = DateTime.UtcNow
                };

                // ✅ Handle file upload if provided
                if (document != null && document.Length > 0)
                {
                    var uploadsFolder = Path.Combine(_webHostEnvironment.WebRootPath, "uploads", "certifications", "bhw", bhwId.ToString());
                    Directory.CreateDirectory(uploadsFolder);

                    var fileName = $"{Guid.NewGuid()}_{document.FileName}";
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        document.CopyTo(fileStream);
                    }

                    cert.DocumentName = document.FileName;
                    cert.DocumentPath = $"/uploads/certifications/bhw/{bhwId}/{fileName}";
                }

                _context.Certifications.Add(cert);
                _context.SaveChanges();

                return Ok(new { message = "Certification added successfully!", certificationId = cert.CertificationId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error adding certification", detail = ex.Message });
            }
        }

        // ✅ Delete a certification
        [HttpDelete("{id}")]
        public IActionResult DeleteCertification(int id)
        {
            try
            {
                var cert = _context.Certifications.FirstOrDefault(c => c.CertificationId == id);
                if (cert == null)
                    return NotFound(new { message = "Certification not found" });

                // ✅ Delete uploaded file if it exists
                if (!string.IsNullOrEmpty(cert.DocumentPath))
                {
                    var filePath = Path.Combine(_webHostEnvironment.WebRootPath, cert.DocumentPath.TrimStart('/'));
                    if (System.IO.File.Exists(filePath))
                    {
                        System.IO.File.Delete(filePath);
                    }
                }

                _context.Certifications.Remove(cert);
                _context.SaveChanges();

                return Ok(new { message = "Certification deleted successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting certification", detail = ex.Message });
            }
        }

        // ✅ Update a certification
        [HttpPut("{id}")]
        public IActionResult UpdateCertification(int id, [FromForm] string? title, [FromForm] string? organization, [FromForm] string? dateReceived, [FromForm] string? description, [FromForm] string? certificateLink, [FromForm] IFormFile? document)
        {
            try
            {
                var cert = _context.Certifications.FirstOrDefault(c => c.CertificationId == id);
                if (cert == null)
                    return NotFound(new { message = "Certification not found" });

                if (!string.IsNullOrEmpty(title)) cert.Title = title.Trim();
                if (!string.IsNullOrEmpty(organization)) cert.Organization = organization.Trim();
                if (!string.IsNullOrEmpty(description)) cert.Description = description.Trim();
                if (!string.IsNullOrEmpty(certificateLink)) cert.CertificateLink = certificateLink.Trim();

                if (!string.IsNullOrEmpty(dateReceived))
                {
                    if (DateTime.TryParse(dateReceived, out DateTime date))
                        cert.DateReceived = date;
                }

                // ✅ Handle new file upload
                if (document != null && document.Length > 0)
                {
                    // Delete old file if exists
                    if (!string.IsNullOrEmpty(cert.DocumentPath))
                    {
                        var oldFilePath = Path.Combine(_webHostEnvironment.WebRootPath, cert.DocumentPath.TrimStart('/'));
                        if (System.IO.File.Exists(oldFilePath))
                        {
                            System.IO.File.Delete(oldFilePath);
                        }
                    }

                    string uploadsFolder;
                    string certPath;

                    if (cert.BhwId.HasValue)
                    {
                        uploadsFolder = Path.Combine(_webHostEnvironment.WebRootPath, "uploads", "certifications", "bhw", cert.BhwId.Value.ToString());
                        certPath = $"/uploads/certifications/bhw/{cert.BhwId.Value}/";
                    }
                    else if (cert.AdminId.HasValue)
                    {
                        uploadsFolder = Path.Combine(_webHostEnvironment.WebRootPath, "uploads", "certifications", "admin", cert.AdminId.Value.ToString());
                        certPath = $"/uploads/certifications/admin/{cert.AdminId.Value}/";
                    }
                    else
                    {
                        return BadRequest(new { message = "Certification must be associated with either a BHW or Admin" });
                    }

                    Directory.CreateDirectory(uploadsFolder);

                    var fileName = $"{Guid.NewGuid()}_{document.FileName}";
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        document.CopyTo(fileStream);
                    }

                    cert.DocumentName = document.FileName;
                    cert.DocumentPath = certPath + fileName;
                }

                _context.SaveChanges();

                return Ok(new { message = "Certification updated successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating certification", detail = ex.Message });
            }
        }
    }
}
