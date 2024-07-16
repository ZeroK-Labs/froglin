import { Request, Response } from "express";

export function getLeaderboard(req: Request, res: Response) {
  res.setHeader("content-type", "text/json");
  res.json([
    { username: "John very long name indeeed so long", froglins: 100 },
    { username: "Jane", froglins: 200 },
    { username: "Doe", froglins: 300 },
  ]);
}
