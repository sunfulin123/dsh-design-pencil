# Typography

## Guidance

Typography is used to create clear hierarchies, useful organizations, and purposeful alignments that
guide users through the product and experience. It is the core guidance of any well-designed
interface.

## Font

### Font-family

#### Roboto

Roboto has a dual nature. It has a mechanical skeleton and the forms are largely geometric. At the
same time, the font features friendly and open curves. While some grotesks distort their letterforms
to force a rigid rhythm, Roboto doesn't compromise, allowing letters to be settled into their natural
width. This makes for a more natural reading rhythm more commonly found in humanist and serif types.

#### Roboto Mono

We can also count with the **Roboto Mono** family to contextual scenarios like a visual distinct need
on a ChatBubble message, for example.

![$font-family-base token: Aa - Base, Roboto](/assets/typography-font/font-family-base.png)

![$font-family-mono token: Aa - Mono, Roboto Mono](/assets/typography-font/font-family-mono.png)

* **[Roboto](https://fonts.google.com/specimen/Roboto)** — Download Google font
* **[Roboto mono](https://fonts.google.com/specimen/Roboto+Mono?query=roboto+mono)** — Download Google font

### Weight

Base

![$font-weight-light token: Light, 300](/assets/typography-font/font-weight-light.png)

![$font-weight-regular token: Regular, 400](/assets/typography-font/font-weight-regular.png)

![$font-weight-medium token: Medium, 500](/assets/typography-font/font-weight-medium.png)

![$font-weight-bold token: Bold, 700](/assets/typography-font/font-weight-bold.png)

Mono

![Mono Light weight, 300](/assets/typography-font/font-weight-mono-light.png)

![Mono Regular weight, 400](/assets/typography-font/font-weight-mono-regular.png)

![Mono Medium weight, 500](/assets/typography-font/font-weight-mono-medium.png)

![Mono Bold weight, 700](/assets/typography-font/font-weight-mono-bold.png)

### Line Height

![$line-height-default token: Default, 100%](/assets/typography-font/line-height-default.png)

![$line-height-xsmall token: XSmall, 115%](/assets/typography-font/line-height-xsmall.png)

![$line-height-small token: Small, 120%](/assets/typography-font/line-height-small.png)

![$line-height-medium token: Medium, 133%](/assets/typography-font/line-height-medium.png)

![$line-height-large token: Large, 142%](/assets/typography-font/line-height-large.png)

![$line-height-xlarge token: XLarge, 170%](/assets/typography-font/line-height-xlarge.png)

![$line-height-mega token: Mega, 200%](/assets/typography-font/line-height-mega.png)

### Font Size

![$font-size-small token: Small, 12px (0.75 rem)](/assets/typography-font/font-size-small.png)

![$font-size-medium token: Medium, 14px (0.875 rem)](/assets/typography-font/font-size-medium.png)

![$font-size-large token: Large, 16px (1 rem)](/assets/typography-font/font-size-large.png)

![$font-size-xlarge token: XLarge, 18px (1.125 rem)](/assets/typography-font/font-size-xlarge.png)

![$font-size-xmega token: XMega, 22px (1.375 rem)](/assets/typography-font/font-size-xmega.png)

![$font-size-mega token: Mega, 20px (1.25 rem)](/assets/typography-font/font-size-mega.png)

![$font-size-giga token: Giga, 24px (1.5 rem)](/assets/typography-font/font-size-giga.png)

![$font-size-xgiga token: XGiga, 28px (1.75 rem)](/assets/typography-font/font-size-xgiga.png)

![$font-size-tera token: Tera, 32px (2 rem)](/assets/typography-font/font-size-tera.png)

![$font-size-xtera token: XTera, 40px (2.5 rem)](/assets/typography-font/font-size-xtera.png)

### Useful links

**[Typography tokens](https://www.figma.com/file/wFqyJnLISAbPa0Si9UBTP9/Design-Tokens?node-id=0%3A1)**
— You can find our typography specs on Figma

## Scale

There are **six primary types of headings** available through the standard header HTML tags.
Remember to use a logical tree of headings to maintain a hierarchy of information and accessibility.

![Heading scale (H1–H6) compared across Large, Medium and Small viewports, with pixel/rem sizes for each level](/assets/typography-scale/scale-heading-scale.png)

### Content

#### Paragraph

To use when you need a distinct section of a piece of writing with essential element of running text.

#### Microcopy

To use when you need very tiny content. These short sentences tell a user what to do, address user
concerns, providing context to a situation.

![Paragraph and Microcopy type styles compared across Regular, Italic, Medium and Monospaced variants](/assets/typography-scale/scale-content-paragraph-microcopy.png)

### Responsiveness

Regarding responsiveness, the headings should change according to the resize of the viewport, while
the paragraphs and microcopy should stay with the same font size.

## Accessibility

### Headings

Headings play a vital role in the accessibility level of any document, whether it is a Word, PDF, or
HTML document. They are used for navigation by screen reader users and they provide a clear structure
of a document which benefits all users, making it easier to scan through the content.

#### WCAG 2.0 references

* [1.3.2 Meaningful Sequence](https://www.w3.org/WAI/WCAG20/quickref/#content-structure-separation-sequence)
* [2.4.6 Headings and Labels](https://www.w3.org/WAI/WCAG20/quickref/?showtechniques=128%2C14\&currentsidebar=%23col_overview#navigation-mechanisms-descriptive)

#### Steps to take

* Plan heading structure early. Ensure all content and design fits into a logical heading structure.
* Consider reading order. The reading order should be the same as the visual order.

### Legibility

Legibility refers to how easy it is for the reader to decode and differentiate individual letters in
a word.

#### Type Colors

Good quality of contrast between the background and font color is essential to ensuring the
legibility of the content. To learn more about color, contrast, and accessibility design, read
[Colors - Accessibility](https://designsystem.talkdesk.com/51aaf6147/p/49728f-color/b/11e5b9).

Color also plays a key role in an interface's typographic hierarchy. Below we can see the established
types.

### Usage

#### Styles

Keeping typography consistent and sticking to logical hierarchies ensures that elements in the UI are
clear and easily recognizable when scanning the page.

#### Formatting

Formatting can be added to the text to call attention, add emphasis, and enhance the meaning of
important content.

### Readability

Readability is about arranging words and groups of words in a way that allows the reader's eye to
access the content easily and in a way that makes sense.

#### Line Height

The line-height values need to be always divisible by 4 so they can support a vertical grid (see
[Spacings](https://designsystem.talkdesk.com/51aaf6147/p/764e98-spacing--more)).

#### Line Length

A proper length for lines of text is key to the readability of the text. Long lines of text tire a
reader's eyes, and make it difficult for the reader to properly track back and find the start of the
next line. Short lines interrupt the readers too often, preventing them from establishing a flow.

![Line length - Desktop: too narrow, ideal range (45-80 characters), and too wide examples](/assets/typography-accessibility/accessibility-line-length-desktop.png)
*Line length - Desktop*

![Line length - Mobile: too narrow, ideal range (35-40 characters), and too wide examples](/assets/typography-accessibility/accessibility-line-length-mobile.png)
*Line length - Mobile*

While there is no right way to measure the perfect width for text, a good goal is to aim for between
45 and 80 characters per line including spacing. Setting an optimal line length will break up content
into easily digestible information.

For mobile, is a good choice to keep the number of characters per line within 35–40.

#### Type alignment

By default, the text is left-aligned. Exceptions to this rule include text in tables, the centered
text we use in empty states and some writing system like Arabic and Hebrew, are displayed with
characters appearing from
[right to left](https://designsystem.talkdesk.com/51aaf6147/p/57a480-right-to-left).

**Do:** All text should be left-aligned whenever possible.

**Don't:** Never left and right justify text.

#### Capitalization

By default, use sentence case. For more on capitalization guidelines, go to
[Grammar and Mechanics](https://designsystem.talkdesk.com/51aaf6147/p/23fa55-grammar-and-mechanics).

![Activity details tabs in sentence case: Snapshot, Stats & flow, Wrap-up, Transcription](/assets/typography-accessibility/accessibility-capitalization-tabs-do.png)
*Do*

![Activity Details tabs in Title Case: Snapshot, Stats & Flow, Wrap-Up, Transcription](/assets/typography-accessibility/accessibility-capitalization-tabs-dont.png)
*Don't*

![Save button and 'Search by contact' input in sentence case](/assets/typography-accessibility/accessibility-capitalization-button-do.png)
*Do*

![SAVE button and 'Search by Contact' input in all caps / Title Case](/assets/typography-accessibility/accessibility-capitalization-button-dont.png)
*Don't*

### Scalable Content

Browsers, mobile devices, and other assistive technology to scale up content are critical for users
with impaired vision.

To help these users, text can be resized in a browser up to 200% resize of text without dropping any
content or functions. This should be accomplished in a browser and therefore not require any
assistive technology.

![Chat message fully visible after text resize, with no loss of content](/assets/typography-accessibility/accessibility-scalable-content-do.png)
*Do Resize text without loss of content or functionality*

![Chat message vertically cut off after text resize](/assets/typography-accessibility/accessibility-scalable-content-dont.png)
*Don't Vertical text cut off*
