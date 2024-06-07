import { useState } from "react";
import { Marker } from "react-map-gl";
import MapCoordinates from "types/MapCoordinates";

type Props = {
  location: MapCoordinates;
};

export default function PlayerMarker(props: Props) {
  const [open, setOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<number | null>(null);
  const handleIconClick = (index: number) => {
    if (selected === index) {
      setSelected(null);
    } else {
      setSelected(index);
    }
  };
  const pictures = [
    "/images/flute.png",
    "/images/net.png",
    "/images/witch-hat.png",
    "/images/scroll.png",
    "/images/shoe.png",
  ];
  if (!location) return null;

  return (
    <Marker
      longitude={props.location.longitude}
      latitude={props.location.latitude}
      style={{ zIndex: 1000 }}
    >
      <div className="relative h-[40px] rounded-full flex justify-center z-10">
        {!open ? (
          <div className="absolute -top-4 text-white text-[9px] whitespace-nowrap bg-purple-900 px-2 leading-3 tracking-wider z-20">
            Jules Verne
          </div>
        ) : null}

        <div
          onClick={() => setOpen(!open)}
          className={`z-50`}
        >
          <img
            className="rounded-full"
            src="/images/profilePic.webp"
            width={`${open ? 50 : 40}`}
            height={`${open ? 50 : 40}`}
            alt=""
          />
        </div>
        {open && (
          <div className="absolute inset-0 flex items-center justify-center opacity-90">
            <div className="absolute flex items-center justify-center w-60 h-60 rounded-full border-2 bg-green-500">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                {pictures.map((el, index) => {
                  const angle = (index / pictures.length) * 360;
                  const transform = `translate(-50%, -50%) rotate(${angle}deg) translate(18vw) rotate(-${angle}deg)`;
                  const isSelected = index === selected;
                  return (
                    <div
                      key={index}
                      className="absolute w-12 h-12"
                      style={{
                        transform,
                        border: isSelected ? "2px solid orange" : "",
                        boxShadow: isSelected ? "0 0 8px 3px #ffa500" : "",
                        transformOrigin: "center center",
                        transition: "all 0.3s",
                        scale: isSelected ? 1.2 : 1,
                      }}
                      onClick={() => handleIconClick(index)}
                    >
                      <img
                        src={el}
                        className="w-full h-full"
                        alt={`icon-${index}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </Marker>
  );
}
