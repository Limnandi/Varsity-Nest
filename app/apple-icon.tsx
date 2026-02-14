import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
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
            "radial-gradient(180px 180px at 35% 30%, rgba(59,130,246,0.55), rgba(2,6,23,0) 60%), radial-gradient(180px 180px at 70% 75%, rgba(168,85,247,0.45), rgba(2,6,23,0) 55%), linear-gradient(135deg, #02042b 0%, #040945 55%, #02042b 100%)",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.10)",
            border: "2px solid rgba(255,255,255,0.18)",
            color: "white",
            fontSize: 58,
            fontWeight: 900,
            letterSpacing: -2,
          }}
        >
          VN
        </div>
      </div>
    ),
    size,
  );
}

