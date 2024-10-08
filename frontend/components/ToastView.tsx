import { ToastBar, Toaster } from "react-hot-toast";

export default function ToastView() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3_000,
        style: {
          flexDirection: "row-reverse",
          background: "#363636",
          color: "#fff",
          fontSize: "16pt",
        },
        loading: {
          duration: Infinity,
        },
        success: {
          duration: 2_000,
        },
        error: {
          duration: 4_000,
        },
      }}
    >
      {(t) => (
        <div className={t.visible ? "animate-toast-in" : "animate-toast-out"}>
          <ToastBar toast={t} />
        </div>
      )}
    </Toaster>
  );
}
