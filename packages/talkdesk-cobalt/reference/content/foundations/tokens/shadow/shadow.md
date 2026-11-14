# Elevation

## Guidance

:::note
This page corresponds to the live Cobalt DS's Design Tokens > **Shadow** page — renamed to "Elevation"
here to match this design system's token category naming.
:::

Shadows create a visual hierarchy and impression of depth to convey proximity and prominence to the
user. Use shadows to highlight differences in elevation between two components.

## Appearance and usage

Shadows provide important visual cues about objects' depth and directional movement. They are the
only visual cue showing the amount of separation between surfaces.

There are two types of lights: **key lights** and **ambient lights**. Key lights create sharper,
directional shadows, which are called key shadows. Ambient light appears from all angles so they
create soft shadows, called ambient shadows.

Because shadows express the degree of elevation between surfaces, they must be used consistently
throughout our products. Use the below defined tokens to set shadows consistently.

![Level 1: (X: 0px, Y: 2px, B: 4px) + (X: 0px, Y: 4px, B: 8px)](/assets/shadow/level-1.png)
*$shadow-level-1*

![Level 2: (X: 0px, Y: 4px, B: 8px) + (X: 0px, Y: 8px, B: 16px)](/assets/shadow/level-2.png)
*$shadow-level-2*

![Level 3: (X: 0px, Y: 8px, B: 16px) + (X: 0px, Y: 16px, B: 32px)](/assets/shadow/level-3.png)
*$shadow-level-3*

![Level 4: (X: 0px, Y: 12px, B: 16px) + (X: 0px, Y: 24px, B: 32px)](/assets/shadow/level-4.png)
*$shadow-level-4*

## Scrollable shadows

Scroll shadows are when you can see a little inset shadow on elements if (and only if) you can
scroll in that direction. Most used on Forms, Panels and Modals.

![Example applied on modal: a modal with a scroll shadow at the bottom of its scrollable body](/assets/shadow/example-applied-on-modal.png)
