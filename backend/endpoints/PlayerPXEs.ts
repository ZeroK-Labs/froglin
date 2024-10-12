import { Request, Response } from "express";

import { CLIENT_SESSION_DATA } from "backend/start";

export function getPlayerPXEs(req: Request, res: Response) {
  const player_data = Object.values(CLIENT_SESSION_DATA);

  if (!player_data) return;

  const PXEs = [];
  for (const player of player_data) {
    if (!(player.PXE && player.PXE.url)) continue;

    PXEs.push(player.PXE.url);
  }

  res.statusCode = 200;
  res.json(PXEs);
}
