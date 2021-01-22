const findOne = async (
  {
    runQuery,
    escapeId,
    escapeStr,
    tablePrefix,
    searchToWhereExpression,
    makeNestedPath,
    convertResultRow,
    schemaName,
  },
  readModelName,
  tableName,
  searchExpression,
  fieldList
) => {
  const searchExpr = searchToWhereExpression(
    searchExpression,
    escapeId,
    escapeStr,
    makeNestedPath
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const rows = await runQuery(
    `SELECT * FROM ${escapeId(schemaName)}.${escapeId(
      `${tablePrefix}${tableName}`
    )}
    ${inlineSearchExpr}
    OFFSET 0
    LIMIT 1;`
  )

  if (Array.isArray(rows) && rows.length > 0) {
    return convertResultRow(rows[0], fieldList)
  }

  return null
}

export default findOne
