#!/bin/bash
set -e

echo "🔄 Configurando PostgreSQL Replica..."

# Esperar a que el master esté disponible
echo "⏳ Esperando a que el master esté listo..."
until PGPASSWORD=${POSTGRES_PASSWORD} psql -h db-master -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c '\q' 2>/dev/null; do
  echo "   Master no está listo aún, esperando 3 segundos..."
  sleep 3
done
echo "✅ Master está disponible"

# Verificar si ya está configurada la réplica
if [ -f "$PGDATA/standby.signal" ]; then
    echo "ℹ️  La réplica ya está configurada"
    exit 0
fi

# Detener postgres si está corriendo
echo "🛑 Deteniendo PostgreSQL temporal..."
pg_ctl -D "$PGDATA" -m fast -w stop 2>/dev/null || true

# Limpiar datos existentes
echo "🧹 Limpiando datos existentes..."
rm -rf "$PGDATA"/*

# Crear backup base desde el master
echo "📦 Creando backup desde master..."
PGPASSWORD=replicator1234 pg_basebackup \
  -h db-master \
  -D "$PGDATA" \
  -U replicator \
  -v \
  -P \
  --wal-method=stream

# Crear archivo de configuración de standby
echo "🔗 Configurando como standby (solo lectura)..."
cat > "$PGDATA/standby.signal" <<EOF
standby_mode = 'on'
EOF

# Configurar conexión al master
cat >> "$PGDATA/postgresql.conf" <<EOF

# Configuración de Réplica
primary_conninfo = 'host=db-master port=5432 user=replicator password=replicator1234 application_name=replica1'
hot_standby = on
hot_standby_feedback = on
EOF

echo "✅ Réplica configurada correctamente (SOLO LECTURA)"
