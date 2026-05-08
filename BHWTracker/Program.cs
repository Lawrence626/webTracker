using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using BHWTracker.Data;
using BHWTracker.Services;
using System.IO;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddSingleton<IConfiguration>(builder.Configuration);
builder.Services.AddControllers();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 0, 0))
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
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
  
        dbContext.Database.EnsureCreated();
        Console.WriteLine(" Database schema ensured successfully!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($" Database schema error: {ex.Message}");
    }
}


app.UseCors("AllowFrontend");
app.UseRouting();
app.UseAuthorization();


string webRootPath = app.Environment.WebRootPath;
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

app.MapControllers();



app.Run();
