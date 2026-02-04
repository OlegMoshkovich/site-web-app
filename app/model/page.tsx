"use client";

export default function ModelPage() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      {/* Model Viewer Section - Full screen on mobile */}
      <div className="w-full h-full">
        <iframe
          title="Speckle"
          src="https://app.speckle.systems/projects/788f7f5aab/models/6442f853fd?embedToken=a9b27a5668f2032119bd5d938d953d4a2268832aba#embed=%7B%22isEnabled%22%3Atrue%7D"
          width="100%"
          height="100%"
          frameBorder="0"
          className="w-full h-full"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
