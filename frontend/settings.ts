import type {
  ViewSettings,
  EventSettings,
  PlayerSettings,
  FroglinSettings,
  LocationSettings,
  PointGenerationRange,
} from "frontend/types/settings";

export const VIEW: ViewSettings = {
  PLAYGROUND: {
    PITCH: 45,
    BEARING: -30,
    ZOOM: 19,
  },
  EVENT: {
    PITCH: 30,
    BEARING: 30,
    ZOOM: 15.25,
  },
  LOAD_FADE_DURATION: 1_000,
  FIRST_FLIGHT_DURATION: 7_000,
  TRANSITION_DURATION: 3_000,
  TUTORIAL_FADE_DURATION: 1_000,
  LINE_MENU_FADE_DURATION: 300,
  LOCATION_FOLLOW_DURATION: 1_000,
  LOCATION_FOLLOW_DELAY: 1_000,
} as const;

const CLOSE_RANGE: PointGenerationRange = {
  FROM: 2,
  TO: 25,
};

const NEAR_RANGE: PointGenerationRange = {
  FROM: CLOSE_RANGE.TO,
  TO: 100,
};

const FAR_RANGE: PointGenerationRange = {
  FROM: NEAR_RANGE.TO,
  TO: 500,
};

export const EVENT: EventSettings = {
  EPOCH_COUNT: 69,
  EPOCH_DURATION: 100_000,
  BOUNDS_SIDE_LENGTH: FAR_RANGE.TO * 2,
  MARKER_COUNT: 100,
  CLOSE_RANGE,
  NEAR_RANGE,
  FAR_RANGE,
} as const;

export const PLAYER: PlayerSettings = {
  REVEAL: {
    RADIUS: 32,
    FILL: "rgb(122, 30, 185)",
    OUTLINE: "green",
  },
  CAPTURE_RADIUS: 5,
  TRAP: {
    DUPLICATE_TEXT: "Already set a trap here",
    DUPLICATE_TEXT_TIMEOUT: 1_000,
  },
} as const;

export const FROGLIN: FroglinSettings = {
  MARKER: {
    TRANSITION_DURATION: 500,
    MESSAGE_TIMEOUT: 3_000,
  },
  TYPE_COUNT: 12,
} as const;

export const LOCATION: LocationSettings = {
  DEVICE: {
    GPS_OPTIONS: {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5_000,
    },
    SESSION_DURATION: 3_000,
  },

  KEYBOARD: {
    GPS_OPTIONS: {
      enableHighAccuracy: false,
      maximumAge: 0,
      timeout: 10_000,
    },
    POLL_TIMEOUT: 500,
    OFFSET: 2,
  },
} as const;
