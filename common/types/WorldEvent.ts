type WorldEvent = {
  name: string;
  coordinates: { lng: number; lat: number };
  conference: string;
  attendance: number;
};

export default WorldEvent;
