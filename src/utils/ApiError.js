class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    error = [],
    stack = ""
  ) {
    super(message);
    this.status = statusCode;
    this.data = null;
    this.message = message;
    this.sucess = false;
  }
}
export { ApiError };
