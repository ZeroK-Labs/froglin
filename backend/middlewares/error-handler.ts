import { Request, Response } from "express";

export const errorHandler = (error: Error, req: Request, res: Response) => {
  console.error(error.message);

  return res.status(500).json({
    success: false,
    message: error.message,
  });
};
