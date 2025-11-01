#!/bin/bash
set -e

echo "===== INICIANDO CONFIGURACIÃ“N DE REPLICA ====="

# Esperar a que el master estÃ© completamente listo
echo "Esperando al master..."
until pg_isready -h db-master -p 5432 -U "$POSTGRES_USER"; do
  echo "Master aÃºn no estÃ¡ listo, esperando..."
  sleep 3
done

echo "Master estÃ¡ listo. Esperando 5 segundos adicionales..."
sleep 5

# Detener PostgreSQL si estÃ¡ corriendo
echo "Deteniendo PostgreSQL temporal..."
pg_ctl -D "$PGDATA" stop -m fast || true
sleep 2

# Limpiar el directorio de datos
echo "Limpiando directorio de datos..."
rm -rf "$PGDATA"/*

# Realizar backup base desde el master
echo "Realizando pg_basebackup desde master..."
PGPASSWORD="$POSTGRES_PASSWORD" pg_basebackup -h db-master -p 5432 -D "$PGDATA" -U replicator -v -P -R --checkpoint=fast

# Verificar que se creÃ³ correctamente
if [ ! -f "$PGDATA/postgresql.conf" ]; then
  echo "ERROR: pg_basebackup fallÃ³"
  exit 1
fi

echo "pg_basebackup completado exitosamente"

# Configurar modo de solo lectura en postgresql.conf
echo "Configurando modo de solo lectura..."
cat >> "$PGDATA/postgresql.conf" << EOF

# ==== CONFIGURACIÃ“N DE REPLICA ====
default_transaction_read_only = on
hot_standby = on
log_statement = all
log_destination = stderr
logging_collector = off
EOF

echo "===== REPLICA CONFIGURADA CORRECTAMENTE ====="
