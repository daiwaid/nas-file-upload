FROM ubuntu:24.04 AS uhdr

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates git cmake ninja-build clang libjpeg-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

RUN git clone --depth 1 https://github.com/google/libultrahdr.git /src/libultrahdr \
    && cmake -G Ninja -S /src/libultrahdr -B /src/uhdr-build -DUHDR_BUILD_DEPS=1 \
    && cmake --build /src/uhdr-build \
    && cmake --install /src/uhdr-build --prefix /uhdr-install \
    && mkdir -p /uhdr-install/bin \
    && find /src/uhdr-build -name ultrahdr_app -type f -exec cp {} /uhdr-install/bin/ \;


FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    APACHE_RUN_USER=www-data \
    APACHE_RUN_GROUP=www-data \
    APACHE_PID_FILE=/var/run/apache2/apache2.pid \
    APACHE_RUN_DIR=/var/run/apache2 \
    APACHE_LOCK_DIR=/var/lock/apache2 \
    APACHE_LOG_DIR=/var/log/apache2 \
    LANG=C.UTF-8

RUN apt-get update && apt-get install -y --no-install-recommends \
        apache2 libapache2-mod-php php php-cli php-mysql php-gd php-xml \
        php-mbstring php-curl php-zip php-exif \
        libheif-examples libheif-plugin-libde265 libde265-0 libavif-bin \
        ffmpeg libimage-exiftool-perl python3 \
        composer ca-certificates curl \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

COPY --from=uhdr /uhdr-install/ /usr/local/
RUN ldconfig && mkdir -p /var/share/lan-drive /var/run/apache2 /var/lock/apache2

COPY docker/php.ini /etc/php/8.3/apache2/conf.d/99-album.ini
COPY docker/lan-drive.conf /etc/apache2/conf-available/lan-drive.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh \
    && a2enconf lan-drive

WORKDIR /var/www/html
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist
COPY . /var/www/html/
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
