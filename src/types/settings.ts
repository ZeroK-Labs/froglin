type CameraSettings = {
  readonly PITCH: number;
  readonly BEARING: number;
  readonly ZOOM: number;
};

export type ViewSettings = {
  /**
   * Camera view settings for the playground view mode
   */
  readonly PLAYGROUND: CameraSettings;
  /**
   * Camera view settings for the playground view mode
   */
  readonly EVENT: CameraSettings;
  /**
   * Application fade-in after load transition animation duration (miliseconds)
   */
  readonly LOAD_FADE_ANIMATION_DURATION: number;
  /**
   * Initial (first fly in) transition animation duration (miliseconds)
   */
  readonly FIRST_FLIGHT_ANIMATION_DURATION: number;
  /**
   * View mode swith transition animation duration (milliseconds)
   */
  readonly VIEW_ANIMATION_DURATION: number;
  /**
   * GPS location change follow-up fly-to animation duration (miliseconds)
   */
  readonly LOCATION_FOLLOW_ANIMATION_DURATION: number;
  /**
   * GPS location change follow-up fly-to animation delay (miliseconds)
   */
  readonly LOCATION_FOLLOW_ANIMATION_DELAY: number;
  /**
   * Tutorial fade transition animation duration (miliseconds)
   */
  readonly TUTORIAL_FADE_ANIMATION_DURATION: number;
  /**
   * Line menu popup list fade animation duration (miliseconds)
   */
  readonly LINE_MENU_FADE_ANIMATION_DURATION: number;
};

/**
 * The values of two squares' sides, expressing concentric bounds, used in coordinate generation
 * +- - - - - -+ <-- TO
 * |           |
 * |   + - + <-- FROM
 * |   |   |   |
 * |   + - +   |
 * |           |
 * +- - - - - -+
 */
export type PointGenerationRange = {
  readonly FROM: number;
  readonly TO: number;
};

export type EventSettings = {
  /**
   * Number of epochs for the event
   */
  readonly EPOCH_COUNT: number;
  /**
   * Duration of an epoch (miliseconds)
   */
  readonly EPOCH_DURATION: number;
  /**
   * The length of a side in the (square) bounding box (meters)
   */
  readonly BOUNDS_SIDE_LENGTH: number;
  /**
   * Starting number of interest points for the event
   */
  readonly MARKER_COUNT: number;
  /**
   * The bounds of coordinates very close to the player (meters)
   */
  readonly CLOSE_RANGE: PointGenerationRange;
  /**
   * The bounds of coordinates in the neighbourhood of the player (meters)
   */
  readonly NEAR_RANGE: PointGenerationRange;
  /**
   * The bounds of coordinates far away from the player (meters)
   */
  readonly FAR_RANGE: PointGenerationRange;
};

type TrapMarkerSettings = {
  /**
   * The text to display when a trap is placed in the same location as a previous one
   */
  readonly DUPLICATE_TEXT: string;
  /**
   * Duration to display the duplication text (miliseconds)
   */
  readonly DUPLICATE_TEXT_TIMEOUT: number;
};

export type RevealSettings = {
  /**
   * Flute reveal radius (meters)
   */
  readonly RADIUS: number;
  /**
   * Color of revelealing circle's inner fill
   */
  readonly FILL: string;
  /**
   * Color of revelealing circle's outline
   */
  readonly OUTLINE: string;
};

export type PlayerSettings = {
  /**
   * Settings associated to reveal mechanics and visuals
   */
  readonly REVEAL: RevealSettings;
  /**
   * Movement capture radius (meters)
   */
  readonly CAPTURE_RADIUS: number;
  /**
   * Trap related settings
   */
  readonly TRAP: TrapMarkerSettings;
};

type MarkerSettings = {
  /**
   * Fade animation duration (miliseconds)
   */
  readonly TRANSITION_DURATION: number;
  /**
   * Popup message visible period (miliseconds)
   */
  readonly MESSAGE_TIMEOUT: number;
};

export type FroglinSettings = {
  /**
   * Settings for the map marker
   */
  readonly MARKER: MarkerSettings;
};

type DeviceLocationSettings = {
  /**
   * Browser navigator request options
   */
  readonly GPS_OPTIONS: PositionOptions;
  /**
   * Inactive timeout duration (miliseconds)
   */
  readonly SESSION_DURATION: number;
};

type KeyboardLocationSettings = {
  /**
   * Flute reveal radius
   */
  readonly GPS_OPTIONS: PositionOptions;
  /**
   * Duration between two polls of keyboard state (miliseconds)
   */
  readonly POLL_TIMEOUT: number;
  /**
   * The displacement one polling call can produce on the location (meters)
   */
  readonly OFFSET: number;
};

export type LocationSettings = {
  /**
   * Device related location settings
   */
  readonly DEVICE: DeviceLocationSettings;
  /**
   * Keyboard related location settings
   */
  readonly KEYBOARD: KeyboardLocationSettings;
};
