# Messages

## Guidance

Workspace has four ways to tell the user something outside an app's own content: banners across the top of the
content, toasts at the bottom of the window, the notification center in the title bar, and the operating
system's notifications. Workspace draws all four; an app asks for them through the Workspace SDK. This page
describes each one, what an app can control, and when to use which.

:::note
Checked against the Workspace source code in October 2026. Where the code and the Workspace design guidance
disagree, this page follows the code and lists the difference under [Open questions](#open-questions).
:::

## Which one to use

|                     | Banner                                                                                         | Toast                                                                              | Notification center                                                  | Operating system notification                              |
| ------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| **For**             | Something that affects Workspace or several apps, and stays true until it's fixed or dismissed | The outcome of a process the user started, when the screen doesn't already show it | Things that happened while the user was elsewhere, kept as a history | Getting the user's attention when Workspace isn't in front |
| **Where**           | Across the top of the primary and secondary areas                                              | Bottom of the window                                                               | Panel from the title bar                                             | The operating system's notification area                   |
| **Stays**           | Until dismissed or removed                                                                     | 3, 5 or 7 seconds, or until dismissed                                              | In the history                                                       | As the operating system decides                            |
| **An app sends it** | Yes, through the SDK                                                                           | Yes, through the SDK                                                               | No: Talkdesk's services do                                           | Yes, through the SDK                                       |

When to use a toast, how to write one and how long it stays are on the
[Toast](/components/core/message/#toast-floating-type) section of Message. This page covers only what Workspace
adds.

For messages about the app's own content, such as a form error or an empty table, use Cobalt components
inside the app, like [Message](/components/core/message/), rather than these.

## Banners

### What they look like

* **Place:** below the title bar, across the primary and secondary areas, starting after the dock and drawer.
  They push the content down; there's no gap between them and the areas.
* **Height:** 48px. In a small window (up to 640px wide) with several banners, 76px.
* **Built with:** Cobalt's [Message](/components/core/message/) as a banner, with a status icon, the text,
  and an optional dismiss button. Side padding is 12px, 16px or 24px, for small, medium and large windows.
* **Variations:** success, warning, info, error and feature. Each has a fixed icon; feature uses a star.
* **Long text** is cut to one line with a "Read more" button, which becomes "Read less" when expanded.
* **Several banners:** the newest shows first, whatever its variation, with Cobalt Marketplace
  [Pagination](/components/marketplace/pagination/) to move between them.
* **Screen readers** announce each banner as an alert.

### Who sends them

* **Apps,** through the SDK.
* **Talkdesk's services,** for example to ask users of an app to refresh Workspace after a release.
* **Workspace itself,** for example when it needs permission to show notifications. That banner has an
  "enable notifications" link in its text.

### What an app controls

An app sets the **text**, the **variation** and whether the banner can be **dismissed**. It can remove its own
banner later. It can't add a title, buttons or an icon of its own.

Without a dismiss button, a banner stays until the app removes it, so remove it as soon as the situation it
describes is over. If a banner reported a problem that then goes away on its own, follow it with a success
banner, unless the fix was trivial. The success banner should name the problem it follows, since a newer
banner may have hidden the first one.

![A yellow warning banner across the top of Workspace saying connectivity issues may affect some features, with a Read less button and a dismiss button.](/assets/workspace/messages/banner-problem.png)
*A warning about a problem*

  ![A green success banner in the same place saying everything is back to normal and no connectivity issues were detected.](/assets/workspace/messages/banner-solved.png)
*The success banner once it's solved*

An app can send a banner only while it's running. An app the user hasn't opened yet, unless it runs in the
background, can't show one at sign-in. A banner goes to every user who has the app open.

### Writing a banner

From the Workspace guidance:

* **Keep it short:** up to 200 characters, most important information first.
* **Help the user solve the issue** when there's a way to.
* **Use sentence case**, with no full stop at the end.
* **End with an ellipsis** for a process that's under way, to show it will be brief.
* **Leave room for translation:** at least 40% more space for wordier languages.
* **Write like a person:** "we" rather than "Talkdesk", and "turn on" rather than "enable".

![A yellow warning banner reading: We need your permission to turn on desktop notifications.](/assets/workspace/messages/banner-do.png)
*Do*
Say “we” and “turn on”, with no full stop.

  ![A yellow warning banner reading: Talkdesk requires your permission to enable desktop notifications, ending with a full stop.](/assets/workspace/messages/banner-dont.png)
*Don't*
Avoid “Talkdesk requires”, “enable” and the full stop.

### When to use each type

Examples from the guidance. Check new banners with the Writing and Workspace teams.

| Type    | Example                                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------------- |
| Error   | The user tries to make a call but hasn't allowed the microphone. Several apps use it, so it's a banner. |
| Warning | The user's network is poor or unstable.                                                                 |
| Info    | The user's role changed, which may change the apps they can use.                                        |
| Success | Talkdesk was unavailable and is back to normal.                                                         |
| Feature | A new version of the desktop app is ready to install. The guidance calls this type Primary.             |

### Several banners, from the guidance

* **Dismissing one:** if it was the only banner, the content moves back up. If it was the first, the user sees
  the next one; otherwise the previous one, to come back to a known place.
* **Expanded banners** collapse again when the user dismisses them or moves to another banner.
* **Alignment:** every part of the banner is aligned to the top. In a small window, the pagination moves to a
  second row to leave room for the text.

## Toasts

### What they look like

* **Place:** in the bottom-right corner of the Workspace window, outside any app's frame, raised enough to clear the call
  bar.
* **Built with:** Cobalt Marketplace [Toaster](/components/marketplace/toaster/), with a status icon, an
  optional title in medium weight, the message and up to two buttons.
* **Types:** success, info, warning, error, primary and secondary. Primary and secondary use a stars icon.

### What an app controls

| Setting          | Options                                                                                | Default   |
| ---------------- | -------------------------------------------------------------------------------------- | --------- |
| Message          | Required                                                                               | —         |
| Title            | Optional                                                                               | None      |
| Type             | Success, info, warning, error, primary, secondary                                      | Info      |
| Disappears after | Short (3 seconds), medium (5), long (7) or never                                       | **Never** |
| Dismiss button   | On or off                                                                              | On        |
| Buttons          | Up to two, each with a label. A button runs code in the app or opens a Workspace link. | None      |

A toast that never disappears stays until the user dismisses it or the app removes it. Pick the delay from the
[timer rules](/components/core/message/#toast-floating-type): no timer for toasts with actions or that ask the
user to do something, and at least 5 seconds otherwise.

## Notification center

* **Opened from** the notification button in the [title bar](/workspace/title-bar/), which shows the unread
  count. **Behind a feature flag.**
* **The panel** slides in from the right, below the title bar, over a backdrop. It closes on a click outside,
  Esc, or the button again.
* **Each notification** has an optional icon, a title, a description cut at 135 characters, the app it came
  from, when it arrived, and whether it's unread. Notifications are grouped by date, with a button to load
  older ones.
* **Where they come from:** Talkdesk's services create them for a user, and they arrive in real time. Each new
  one also shows as an operating system notification.
* **Clicking one** marks it as read, and opens its link in Workspace when it has one.
* **Kept for 14 days,** then deleted permanently, according to the Workspace guidance.

Keep titles and descriptions short: a title that doesn't fit is cut off, and so is a description over 135
characters.

![The notification center open over a dashboard, listing notifications under Today and Older, each with an icon, a title, a description, the app's name and a blue unread dot.](/assets/workspace/messages/notification-center.png)
*The notification center, from the Workspace design guidance*
The guidance shows it on the left; the code opens it on the right. See Open questions.

Apps can't add to the notification center through the Workspace SDK. The SDK's notification call shows only an
operating system notification, which doesn't appear in the center.

## Operating system notifications

An app can show one through the SDK with a **title**, a **body**, an optional **Workspace link** to open when the
user clicks it, and whether it should **stay until the user acts on it**. Workspace asks the user for permission
the first time, with a banner.

Use them for things the user needs to know while they're in another window, such as an incoming
conversation. Don't use them for feedback on something the user just did in Workspace: use a toast.

## In Figma

The Workspace guidance points to these Figma components:

* **Banners:** Cobalt Design System › Patterns › BannerPattern.
* **Notification center:** Workspace Library › Notification center.

## Open questions

Differences between the code and the Workspace design guidance, for the Workspace team to settle. Until they
do, follow the code.

* **Banner types.** The guidance lists a "Primary" type, whose icon can be changed (for example to a loader).
  The code has "feature" instead, always with a star.
* **Which side the notification center opens on.** The guidance shows it on the left, next to the dock. The
  code opens it on the right.
* **Banner role for screen readers.** The guidance gives errors the alert role and other banners the status
  role, which screen readers announce less urgently. The code makes every banner an alert.
* **Banner actions.** The guidance says banners can't have actions. Workspace's own permission banner has a
  link in its text, but apps still can't add one.
* **Default notification icon.** The guidance says notifications without an icon get a Workspace default. The
  code shows no icon.
* **Apps and the notification center.** The guidance says apps create notifications. Through the Workspace
  SDK, an app can only show an operating system notification; the center is filled by Talkdesk's services.
* **Toast timing.** A toast stays until dismissed unless the app sets a delay. The Toast guidance asks for at
  least 5 seconds, plus 1 second per 10 characters over 50, but the SDK offers only 3, 5 or 7 seconds, or never.
* **Toasts inside the app.** Whether apps should use Workspace toasts or Cobalt's Toaster inside their own
  frame isn't documented. Workspace toasts sit at the bottom of the whole window; a Toaster inside the app is
  limited to the app's area.
* **Untranslated labels.** The banner's "Dismiss", "Read more" and "Read less" are hard-coded in English.
