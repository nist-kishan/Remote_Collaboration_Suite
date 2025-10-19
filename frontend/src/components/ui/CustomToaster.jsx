import { Toaster } from "react-hot-toast";

export default function CustomToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "linear-gradient(15deg, #8a0651 0%, #ff7eb3 100%)",
          color: "white",
          borderRadius: "12px",
          padding: "16px 20px",
          fontSize: "14px",
          fontWeight: "500",
          border: "1px solid rgba(255,255,255,0.15)",
          minHeight: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        },
        className: "shadow-lg backdrop-blur-md",
        success: {
          iconTheme: {
            primary: "#ffb3d6",
            secondary: "#8a0651",
          },
        },
        error: {
          iconTheme: {
            primary: "#ffd1e8",
            secondary: "#570029",
          },
        },
      }}
      containerStyle={{
        zIndex: 9999,
        top: "10px",
        width: "auto",
        maxWidth: "400px",
      }}
    />
  );
}
