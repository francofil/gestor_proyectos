#!/bin/bash
set -e

# Esperar a que el master esté listo
echo "Esperando al master..."
until pg_isready -h db-master -U "$POSTGRES_USER"; do
  sleep 2
done

# Detener PostgreSQL si está corriendo
pg_ctl -D "$PGDATA" stop || true

# Limpiar el directorio de datos
rm -rf "$PGDATA"/*

# Realizar backup base desde el master
echo "Realizando pg_basebackup desde master..."
PGPASSWORD="$POSTGRES_PASSWORD" pg_basebackup -h db-master -D "$PGDATA" -U replicator -v -P -W -R

# Configurar modo de solo lectura en postgresql.conf
echo "default_transaction_read_only = on" >> "$PGDATA/postgresql.conf"
echo "hot_standby = on" >> "$PGDATA/postgresql.conf"

# Configurar logging para trackear queries
echo "log_statement = 'all'" >> "$PGDATA/postgresql.conf"
echo "log_destination = 'stderr'" >> "$PGDATA/postgresql.conf"
echo "logging_collector = off" >> "$PGDATA/postgresql.conf"

echo "Replica configurada correctamente como solo lectura con logging habilitado"
