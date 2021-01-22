const listProperties = async (pool, readModelName) => {
  const { schemaName, escapeId, escapeStr, inlineLedgerExecuteStatement } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)

  const rows = await inlineLedgerExecuteStatement(
    pool,
    `SELECT "Properties"
     FROM  ${databaseNameAsId}.${ledgerTableNameAsId}
     WHERE "EventSubscriber" = ${escapeStr(readModelName)}
    `
  )

  if (rows.length === 1) {
    return rows[0].Properties != null ? JSON.parse(rows[0].Properties) : null
  } else {
    return null
  }
}

export default listProperties
