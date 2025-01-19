import { Request, Response } from "express";

import type { WorldEvent } from "common/types";

const events: WorldEvent[] = [
  {
    name: "Lisbon",
    coordinates: { lng: -9.1393, lat: 38.7223 },
    conference: "Web Summit",
    attendance: 71000,
  },
  {
    name: "Singapore",
    coordinates: { lng: 103.8198, lat: 1.3521 },
    conference: "TOKEN2049",
    attendance: 20000,
  },
  {
    name: "Denver",
    coordinates: { lng: -104.9903, lat: 39.7392 },
    conference: "ETHDenver",
    attendance: 15000,
  },
  {
    name: "Abu Dhabi",
    coordinates: { lng: 54.3773, lat: 24.4539 },
    conference: "Blockchain World Abu Dhabi",
    attendance: 5300,
  },
  {
    name: "San Francisco",
    coordinates: { lng: -122.4194, lat: 37.7749 },
    conference: "Crypto Finance Conference",
    attendance: 1500,
  },
  {
    name: "London",
    coordinates: { lng: -0.1276, lat: 51.5074 },
    conference: "Blockchain Expo Global",
    attendance: 8000,
  },
  {
    name: "New York",
    coordinates: { lng: -74.006, lat: 40.7128 },
    conference: "Consensus by CoinDesk",
    attendance: 8000,
  },
  {
    name: "Berlin",
    coordinates: { lng: 13.405, lat: 52.52 },
    conference: "Berlin Blockchain Week",
    attendance: 6000,
  },
  {
    name: "Tokyo",
    coordinates: { lng: 139.6917, lat: 35.6895 },
    conference: "Blockchain Expo Asia",
    attendance: 3000,
  },
  {
    name: "Dubai",
    coordinates: { lng: 55.2708, lat: 25.2048 },
    conference: "World Blockchain Summit",
    attendance: 2500,
  },
  {
    name: "Hong Kong",
    coordinates: { lng: 114.1694, lat: 22.3193 },
    conference: "HK Blockchain Week",
    attendance: 5000,
  },
  {
    name: "Seoul",
    coordinates: { lng: 126.978, lat: 37.5665 },
    conference: "Korea Blockchain Week",
    attendance: 5000,
  },
  {
    name: "Barcelona",
    coordinates: { lng: 2.1734, lat: 41.3818 },
    conference: "Blockchain Summit Barcelona",
    attendance: 3000,
  },
  {
    name: "Austin",
    coordinates: { lng: -97.7431, lat: 30.2672 },
    conference: "ETHAustin",
    attendance: 3000,
  },
  {
    name: "Paris",
    coordinates: { lng: 2.3522, lat: 48.8566 },
    conference: "Paris Blockchain Week Summit",
    attendance: 4000,
  },
  {
    name: "Los Angeles",
    coordinates: { lng: -118.2437, lat: 34.0522 },
    conference: "LA Blockchain Summit",
    attendance: 3000,
  },
  {
    name: "Miami",
    coordinates: { lng: -80.1918, lat: 25.7617 },
    conference: "Bitcoin Conference Miami",
    attendance: 20000,
  },
  {
    name: "Cairo",
    coordinates: { lng: 31.2357, lat: 30.0444 },
    conference: "Blockchain Egypt",
    attendance: 2000,
  },
  {
    name: "Vancouver",
    coordinates: { lng: -123.1216, lat: 49.2827 },
    conference: "Vancouver Blockchain Week",
    attendance: 2000,
  },
  {
    name: "Tel Aviv",
    coordinates: { lng: 34.7818, lat: 32.0853 },
    conference: "Tel Aviv Blockchain Conference",
    attendance: 1500,
  },
  {
    name: "Mumbai",
    coordinates: { lng: 72.8777, lat: 19.076 },
    conference: "Blockchain India",
    attendance: 2500,
  },
  {
    name: "Zurich",
    coordinates: { lng: 8.5417, lat: 47.3769 },
    conference: "Crypto Valley Conference",
    attendance: 1000,
  },
  {
    name: "Shanghai",
    coordinates: { lng: 121.4737, lat: 31.2304 },
    conference: "Blockchain Summit Shanghai",
    attendance: 3000,
  },
  {
    name: "Toronto",
    coordinates: { lng: -79.3832, lat: 43.6532 },
    conference: "Blockchain Futurist Conference",
    attendance: 1500,
  },
  {
    name: "Sydney",
    coordinates: { lng: 151.2093, lat: -33.8688 },
    conference: "Blockchain Week Sydney",
    attendance: 2000,
  },
  {
    name: "Moscow",
    coordinates: { lng: 37.6173, lat: 55.7558 },
    conference: "Blockchain Russia Forum",
    attendance: 1500,
  },
] as const;

export function getWorldEvents(req: Request, res: Response) {
  res.setHeader("content-type", "text/json");

  res.statusCode = 200;
  res.json(events);
}
