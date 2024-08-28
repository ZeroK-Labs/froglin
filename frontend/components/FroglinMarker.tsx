import BaseMarker from "./BaseMarker";
import type { Froglin } from "frontend/types";
import { useGameEvent } from "frontend/stores";

type Props = {
  froglin: Froglin;
};

export default function FroglinMarker(props: Props) {
  const { captureFroglins } = useGameEvent();

  return (
    <BaseMarker
      coordinates={props.froglin.coordinates}
      visible={props.froglin.visible}
      message="Tap here to capture"
      imageSrc={`/images/froglin${props.froglin.type}.webp`}
      imageWidth="36px"
      imageHeight="36px"
      onMessageClick={() => captureFroglins([props.froglin.id])}
    />
  );
}
