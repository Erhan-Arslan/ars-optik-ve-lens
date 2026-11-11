FROM mcr.microsoft.com/dotnet/sdk:11.0 AS build
WORKDIR /src
COPY global.json Directory.Build.props ./
COPY src/ArsOptik.Services/ArsOptik.Services.csproj src/ArsOptik.Services/
RUN dotnet restore src/ArsOptik.Services/ArsOptik.Services.csproj
COPY src/ src/
RUN dotnet publish src/ArsOptik.Services/ArsOptik.Services.csproj -c Release -o /app --no-restore

# "chiseled-extra": distroless and non-root by default, but keeps ICU/tzdata so tr-TR
# formatting (prices, dates on invoices) works.
FROM mcr.microsoft.com/dotnet/aspnet:11.0-resolute-chiseled-extra AS runtime
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "ArsOptik.Services.dll"]
