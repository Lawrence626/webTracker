using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BHWTracker.Migrations
{
    /// <inheritdoc />
    public partial class AddPwdFieldToResidents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add IsPwd column to residents table
            migrationBuilder.Sql(@"
                ALTER TABLE `residents` ADD COLUMN `IsPwd` tinyint(1) NOT NULL DEFAULT 0;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop the IsPwd column if migration is rolled back
            migrationBuilder.Sql(@"
                ALTER TABLE `residents` DROP COLUMN `IsPwd`;
            ");
        }
    }
}
