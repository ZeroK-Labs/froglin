import { Request, Response } from "express";

import { BACKEND_WALLET } from "backend/utils/aztec";

export function getGatewayAddress(req: Request, res: Response) {
  res.setHeader("content-type", "text/json");
  res.json(BACKEND_WALLET.contracts.gateway.address.toString());
}
