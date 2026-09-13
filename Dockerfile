FROM node:20-bookworm-slim AS frontend

WORKDIR /frontend
COPY package.json package-lock.json ./
RUN npm ci
COPY next.config.js tsconfig.json next-env.d.ts .eslintrc.json ./
COPY src ./src
ENV NEXT_PUBLIC_API_BASE=
RUN npm run build


FROM ubuntu:24.04 AS uhdr

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates git cmake ninja-build clang g++ libjpeg-dev pkg-config \
        libaom-dev libpng-dev zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

RUN git clone --depth 1 https://github.com/google/libultrahdr.git /src/libultrahdr \
    && cmake -G Ninja -S /src/libultrahdr -B /src/uhdr-build \
        -DUHDR_BUILD_DEPS=1 -DUHDR_ENABLE_HEIF=OFF \
    && cmake --build /src/uhdr-build \
    && cmake --install /src/uhdr-build --prefix /uhdr-install \
    && mkdir -p /uhdr-install/bin \
    && find /src/uhdr-build -name ultrahdr_app -type f -exec cp {} /uhdr-install/bin/ \;

RUN git clone --depth 1 --branch v1.4.2 https://github.com/AOMediaCodec/libavif.git /src/libavif \
    && cmake -G Ninja -S /src/libavif -B /src/avif-build \
        -DCMAKE_BUILD_TYPE=Release \
        -DAVIF_BUILD_APPS=ON \
        -DAVIF_CODEC_AOM=SYSTEM \
        -DAVIF_LIBYUV=LOCAL \
    && cmake --build /src/avif-build \
    && cmake --install /src/avif-build --prefix /uhdr-install


FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    APACHE_RUN_USER=www-data \
    APACHE_RUN_GROUP=www-data \
    APACHE_PID_FILE=/var/run/apache2/apache2.pid \
    APACHE_RUN_DIR=/var/run/apache2 \
    APACHE_LOCK_DIR=/var/lock/apache2 \
    APACHE_LOG_DIR=/var/log/apache2 \
    LANG=C.UTF-8 \
    TZ=America/Los_Angeles

RUN apt-get update && apt-get install -y --no-install-recommends \
        apache2 libapache2-mod-php php php-cli php-mysql php-gd php-xml \
        php-mbstring php-curl php-zip php-exif \
        libheif-examples libheif-plugin-libde265 libde265-0 libavif-bin \
        ffmpeg libimage-exiftool-perl python3 cifs-utils \
        composer ca-certificates curl tzdata \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

COPY --from=uhdr /uhdr-install/ /usr/local/
RUN ldconfig && mkdir -p /var/share/lan-drive /var/run/apache2 /var/lock/apache2

COPY server/docker/php.ini /etc/php/8.3/apache2/conf.d/99-album.ini
COPY server/docker/lan-drive.conf /etc/apache2/conf-available/lan-drive.conf
COPY server/docker/entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh \
    && a2enconf lan-drive

WORKDIR /var/www/html
COPY server/composer.json server/composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist
COPY --from=frontend /frontend/out/ /var/www/html/
COPY server/process.php server/serve.php server/remove.php server/db.php server/pack_rgba1010102.py /var/www/html/
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
