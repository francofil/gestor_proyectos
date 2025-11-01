#!/bin/bash
set -e

# Configurar el master para replicación
echo "Configurando PostgreSQL Master para replicación..."

# Crear usuario de replicación
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD '$POSTGRES_PASSWORD';
EOSQL

# Configurar pg_hba.conf para permitir conexiones de réplica
echo "host replication replicator all md5" >> "$PGDATA/pg_hba.conf"

echo "Master configurado correctamente"
