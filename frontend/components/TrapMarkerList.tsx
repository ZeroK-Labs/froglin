import { MapCoordinates } from "common/types";
import { TrapMarker } from "frontend/components";

type Props = {
  traps: MapCoordinates[];
  duplicateIndex: number | null;
};

export default function TrapMarkerList(props: Props) {
  return (
    <>
      {props.traps.map((point, index) => (
        <TrapMarker
          key={"T" + index}
          ordinal={index + 1}
          location={point}
          duplicate={props.duplicateIndex === index}
        />
      ))}
    </>
  );
}
