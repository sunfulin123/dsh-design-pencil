# Right to left

## Guidance

:::note
This page doesn't map to the current Foundations taxonomy (Tokens / Content / Accessibility) — flagged for review.
:::

The Right-To-Left (RTL) writing is a system widely used in the Middle East and languages such as
Arabic, Hebrew, Persian, and Urdu are read and written from right-to-left.

Designing for the Middle East region poses some unique challenges, to produce a user experience that
will look and feel natural when presented to RTL users.

---

## RTL General Principles

To design an RTL project, we use the principle of mirroring every piece of content, with a few key
exceptions. To understand what to mirror and what to change entirely, it's important to imagine the UI
directionality flowing from right to left, as you can consult in the image below.

Starting from the top right corner of the page, they scan across the top and then scan down the
right-hand side of the content.

RTL websites tend to right-justify even the elements of the page. So the logo of the site will be on
the top right instead of the top left. Everything else naturally follows.

*The "image below" referenced here — a real-product "Voicemails" screenshot showing the same table
mirrored LTR vs. RTL — is not reproduced here because it pairs several fictional names with fictional
phone numbers (e.g. "Carly Yates" / "+1 563-212-2237"). See the data-handling note at the top of this
file. [View on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/07d484-right-to-left).*

## Typography & Text

Proper attention should be given to typography since Arabic and Hebrew, are displayed with characters
appearing from right to left and the typography needs to be specific because of characters
representation.

Another aspect to take into account is that those fonts may appear smaller than Latin ones at the same
font size, requiring adjustments to line spacing and alignment so that the typography works well in
that UI for all languages.

**Noto font** is the recommended font to use, it aims to support all languages with a harmonious look
and feel.

![Roboto font compared with Noto font in Arabic](/assets/rtl/font-rtl.png)

To maintain easy readability, **bold typeface should be avoided**. The italicized font is also not used
in Arabic.

**[Noto Sans Arabic](https://noto-website-2.storage.googleapis.com/pkgs/NotoSansArabic-unhinted.zip)**
— Download
**[Noto Sans Hebrew](https://noto-website-2.storage.googleapis.com/pkgs/NotoSansHebrew-unhinted.zip)**
— Download

**Features to take into consideration include:**

* Aligning text to the right side;
* **Words in LTR languages don't change their direction and neither do digits** (like phone numbers
  with international dialing codes). These are still displayed on RTL websites as they would be on LTR
  websites;
* **Abbreviating** days of the week, month, etc is commonplace in English, but **is not appropriate in
  Arabic**;
* Dates do not change direction either;
* Capital letters are often omitted.

Languages such as Arabic tend to have a great number of spoken and written variations, and if you're
making a product catered specifically to some region, it should really display the language version
used there.

### Text Reading Order

The direction depends on the language — Any time Arabic is used it will always appear RTL. However, as
we can see in the image below, there are instances where English (or other LTR languages) texted will
be mixed in amongst Arabic. In those cases, the LTR language text will always appear left to right.

![LTR reading order vs RTL reading order of a mixed Arabic/English sentence](/assets/rtl/text-reading-order.png)

Note that LTR words continue to appear left to right.

### Differences In Word Sizes Between Languages

Sometimes, when a website is translated into Arabic, the sizing of elements changes due to some words
becoming bigger or smaller after translation.

Consider the following example:

![Cancel and Save buttons in LTR compared with the same buttons in Arabic](/assets/rtl/differences-in-word-sizes.png)

The buttons 'Cancel' and 'Save' look smaller in Arabic, which can cause usability problems. It would be
better to have a min-width for the button to account for such cases.

---

## Logos and Trademarks

Logos and trademarks do not flip, but they do switch locations. So if a logo is typically in the upper
left, it will move to the upper right.

![A sidebar with the app logo shown on the left (LTR) and on the right (RTL)](/assets/rtl/logos-and-trademarks.png)

Note that the logo doesn't need to be flipped but moves to the top right instead of the top left.

---

## Icons

Mirroring icons in an Arabic interface should be done with proper caution. Sometimes mirroring or
flipping isn't necessary and sometimes it is.

Basic guidelines are as follows:

* **Symmetrical icons and** icons without an explicitly specified direction (such as camera, download,
  user profile, etc.) **don't need to be flipped.**

![A row of symmetrical icons: person, trash, settings, bell, alert, bookmark, diamond, calendar, wifi, stop, mail, headset, close, more, expand](/assets/rtl/symmetrical-icons.png)

Using the dock as an example, we can see in the image below that some icons don't need to be flipped
since they are symmetrical.

![A dock with the home icon highlighted, noting it doesn't need to be mirrored](/assets/rtl/dock-symmetrical-icons.png)

* The majority of users in RTL-writing countries are also **right-handed**, so such icons **should not
  be mirrored.**

![Coffee cup, wrench, and search icons that should not be mirrored](/assets/rtl/right-handed-icons.png)

* \*\*Icons with slashes: \*\*the slashes don't need to be flipped. This is true in both text and
  iconography.

---

* \*\*Icons with an explicit direction should be mirrored. \*\*For example, the back button should point
  to the right in the RTL version.

![LTR and RTL rows of directional icons such as arrows, send, log out, and call decline, mirrored](/assets/rtl/mirrored-icons-specific-direction.png)

* \*\*Icons that depict movement or text direction should be mirrored \*\*(such as text alignment icons,
  progress charts, etc.)

![LTR and RTL rows of icons depicting alert, chat, list, bar chart, calendar, and trend, mirrored](/assets/rtl/mirrored-icons-depict-direction.png)

* **Icons featuring English characters don't need to be mirrored**.

![Bold, underline, text size, strikethrough, and underlined A icons that don't need to be mirrored](/assets/rtl/english-characters.png)

* \*\*Icons that show directionality (like clocks) should not be flipped. \*\*While the linear
  representation of time is mirrored in RTL, the circular direction of time is not. A clock icon or a
  circular refresh or progress indicator with an arrow pointing clockwise should not be mirrored.

![Refresh, clock, and history icons that should not be flipped](/assets/rtl/time-icons.png)

* **Ensure that the icons you're using are appropriate.** For example, using a wine glass as a symbol
  for a restaurant or bar could be misunderstood because alcohol consumption is prohibited in Islam.
  Cultural peculiarities need to be taken into account, and designers should double-check that the
  symbols and icons they're using are appropriate for the target market.

---

## Numbers

**Numbers don't change direction** — Under no circumstances are "English" numbers flipped.

This includes both the number itself and the order of the numbers. So a phone number will still appear
in the LTR format with no changes. Even if you are listing out a number that is mixed with letters or
characters, numbers always appear left to right.

For example, **something like A58B265 would stay the same in LTR and RTL**. However, if you are
translating the phrase, from the year 2001 – 2010, in Arabic it will appear as 2010 – 2001.

---

## Images

Images and illustrations don't flip, although choosing an image requires appropriate selection, taking
into account cultural peculiarities when it comes to perception.

---

## UI Elements

Not all interface elements need to be mirrored. Below is a comprehensive overview of elements found in
a website's layout and whether these should be mirrored in RTL projects.

### Calendars

Calendars need to be mirrored. Monday will be displayed on the right side and Sunday on the left one.

![A calendar in LTR (Sun–Sat, left to right) compared with the same calendar in RTL (Sat–Sun, right to left)](/assets/rtl/calendars-rtl.png)

Note that Saturday is the official first day of the week in most Muslim countries.

**Hijri vs. Gregorian Calendar**

The Arabic Hijri calendar is primarily used in Saudi Arabia is lunar-based, consisting of 12 lunar
months in a year of 354 or 355 days. While they still acknowledge and follow the Gregorian calendar to
some extent, many publications and sites use the Hijri.

As we can see in the image below, some sites allow the **display of both Gregorian and Hijri at the
same time**.

There is also a Persian and Hebrew calendar. You will need to make specific calendar changes based on
who you are localizing for.

![A date picker showing both the Hijri and Gregorian calendar in Arabic and in English](/assets/rtl/hijri-calendar.png)

Examples of the Gregorian/Hijri calendar in Arabic and English.

### Dropdowns

Dropdown arrows will still face downward but will be placed on the left-hand side of the dropdown menu.

![A dropdown field in LTR with the arrow on the right, compared with RTL with the arrow on the left](/assets/rtl/dropdown-rtl.png)

### Buttons with icons

The icon's position should be flipped in the RTL layout.

![New contact and Resolve buttons with their icons mirrored between LTR and RTL](/assets/rtl/button-icons-rtl.png)

### Toasts

As you might expect, "close" and check icons should be flipped.

![A success toast with the close and check icons mirrored between LTR and RTL](/assets/rtl/toasts-rtl.png)

### Tabs

In RTL, the tabs should be flipped.

![Two tabs mirrored in position and underline between LTR and RTL](/assets/rtl/tabs-rtl.png)

### Media Controls

Media controls like playback buttons and media progress indicators always run LTR.

This is because media controls are reflecting the way a cassette players rolls the tape in a cassette.
So elements containing a play/pause/stop button will never flip.

![A media player control bar that stays LTR in both the LTR and RTL layouts](/assets/rtl/media-controls-rtl.png)

### Scroll Bars

Scroll bars within UI and within the browser will flip to be on the left.

### Toggle switches and checkboxes

On/off switches should be mirrored with the off position on the right and the on position on the left.

Checkmark buttons should not be mirrored with the longer leg positioned on the left.

![Toggle switches mirrored between on/off positions and a checkbox that is not mirrored, between LTR and RTL](/assets/rtl/toggle-switches-checkboxes-rtl.png)

### Sliders

Horizontal sliders should be mirrored in most cases with the minimum range on the right and the maximum
range on the left.

Horizontal sound volume sliders are the exception and inherit their directionality from media controls,
which are not mirrored.

![A slider control mirrored between LTR and RTL, and a sound volume slider that is not mirrored](/assets/rtl/sliders-rtl.png)

### Rating & Page selectors

Rating selectors often used to collect user feedback, should be mirrored, with the lowest rating on the
right and the highest rating on the left.

Page selectors are also mirrored with the Previous Page button on the right and the Next Page button on
the left.

The numerals that are used to indicate the page number should also be rearranged in right to left
order. For Arabic languages, the page numerals should be displayed using Eastern Arabic digits.

![A star rating selector and page selector, both mirrored between LTR and RTL](/assets/rtl/rating-page-selectors-rtl.png)

### Forms

Despite most text being right-to-left, users often need to switch keyboard layout to input email
addresses, logins, or passwords — which are usually written left-to-right.

Basic guidelines are as follows:

* Placeholders need to be aligned to the right;
* The text being input needs automatically to occupy the left or right-hand side of the field,
  depending on its direction;
* Text being input in fields for inputting a phone number or URL should always occupy the left-hand
  side of the field;
* Fields for inputting an email address should expect left-to-right text, but also be prepared for
  right-to-left text;
* Cursors in empty fields for inputting an email address, phone number, or URL should be left-aligned.

![A form with Name, Email, and Password fields, mirrored between LTR and RTL, with the Name field showing a name and the Email field being typed left-aligned](/assets/rtl/forms-rtl.png)

Once the input is focused and the user starts typing in an LTR language, the alignment will be flipped
to the left.

---

## RTL in a nutshell

**When a UI is mirrored, these changes occur:**

* Text field icons are displayed on the opposite side of a field;
* Navigation buttons are displayed in reverse order;
* Icons that communicate direction, like arrows, are mirrored;
* Icons that imply text direction are mirrored;
* Icons that imply the location of UI elements in the screen, like sidebars, also change;
* Text (if it is translated to an RTL language) is aligned to the right.

**Exception items that are not mirrored:**

* Icons containing text/numbers;
* Icons that don't communicate horizontal/diagonal direction;
* Numbers, such as those on a clock and phone numbers;
* Checkmark icons;
* Dashes in icons;
* Product logos;
* Charts and graphs;
* Order of size dimensions (e.g., 1920x1080 should not become 1080x1920);
* Order of size units (e.g., 10 px should not become px 10);
* Paths(e.g., C:\Users\username\Desktop);
* Full URLs;
* Usernames & passwords (most sites on the web expect LTR usernames/passwords, but there may be
  exceptions);
* Other text fields where only LTR text is expected.

---

## Next steps

These insights are just a starting point and need to be validated. Getting deep into a language and its
society will help understand the user's needs and present a better solution for them.

As a next step, a study is being prepared to validate and to clarify some specific use cases, through
usability testing and user interviews. This documentation will be updated, as soon as we get more
information.

---

## Useful links

**[Evaluate RTL on Cobalt](https://talkdesk.atlassian.net/wiki/spaces/COB/pages/2610922642/Evaluate+RTL+on+Cobalt)**
— Confluence documentation
