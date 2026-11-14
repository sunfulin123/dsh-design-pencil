// An app icon from a URL, recoloured by CSS as Workspace recolours its icons (atlas inlines them with
// react-svg). The SVG is used as a CSS mask over a coloured box, so its markup never enters the page:
// `.ws-svg`'s background-color is the icon's colour. The CDN allows cross-origin requests, which masks need.

import { useEffect, useState } from "react";
import Icon, { type Name as IconName } from "@talkdesk/cobalt-react-icon";

const loads = new Map<string, Promise<void>>();

// Whether the icon loads at all, so a missing one falls back to initials, as in Workspace.
function load(url: string): Promise<void> {
  let pending = loads.get(url);
  if (!pending) {
    pending = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`Icon didn't load: ${url}`));
      image.src = url;
    });
    loads.set(url, pending);
  }
  return pending;
}

export function initialsOfApp(title: string): string {
  return title
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

interface Props {
  url?: string;
  iconName?: IconName;
  /** Shown as initials when the icon can't load, as Workspace does. */
  title: string;
  className?: string;
  size?: "small" | "tiny";
}

export function SvgIcon({ url, iconName, title, className, size = "small" }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    if (!url) return;
    load(url).catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [url]);

  if (iconName) return <Icon name={iconName} size={size} aria-hidden="true" />;
  if (!url || failed) return <span className="ws-dock-icon__initials">{initialsOfApp(title)}</span>;
  return (
    <span className={className} aria-hidden="true">
      <span className="ws-svg" style={{ ["--ws-icon-url" as string]: `url(${JSON.stringify(url)})` }} />
    </span>
  );
}
