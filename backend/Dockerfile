FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY global.json .
COPY EventosVivos.sln .
COPY src/EventosVivos.Api/EventosVivos.Api.csproj src/EventosVivos.Api/
COPY src/EventosVivos.Application/EventosVivos.Application.csproj src/EventosVivos.Application/
COPY src/EventosVivos.Domain/EventosVivos.Domain.csproj src/EventosVivos.Domain/
COPY src/EventosVivos.Infrastructure/EventosVivos.Infrastructure.csproj src/EventosVivos.Infrastructure/

RUN dotnet restore EventosVivos.sln

COPY src/ src/
RUN dotnet publish src/EventosVivos.Api/EventosVivos.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080

RUN mkdir -p /app/data

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "EventosVivos.Api.dll"]
