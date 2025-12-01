FROM postgres:16-alpine

WORKDIR /app

COPY sql/ /app/sql/
COPY migrate.sh /app/migrate.sh

RUN chmod +x /app/migrate.sh

CMD ["/app/migrate.sh"]
