export function getPaginationParams(query: {
  page?: unknown;
  limit?: unknown;
}): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(query.limit ?? "20"), 10) || 20),
  );
  return { page, limit, offset: (page - 1) * limit };
}
