import { BusinessError } from "./BusinessError";

export class NotFoundError extends BusinessError {
  constructor(message: string) {
    super(message, 404);
  }
}