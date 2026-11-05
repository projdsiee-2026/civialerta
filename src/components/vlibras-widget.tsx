import { useEffect } from "react";

declare global {
  interface Window {
    VLibras?: { Widget: new (url: string) => unknown };
  }
}

/**
 * VLibras — free Brazilian government tool that translates the page text into Libras
 * with a 3D avatar. The script needs this exact markup in the page.
 */
export function VLibrasWidget() {
  useEffect(() => {
    if (document.getElementById("vlibras-script")) return;
    const script = document.createElement("script");
    script.id = "vlibras-script";
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    script.async = true;
    script.onload = () => {
      if (!window.VLibras) return;
      new window.VLibras.Widget("https://vlibras.gov.br/app");
      // The plugin starts on window "load", which already happened in this app.
      const onload = (window as unknown as { onload?: (() => void) | null }).onload;
      if (typeof onload === "function") onload();
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div {...{ vw: "" }} className="enabled">
      <div {...{ "vw-access-button": "" }} className="active" />
      <div {...{ "vw-plugin-wrapper": "" }}>
        <div className="vw-plugin-top-wrapper" />
      </div>
    </div>
  );
}
