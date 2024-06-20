import { PXEConnectionTracker } from "components";

export function Home() {
  return (
    <>
      <div className="absolute left-0 top-0 w-full h-[20%]">
        <img
          src="/images/cover.png"
          alt="Cover Image"
          width={1786}
          height={945}
          sizes="100vw"
          style={{
            objectFit: "cover",
            objectPosition: "bottom",
            width: "100%",
            height: "100%",
          }}
        />
      </div>

      <div className="fixed inset-0 h-full w-full flex items-center justify-center">
        <div className="relative min-w-[440px] max-w-[680px] h-[420px] border-4 m-10 p-8 flex flex-col justify-between border-white">
          <h1 className="p-4 text-xl font-bold rounded self-center text-center bg-white text-black shadow-lg">
            Welcome to Froglin!
          </h1>

          <p className="text-center">
            Your profile, game data, and assets are encrypted and stored privately in
            Aztec’s L2 sandbox blockchain.
          </p>
          <p className="text-center">
            They can be decrypted only by you, using a private key.
          </p>

          <button className="bg-blue-500 text-white font-bold py-2 px-4 rounded self-center">
            Enter
          </button>

          <PXEConnectionTracker />
        </div>

        <div className="absolute bottom-0 min-w-[480px] w-full flex">
          <div className="absolute bottom-[10px] left-0 p-4 flex items-center">
            <img
              src="/images/Aztec-logo.png"
              alt="Aztec Logo"
              width={128}
              height={33}
            />
            <p className="ml-2 mt-[7px] text-xs text-center">infrastructure</p>
          </div>

          <div className="absolute bottom-0 right-0 p-4 flex items-center">
            <p className="mr-2 text-xs text-center">Built with love by</p>
            <img
              src="/images/ZeroK-Labs-logo.png"
              alt="ZeroK-Labs Logo"
              width={48}
              height={48}
            />
          </div>
        </div>
      </div>
    </>
  );
}
