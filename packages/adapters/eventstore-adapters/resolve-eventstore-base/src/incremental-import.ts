const incrementalImport = async (pool: any, events: any): Promise<void> => {
  try {
    const importId = await pool.beginIncrementalImport()
    await pool.pushIncrementalImport(events, importId)
    await pool.commitIncrementalImport(importId)
  } catch (error) {
    await pool.rollbackIncrementalImport()
    throw error
  }
}

export default incrementalImport
