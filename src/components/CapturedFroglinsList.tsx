export default function CapturedFroglinsList({ count = 0 }: { count: number }) {
  return (
    <div className="absolute top-20 mx-10 z-10 flex flex-row">
      {Array.from({ length: count }).map((index) => (
        <img
          src="/images/froglin2.png"
          width="30px"
          height="30px"
          alt=""
        />
      ))}
    </div>
  );
}
