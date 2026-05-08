
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src


COPY ["BHWTracker/BHWTracker.csproj", "BHWTracker/"]
RUN dotnet restore "BHWTracker/BHWTracker.csproj"


COPY . .
WORKDIR "/src/BHWTracker"
RUN dotnet publish "BHWTracker.csproj" -c Release -o /app/publish /p:UseAppHost=false


FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
EXPOSE 10000


COPY --from=build /app/publish .


COPY --from=build /src/frontend ./wwwroot/



RUN mkdir -p /app/wwwroot/uploads


ENV ASPNETCORE_URLS=http://+:10000
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "BHWTracker.dll"]