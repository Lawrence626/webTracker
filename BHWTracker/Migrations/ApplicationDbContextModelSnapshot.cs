using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using BHWTracker.Data;
using BHWTracker.Models;

namespace BHWTracker.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    partial class ApplicationDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "9.0.0")
                .HasAnnotation("Relational:MaxIdentifierLength", 64);

            MySqlModelBuilderExtensions.AutoIncrementColumns(modelBuilder);

            modelBuilder.Entity("BHWTracker.Models.Certification", b =>
                {
                    b.Property<int>("CertificationId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    MySqlPropertyBuilderExtensions.UseMySqlIdentityColumn(b.Property<int>("CertificationId"));

                    b.Property<int?>("AdminId")
                        .HasColumnType("int");

                    b.Property<int?>("BhwId")
                        .HasColumnType("int");

                    b.Property<string>("CertificateLink")
                        .HasColumnType("longtext");

                    b.Property<DateTime?>("CreatedAt")
                        .HasColumnType("datetime(6)");

                    b.Property<DateTime?>("DateReceived")
                        .HasColumnType("datetime(6)");

                    b.Property<string>("Description")
                        .HasColumnType("longtext");

                    b.Property<string>("DocumentName")
                        .HasColumnType("longtext");

                    b.Property<string>("DocumentPath")
                        .HasColumnType("longtext");

                    b.Property<string>("Organization")
                        .HasColumnType("longtext");

                    b.Property<string>("Title")
                        .HasColumnType("longtext");

                    b.HasKey("CertificationId");

                    b.ToTable("certifications");
                });

            // Add other entities here (Admin, Bhw, Resident)...
#pragma warning restore 612, 618
        }
    }
}
