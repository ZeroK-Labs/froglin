import { useState } from "react";
import SignIn from "./SignIn";
import { usePXEClient } from "stores";

export default function SignInScreen() {
  const [viewSignIn, setViewSignIn] = useState(false);
  const { connected } = usePXEClient();
  return (
    <>
      {viewSignIn ? <SignIn setViewSignIn={setViewSignIn} /> : null}
      <div className="fixed bottom-20 right-12">
        <button
          type="button"
          className={`rounded-md px-2.5 py-2 text-sm font-semibold shadow-sm bg-indigo-500 text-white`}
          onClick={() => setViewSignIn(!viewSignIn)}
        >
          Sign In
        </button>
      </div>
      <div
        className={`z-[9998] fixed bottom-2 right-2 text-sm ${connected ? "" : "animate-fade-in-out"}`}
      >
        {connected ? "✅" : "🟥"}
      </div>
    </>
  );
}
