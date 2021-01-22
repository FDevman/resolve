const getProperty = async (pool, readModelName, key) => {
  const {
    PassthroughError,
    fullJitter,
    inlineLedgerRunQuery,
    tablePrefix,
    escapeId,
    escapeStr,
  } = pool
  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
  for (let retry = 0; ; retry++) {
    try {
      const rows = await inlineLedgerRunQuery(
        `SELECT json_extract("Properties", ${escapeStr(
          `$.${key
            .replace(/\u001a/g, '\u001a0')
            .replace(/"/g, '\u001a1')
            .replace(/\./g, '\u001a2')}`
        )}) AS "Value"
         FROM  ${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escapeStr(readModelName)}
        `
      )

      if (rows.length === 1 && rows[0].Value != null) {
        return rows[0].Value
      } else {
        return null
      }
    } catch (error) {
      if (!(error instanceof PassthroughError)) {
        throw error
      }

      await fullJitter(retry)
    }
  }
}

export default getProperty
