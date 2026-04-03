export class ApiError extends Error {
  readonly code: string | null;
  readonly status: number;

  constructor(code: string | null, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
