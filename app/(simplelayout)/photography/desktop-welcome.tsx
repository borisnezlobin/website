"use client";

export default function DesktopWelcome() {
  return (
    <div
      className="select-none pointer-events-none"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: "translate(-50%, -50%)",
        textAlign: "center",
      }}
    >
      <h2
        className="!text-primary dark:!text-primary-dark"
        style={{ fontFamily: "Vectra", fontSize: 120, lineHeight: 1, whiteSpace: "nowrap" }}
      >
        Photography
      </h2>
      <p className="mt-5 text-[11px] uppercase tracking-[0.35em] text-muted dark:text-muted-dark">
        Drag to move · Click any image to view
      </p>
    </div>
  );
}
