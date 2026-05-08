# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Gamitin ang tamang Case ng folder name mo (Double check kung BHWTracker o BhwTracker)
COPY ["BHWTracker/BHWTracker.csproj", "BHWTracker/"]
RUN dotnet restore "BHWTracker/BHWTracker.csproj"

# Copy lahat ng files
COPY . .
WORKDIR "/src/BHWTracker"
RUN dotnet publish "BHWTracker.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
EXPOSE 10000

# Copy from build stage
COPY --from=build /app/publish .

# Siguraduhin na may uploads folder
RUN mkdir -p /app/wwwroot/uploads

# Render PORT setup
ENV ASPNETCORE_URLS=http://+:10000
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "BHWTracker.dll"]