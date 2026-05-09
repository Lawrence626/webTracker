using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using BHWTracker.Data;
using BHWTracker.Services;
using System.IO;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

Environment.SetEnvironmentVariable("DOTNET_USE_POLLING_FILE_WATCHER", "1");

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<IConfiguration>(builder.Configuration);
builder.Services.AddControllers();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    
    // Support environment variable override for production
    if (string.IsNullOrEmpty(connectionString))
    {
        connectionString = Environment.GetEnvironmentVariable("DATABASE_URL") 
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? throw new InvalidOperationException("Database connection string not found. Set DATABASE_URL environment variable.");
    }
    
   options.UseMySql(
    connectionString,
    ServerVersion.AutoDetect(connectionString)
    );
});

builder.Services.AddScoped<IEmailService, EmailService>();


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var isDevelopment = builder.Environment.IsDevelopment();
        
        if (isDevelopment)
        {
            // Development: Allow local origins
            policy.WithOrigins(
                "http://127.0.0.1:5500",
                "http://localhost:5500",
                "http://127.0.0.1:3000",
                "http://localhost:3000"
            );
        }
        else
        {
            // Production: Allow Render domain
            policy.WithOrigins("https://webtracker-oir7.onrender.com");
        }
        
        policy.AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        if (dbContext.Database.CanConnect())
        {
            Console.WriteLine("Database connected successfully!");
        }
        else
        {
            Console.WriteLine("Cannot connect to database.");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database connection error: {ex.Message}");
    }
}

// ... (keep your database and CORS code at the top)

app.UseCors("AllowFrontend");
app.UseRouting();
app.UseAuthorization();

// HANAPIN ANG TAMANG PATH
string webRootPath = app.Environment.WebRootPath ?? Path.Combine(AppContext.BaseDirectory, "wwwroot");

if (!Directory.Exists(webRootPath)) 
{
    Directory.CreateDirectory(webRootPath);
}

// --- ITO ANG DAGDAG NA KAILANGAN MO ---
// Pinapayagan ang app na gamitin ang Frontpage.html bilang default page
var defaultFilesOptions = new DefaultFilesOptions();
defaultFilesOptions.DefaultFileNames.Clear();
defaultFilesOptions.DefaultFileNames.Add("Frontpage.html"); 
app.UseDefaultFiles(defaultFilesOptions);
// --------------------------------------

// I-serve ang files mula sa wwwroot
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(webRootPath),
    RequestPath = ""
});

// I-serve ang uploads
string uploadsPath = Path.Combine(webRootPath, "uploads");
if (!Directory.Exists(uploadsPath)) Directory.CreateDirectory(uploadsPath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.MapControllers();
app.Run();