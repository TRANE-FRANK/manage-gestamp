import { BusinessError } from "./BusinessError";

export class ConflictError extends BusinessError {
  constructor(message: string) {
    super(message, 409);
  }
}
