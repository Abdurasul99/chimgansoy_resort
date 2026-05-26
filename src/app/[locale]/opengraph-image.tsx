import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#143d2d",
          color: "white",
          padding: "72px",
          fontFamily: "Arial",
        }}
      >
        <div style={{ fontSize: 24, opacity: 0.72 }}>CHIMGANDARBAZA.UZ / CHIMGANDARBAZA.COM</div>
        <div style={{ marginTop: 20, fontSize: 92, fontWeight: 700 }}>CHIMGAN DARBAZA</div>
        <div style={{ marginTop: 24, maxWidth: 760, fontSize: 34, lineHeight: 1.25 }}>
          Mountain resort in Tashkent region
        </div>
      </div>
    ),
    size,
  );
}
