export function isMissingTableError(
  error: { code?: string | null; message?: string | null } | null | undefined,
  tableName: string,
) {
  return (
    error?.code === "PGRST205" &&
    Boolean(error.message?.includes(`'public.${tableName}'`))
  );
}

export function isMissingColumnError(
  error: { code?: string | null; message?: string | null } | null | undefined,
  column: string,
) {
  return (
    error?.code === "PGRST204" &&
    Boolean(error.message?.includes(`'${column}' column`))
  );
}
