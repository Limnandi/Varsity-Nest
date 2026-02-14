import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(512px 512px at 35% 30%, rgba(59,130,246,0.55), rgba(2,6,23,0) 60%), radial-gradient(512px 512px at 70% 75%, rgba(168,85,247,0.45), rgba(2,6,23,0) 55%), linear-gradient(135deg, #02042b 0%, #040945 55%, #02042b 100%)",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
        }}
      >
        <div
          style={{
            width: 380,
            height: 380,
            borderRadius: 96,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.10)",
            border: "2px solid rgba(255,255,255,0.18)",
            boxShadow: "0 40px 120px rgba(37, 99, 235, 0.30)",
            color: "white",
            fontSize: 168,
            fontWeight: 900,
            letterSpacing: -6,
          }}
        >
          VN
        </div>
      </div>
    ),
    size,
  );
}

