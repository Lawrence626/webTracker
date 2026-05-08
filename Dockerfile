# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy project files
COPY BHWTracker/BHWTracker.csproj ./BHWTracker/
RUN dotnet restore BHWTracker/BHWTracker.csproj

# Copy all source code
COPY . .

# Build the application
RUN dotnet build BHWTracker/BHWTracker.csproj -c Release -o out

# Publish stage
RUN dotnet publish BHWTracker/BHWTracker.csproj -c Release -o publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
EXPOSE 10000

# Copy published app from build stage
COPY --from=build /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:10000
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_EnableDiagnostics=0

ENTRYPOINT ["dotnet", "BHWTracker.dll"]
