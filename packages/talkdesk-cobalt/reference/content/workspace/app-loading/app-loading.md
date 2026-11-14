# App loading (3Dots)

## Guidance

While an app loads, Workspace covers the app's area with its own loader, 3Dots: three dots that jump in turn.
Workspace draws it for every app, and apps can't use it themselves: no Cobalt or Workspace package provides
it. This page describes what Workspace shows while an app and Workspace itself load, and what an app should
use for loading inside its own content.

:::note
Checked against the Workspace source code in October 2026. The [3Dots design](#the-3dots-design) section comes
from the Workspace design guidance. Where the two disagree, this page follows the code and lists the
difference under [Open questions](#open-questions).
:::

## While an app loads

* **Where:** over the app's whole area, centred. Workspace shows it for every app it loads: in the primary
  area, in the secondary area, and in Workspace panels and modals.
* **Look:** three 16px dots in an 80px-wide row, in Primary 9 (`--primary-9`), Primary 7 (`--primary-7`) and
  Primary 4 (`--primary-4`). Each dot jumps up and down every 0.3 seconds, 0.08 seconds after the one before.
* **After an update:** when the app is reloading because a new version was released, a line under the dots
  says "Loading the most recent experience for" and the app's name.
* **After 5 seconds:** if the app still hasn't loaded, Workspace adds "Thanks for your patience…", "Do not run!
  We are working on a better experience." and a **Refresh** button that reloads the app.
* **If the app fails to load,** Workspace replaces the loader with its error screen, and the app's dock
  button gets the "!" badge (see [Dock and drawer](/workspace/dock-and-drawer/#badges)).

All the text is Workspace's own and is translated. An app can't change it.

## While Workspace starts

* **In the browser,** Workspace plays the Talkdesk logo animation (the wordmark and the symbol) while it
  loads. It's on by default, behind a feature flag.
* **In the desktop app,** a small window shows that Workspace is loading. See
  [Desktop app](/workspace/desktop-app/#starting-up-and-going-offline).

## Loading inside your app

Once the app has loaded, loading inside it is the app's job, with Cobalt components:

* **[Skeleton](/components/core/skeleton/)** for a page or a block of content whose layout is known, such as
  the page after the app opens.
* **[Spinner](/components/core/spinner/)** for a single element, such as a button's action, when the wait is
  over a second.
* **[ProgressBar](/components/core/progress-bar/)** for a long or measurable process, such as an upload or an
  export.

See [Empty states and loading](/patterns/empty-states-and-loading/) for how to combine them.

## The 3Dots design

From the Workspace design guidance. The Creative team created the 3Dots animation after Talkdesk's rebrand,
from the brand's concept. It started in video and brand work and was then adopted as the product's main
loader.

### Anatomy

![3dots example — Anatomy](/assets/3dots/anatomy.png)

1. **Dots:** the animated, indeterminate progress indicator.
2. **Label:** text that tells the user what's loading.

### Variants

![3dots example — Variants Sizes: XLarge](/assets/3dots/sizes-xlarge.png)
*Size: XLarge*

![3dots example — Variants Modifiers](/assets/3dots/variants-modifiers.gif)
*Logo symbol animation*

![3dots example — Variants Modifiers](/assets/3dots/variants-modifiers-2.gif)
*Wordmark and symbol animation, used while Workspace starts*

![3dots example — Variants Orientation: Vertical](/assets/3dots/orientation-vertical.png)
*Vertical*

  ![3dots example — Variants Orientation: Horizontal](/assets/3dots/orientation-horizontal.png)
*Horizontal*

### Theming

A theme can change the dots' colours to suit it, for example on a dark background.

![3dots example — Theming](/assets/3dots/theming.gif)
*3Dots for dark backgrounds*

### Guidelines

* **One at a time:** there should be only one 3Dots on screen.
* **Placement:** centred in the area that's loading.
* **Label:** keep it under 80 characters per line, following the
  [W3C guidance on line length](https://www.w3.org/WAI/tutorials/page-structure/styling/). For a wait of more
  than a few minutes, tell the user what's happening and what they can do.

![3dots example — Guidelines When to use](/assets/3dots/guidelines-when-to-use.gif)
*A full-screen loading that took longer than expected*

### In Figma

Workspace Library › Apps Loader (3dots):
[3Dots component](https://www.figma.com/file/txlnFgFiMVzav4GpRfjeJ3/Workspace-library?node-id=4%3A91448).

## Open questions

Differences between the code and the Workspace design guidance, for the Workspace team to settle. Until they
do, follow the code.

* **3Dots inside apps.** The guidance recommends 3Dots for loading a whole page, a modal or a panel inside an
  app, but no package provides it: only Workspace draws it, while an app loads. Apps can use Skeleton, Spinner
  and ProgressBar.
* **Reduced motion.** The dots keep jumping when the user has asked for reduced motion.
* **No label while loading normally.** The guidance gives 3Dots a label saying what's loading. Workspace shows
  text only after an update or after 5 seconds.
