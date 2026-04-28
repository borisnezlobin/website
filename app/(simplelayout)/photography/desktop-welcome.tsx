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
        className="vectra text-9xl !text-primary dark:!text-primary-dark whitespace-nowrap"
      >
        Photography
      </h2>
      <p className="mt-5 text-sm text-muted dark:text-muted-dark">
        Drag to move · click any image to view
      </p>
    </div>
  );
}
