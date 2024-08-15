import { InterestPoint } from "common/types";
import BaseMarker from "./BaseMarker";

type Props = {
  point: InterestPoint;
};

export default function InterestPointMarker(props: Props) {
  return (
    <BaseMarker
      coordinates={props.point.coordinates}
      visible={props.point.visible}
      message="A froglin?! My flute will reveal it!"
      imageSrc="/images/froglin1.png"
      imageWidth="28px"
      imageHeight="28px"
    />
  );
}
