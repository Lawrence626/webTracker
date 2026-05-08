using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BHWTracker.Migrations
{
    /// <inheritdoc />
    public partial class AddCertificationsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Simple direct approach - just drop and recreate the table if it exists
            migrationBuilder.Sql("DROP TABLE IF EXISTS `certifications`");
            
            migrationBuilder.CreateTable(
                name: "certifications",
                columns: table => new
                {
                    CertificationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:AutoIncrement", true),
                    BhwId = table.Column<int>(type: "int", nullable: true),
                    AdminId = table.Column<int>(type: "int", nullable: true),
                    Title = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySQL:CharSet", "utf8mb4"),
                    Organization = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySQL:CharSet", "utf8mb4"),
                    DateReceived = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Description = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySQL:CharSet", "utf8mb4"),
                    CertificateLink = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySQL:CharSet", "utf8mb4"),
                    DocumentName = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySQL:CharSet", "utf8mb4"),
                    DocumentPath = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySQL:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_certifications", x => x.CertificationId);
                })
                .Annotation("MySQL:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "certifications");
        }
    }
}
