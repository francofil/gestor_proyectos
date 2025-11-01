#!/bin/bash
set -e

echo "🔧 Configurando PostgreSQL Master para replicación..."

# Crear usuario de replicación
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'replicator') THEN
            CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'replicator1234';
        END IF;
    END
    \$\$;
EOSQL

# Configurar pg_hba.conf para permitir replicación
cat >> "$PGDATA/pg_hba.conf" <<EOF

# Permitir replicación
host    replication     replicator      all                     md5
host    all             all             all                     md5
EOF

echo "✅ Master configurado correctamente"
