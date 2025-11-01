#!/bin/bash
set -e

echo "===== CONFIGURANDO POSTGRESQL MASTER ====="

# Crear usuario de replicación
echo "Creando usuario de replicación..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'replicator') THEN
            CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD '$POSTGRES_PASSWORD';
            RAISE NOTICE 'Usuario replicator creado';
        ELSE
            RAISE NOTICE 'Usuario replicator ya existe';
        END IF;
    END
    \$\$;
EOSQL

# Configurar pg_hba.conf para permitir conexiones de réplica
echo "Configurando pg_hba.conf..."
echo "host replication replicator all md5" >> "$PGDATA/pg_hba.conf"
echo "host all all all md5" >> "$PGDATA/pg_hba.conf"

# Recargar configuración
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT pg_reload_conf();
EOSQL

echo "===== MASTER CONFIGURADO CORRECTAMENTE ====="
