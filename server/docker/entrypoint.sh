#!/bin/sh
set -eu

TZ="${TZ:-America/Los_Angeles}"
export TZ
if [ -f "/usr/share/zoneinfo/$TZ" ]; then
  ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime
  echo "$TZ" > /etc/timezone
fi
printf 'date.timezone=%s\n' "$TZ" > /etc/php/8.3/apache2/conf.d/99-timezone.ini

mkdir -p /var/run/apache2 /var/lock/apache2 /var/share/lan-drive

if [ ! -f /var/www/html/vendor/autoload.php ]; then
  composer install --no-dev --no-interaction --working-dir=/var/www/html
fi

cat > /etc/apache2/conf-enabled/db-env.conf <<EOF
SetEnv TZ ${TZ}
SetEnv DB_HOST ${DB_HOST:-localhost}
SetEnv DB_NAME ${DB_NAME:-photo_album}
SetEnv DB_USER ${DB_USER:-root}
SetEnv DB_PASSWORD ${DB_PASSWORD:-20011210}
EOF

exec apache2ctl -D FOREGROUND
