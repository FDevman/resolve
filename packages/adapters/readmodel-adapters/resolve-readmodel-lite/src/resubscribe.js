const resubscribe = async (pool, readModelName, eventTypes, aggregateIds) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    dropReadModel,
    tablePrefix,
    fullJitter,
    escapeId,
    escape,
  } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

  while (true) {
    try {
      await inlineLedgerRunQuery(
        `BEGIN IMMEDIATE;
        CREATE TABLE IF NOT EXISTS ${ledgerTableNameAsId}(
          "EventSubscriber" VARCHAR(190) NOT NULL,
          "IsPaused" TINYINT NOT NULL,
          "EventTypes" JSON NOT NULL,
          "AggregateIds" JSON NOT NULL,
          "XaKey" VARCHAR(190) NULL,
          "Cursor" JSON NULL,
          "SuccessEvent" JSON NULL,
          "FailedEvent" JSON NULL,
          "Errors" JSON NULL,
          "Properties" JSON NOT NULL,
          "Schema" JSON NULL,
          PRIMARY KEY("EventSubscriber")
        );
        COMMIT;
      `,
        true
      )

      break
    } catch (error) {
      try {
        await inlineLedgerRunQuery(`ROLLBACK;`, true)
      } catch (e) {}

      if (/^SQLITE_ERROR:.*? already exists$/.test(error.message)) {
        break
      }
    }
  }

  while (true) {
    try {
      await inlineLedgerRunQuery(
        `
        BEGIN IMMEDIATE;

        UPDATE ${ledgerTableNameAsId}
        SET "Cursor" = NULL,
        "SuccessEvent" = NULL,
        "FailedEvent" = NULL,
        "Errors" = NULL,
        "IsPaused" = 1
        WHERE "EventSubscriber" = ${escape(readModelName)};

        COMMIT;
      `,
        true
      )

      break
    } catch (error) {
      if (!(error instanceof PassthroughError)) {
        throw error
      }

      try {
        await inlineLedgerRunQuery(`ROLLBACK`, true)
      } catch (err) {
        if (!(err instanceof PassthroughError)) {
          throw err
        }
      }

      await fullJitter(0)
    }
  }

  await dropReadModel(pool, readModelName)

  while (true) {
    try {
      await inlineLedgerRunQuery(
        `
        BEGIN IMMEDIATE;

        INSERT OR REPLACE INTO ${ledgerTableNameAsId}(
          "EventSubscriber", "EventTypes", "AggregateIds", "IsPaused", "Properties",
          "XaKey", "Cursor", "SuccessEvent", "FailedEvent", "Errors"
        ) VALUES (
           ${escape(readModelName)},
           ${
             eventTypes != null
               ? escape(JSON.stringify(eventTypes))
               : escape('null')
           },
           ${
             aggregateIds != null
               ? escape(JSON.stringify(aggregateIds))
               : escape('null')
           },
           COALESCE(
            (SELECT "IsPaused" FROM ${ledgerTableNameAsId}
            WHERE "EventSubscriber" = ${escape(readModelName)}),
            0
          ),
          COALESCE(
           (SELECT "Properties" FROM ${ledgerTableNameAsId}
           WHERE "EventSubscriber" = ${escape(readModelName)}),
           JSON('{}')
          ),
          (SELECT "XaKey" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escape(readModelName)}),
          (SELECT "Cursor" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escape(readModelName)}),
          (SELECT "SuccessEvent" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escape(readModelName)}),
          (SELECT "FailedEvent" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escape(readModelName)}),
          (SELECT "Errors" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escape(readModelName)})
        );

        COMMIT;
      `,
        true
      )
      break
    } catch (error) {
      if (!(error instanceof PassthroughError)) {
        throw error
      }

      try {
        await inlineLedgerRunQuery(`ROLLBACK`, true)
      } catch (err) {
        if (!(err instanceof PassthroughError)) {
          throw err
        }
      }

      await fullJitter(0)
    }
  }
}

export default resubscribe
