using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BHWTracker.Migrations
{
    /// <inheritdoc />
    public partial class EnsureBhwStatusColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Ensure bhws table exists and has Status column
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS `bhws` (
                    `BhwId` int AUTO_INCREMENT NOT NULL,
                    `Firstname` longtext CHARACTER SET utf8mb4 NULL,
                    `Middlename` longtext CHARACTER SET utf8mb4 NULL,
                    `Surname` longtext CHARACTER SET utf8mb4 NULL,
                    `Email` longtext CHARACTER SET utf8mb4 NULL,
                    `Password` longtext CHARACTER SET utf8mb4 NULL,
                    `Status` longtext CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Pending',
                    `AddedByAdminId` int NULL,
                    `YearsOfService` int NULL,
                    `Address` longtext CHARACTER SET utf8mb4 NULL,
                    `Age` int NULL,
                    `Birthday` datetime(6) NULL,
                    `Contact` longtext CHARACTER SET utf8mb4 NULL,
                    `Photo` longtext CHARACTER SET utf8mb4 NULL,
                    CONSTRAINT `PK_bhws` PRIMARY KEY (`BhwId`)
                ) CHARACTER SET=utf8mb4;
            ");

            // Add Status column if it doesn't exist
            migrationBuilder.Sql(@"
                ALTER TABLE `bhws` MODIFY COLUMN `Status` longtext CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Pending';
            ");

            // Update any NULL Status values to 'Pending'
            migrationBuilder.Sql(@"
                UPDATE `bhws` SET `Status` = 'Pending' WHERE `Status` IS NULL OR `Status` = '';
            ");

            // Add LoginVerificationCode and LoginVerificationCodeExpiry columns to bhws
            migrationBuilder.Sql(@"
                ALTER TABLE `bhws` ADD COLUMN `LoginVerificationCode` longtext CHARACTER SET utf8mb4 NULL;
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE `bhws` ADD COLUMN `LoginVerificationCodeExpiry` datetime(6) NULL;
            ");

            // Ensure admins table exists with LoginVerificationCode columns
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS `admins` (
                    `AdminId` int AUTO_INCREMENT NOT NULL,
                    `Firstname` longtext CHARACTER SET utf8mb4 NULL,
                    `Surname` longtext CHARACTER SET utf8mb4 NULL,
                    `Email` longtext CHARACTER SET utf8mb4 NULL,
                    `Password` longtext CHARACTER SET utf8mb4 NULL,
                    `LoginVerificationCode` longtext CHARACTER SET utf8mb4 NULL,
                    `LoginVerificationCodeExpiry` datetime(6) NULL,
                    CONSTRAINT `PK_admins` PRIMARY KEY (`AdminId`)
                ) CHARACTER SET=utf8mb4;
            ");

            // Add LoginVerificationCode columns to admins if it doesn't have them
            migrationBuilder.Sql(@"
                ALTER TABLE `admins` ADD COLUMN `LoginVerificationCode` longtext CHARACTER SET utf8mb4 NULL;
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE `admins` ADD COLUMN `LoginVerificationCodeExpiry` datetime(6) NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // This migration is safe to revert - just documenting the change
        }
    }
}
