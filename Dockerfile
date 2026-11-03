# F9.4 — Imagen de producción de ChemLab.API (Render: type=web, runtime=docker).
# Contexto de build = RAÍZ del repo (coexisten ChemLabBackend/ y frontend/).
#   docker build -t chemlab-api:test .
#   docker run --rm -p 5000:5000 -e ConnectionStrings__DefaultConnection="Host=...;..." chemlab-api:test

# ---------- Etapa 1: build / publish ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder
WORKDIR /src

# 1) Solo los .csproj: capa cacheable, el restore no se repite al cambiar código.
COPY ChemLabBackend/src/ChemLab.Domain/ChemLab.Domain.csproj ChemLabBackend/src/ChemLab.Domain/
COPY ChemLabBackend/src/ChemLab.Application/ChemLab.Application.csproj ChemLabBackend/src/ChemLab.Application/
COPY ChemLabBackend/src/ChemLab.Infrastructure/ChemLab.Infrastructure.csproj ChemLabBackend/src/ChemLab.Infrastructure/
COPY ChemLabBackend/src/ChemLab.API/ChemLab.API.csproj ChemLabBackend/src/ChemLab.API/
RUN dotnet restore ChemLabBackend/src/ChemLab.API/ChemLab.API.csproj

# 2) Código fuente y publish Release (sin apphost: el contenedor usa dotnet <dll>).
COPY ChemLabBackend/ ChemLabBackend/
RUN dotnet publish ChemLabBackend/src/ChemLab.API/ChemLab.API.csproj \
    -c Release \
    -o /app/publish \
    --no-restore \
    /p:UseAppHost=false

# ---------- Etapa 2: runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Production por defecto; Render inyecta $PORT (10000) y el entrypoint lo aplica.
# ASPNETCORE_URLS base = 5000 para ejecución local del contenedor.
ENV DOTNET_RUNNING_IN_CONTAINER=true \
    ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://+:5000 \
    PORT=5000

EXPOSE 5000

# Usuario no-root (la imagen aspnet no trae "appuser").
RUN groupadd --gid 1001 appuser \
 && useradd --uid 1001 --gid 1001 --create-home --shell /usr/sbin/nologin appuser

COPY --from=builder --chown=appuser:appuser /app/publish /app

USER appuser

# $PORT lo define Render en runtime; si no existe se usa 5000.
# Se limpia ASPNETCORE_HTTP_PORTS (8080 por defecto en la imagen base) para que
# ASPNETCORE_URLS sea la única fuente de verdad del puerto.
# "exec" mantiene a dotnet como PID 1 para recibir SIGTERM (apagado limpio).
ENTRYPOINT ["sh", "-c", "export ASPNETCORE_URLS=\"http://+:${PORT:-5000}\"; unset ASPNETCORE_HTTP_PORTS; exec dotnet ChemLab.API.dll"]
