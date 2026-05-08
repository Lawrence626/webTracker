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
        policy.WithOrigins(
            "http://127.0.0.1:5500",
            "http://localhost:5500"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
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

app.UseCors("AllowFrontend");
app.UseRouting();
app.UseAuthorization();


string webRootPath = app.Environment.WebRootPath;
if (string.IsNullOrEmpty(webRootPath))
{
    webRootPath = Path.Combine(AppContext.BaseDirectory, "wwwroot");
}

try
{
    if (!Directory.Exists(webRootPath)) 
        Directory.CreateDirectory(webRootPath);

    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(webRootPath),
        RequestPath = ""
    });

    string uploadsPath = Path.Combine(webRootPath, "uploads");
    if (!Directory.Exists(uploadsPath)) 
        Directory.CreateDirectory(uploadsPath);

    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(uploadsPath),
        RequestPath = "/uploads"
    });
}
catch (Exception ex)
{
    Console.WriteLine($" Warning: Static files error: {ex.Message}");
}

app.MapControllers();



app.Run();
