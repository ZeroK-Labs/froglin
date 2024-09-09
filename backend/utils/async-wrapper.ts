import { NextFunction, Request, Response } from "express";

interface AsyncRequestHandler {
  (req: Request, res: Response, next: NextFunction): Promise<void | Response>;
}

export const asyncHandler =
  (handler: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
