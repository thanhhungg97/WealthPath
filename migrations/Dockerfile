FROM flyway/flyway:10-alpine

# Copy SQL migrations
COPY sql/ /flyway/sql/

# Flyway will use environment variables:
# FLYWAY_URL, FLYWAY_USER, FLYWAY_PASSWORD

ENTRYPOINT ["flyway", "migrate"]
