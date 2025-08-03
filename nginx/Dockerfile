FROM nginx:1.29.0-alpine AS dev
RUN apk update && apk add bash curl
EXPOSE 80 443 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ping || exit 1

#
#
#
#
#

FROM dev AS prod
