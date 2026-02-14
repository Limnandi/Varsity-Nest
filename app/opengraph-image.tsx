import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "radial-gradient(1200px 630px at 20% 20%, rgba(59,130,246,0.35), rgba(2,6,23,0) 60%), radial-gradient(1000px 630px at 80% 60%, rgba(168,85,247,0.30), rgba(2,6,23,0) 55%), linear-gradient(135deg, #02042b 0%, #040945 55%, #02042b 100%)",
          color: "white",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.20)",
              boxShadow: "0 18px 60px rgba(37, 99, 235, 0.25)",
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: -1,
            }}
          >
            VN
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: -0.6,
                opacity: 0.95,
              }}
            >
              Varsity Nest
            </div>
            <div style={{ fontSize: 18, opacity: 0.80 }}>
              varsitynest.space
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 64,
              lineHeight: 1.05,
              letterSpacing: -1.2,
              fontWeight: 800,
              maxWidth: 980,
            }}
          >
            Find &amp; List Student Housing &amp; Accommodation
          </div>
          <div style={{ fontSize: 26, opacity: 0.85, maxWidth: 980 }}>
            Connecting students with trusted agents and providers in South Africa.
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
            {["Student Accommodation", "Off-campus Housing", "Trusted Providers"].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    fontSize: 18,
                    background: "rgba(0,0,0,0.20)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    opacity: 0.95,
                  }}
                >
                  {label}
                </div>
              ),
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            opacity: 0.9,
          }}
        >
          <div style={{ fontSize: 18 }}>
            South Africa • Universities &amp; Colleges
          </div>
          <div style={{ fontSize: 18 }}>varsitynest.space</div>
        </div>
      </div>
    ),
    size,
  );
}

