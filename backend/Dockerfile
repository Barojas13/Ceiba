FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY EventosVivos.sln .
COPY src/EventosVivos.Api/EventosVivos.Api.csproj src/EventosVivos.Api/
COPY src/EventosVivos.Application/EventosVivos.Application.csproj src/EventosVivos.Application/
COPY src/EventosVivos.Domain/EventosVivos.Domain.csproj src/EventosVivos.Domain/
COPY src/EventosVivos.Infrastructure/EventosVivos.Infrastructure.csproj src/EventosVivos.Infrastructure/

RUN dotnet restore src/EventosVivos.Api/EventosVivos.Api.csproj

COPY src/ src/
RUN dotnet publish src/EventosVivos.Api/EventosVivos.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

RUN mkdir -p /app/data && chown -R app:app /app

COPY --from=build --chown=app:app /app/publish .

USER app

ENTRYPOINT ["dotnet", "EventosVivos.Api.dll"]
