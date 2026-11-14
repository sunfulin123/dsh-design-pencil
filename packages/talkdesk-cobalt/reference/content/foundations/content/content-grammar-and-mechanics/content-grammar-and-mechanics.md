# Grammar and mechanics

## Guidance

## Abbreviations and acronyms

### Abbreviations

To avoid misunderstanding, before referring to something with its abbreviation, write the full version on the first mention, with the abbreviation in parentheses. On subsequent mentions, you can start using the abbreviation.

**Example:** Amazon Web Services (AWS)

* Avoid using internal abbreviations in the product.
* Well-known abbreviations, like **API** or **SMS**, can be used.
* Don't use apostrophes for plural abbreviations.
* When you want to display an example of something to offer more context and information to the user, use the abbreviation **e.g.**

### Acronyms

An acronym is formed from the first letters of words. The letters can either be pronounced as a word itself or separately.

**Example:**

* EMEA (**Europe, Middle East, and Africa**)
* USD (**United States dollar**)
* FAQ (**Frequently Asked Questions**)
* CSAT (**Customer Satisfaction Score**)

---

## All caps

All caps are harder to read than regular sentence-case text. Users tend to read all caps text slightly more slowly, or even more aggressively. You should avoid it except for [acronyms](https://designsystem.talkdesk.com/51aaf6147/p/23fa55-grammar-and-mechanics/t/45073b) and [file extensions](https://designsystem.talkdesk.com/51aaf6147/p/23fa55-grammar-and-mechanics/t/916c11).

---

## Articles

* The use of articles (*a*, *an, the*) depends on whether the message is conversational or action-based microcopy.
* Avoid articles in buttons and labels.
* Use articles in more conversational sections of the interface, like empty states or messages. This makes the language more approachable and helps with understanding when introducing new, complex concepts.

**Do** In the title, the definite article "the" was used to provide a more conversational experience with the user. The button, however, does not require an article.

---

## Avoid saying “sorry”

Use “sorry” only in error messages that result in serious problems for the user (for example, data loss, the user can’t continue to use Talkdesk, or the user must contact Support).

![Do — a “Service unavailable” error screen reading “We’re sorry, our service is temporarily unavailable, but we should be back up shortly. Please contact us if the problem persists.”](/assets/content-grammar-and-mechanics/grammar-avoid-sorry-do.png)
*Do We should apologize because is Talkdesk is down.*

![Don’t — a sign-in form error reading “Sorry, but you must include a symbol in your password”](/assets/content-grammar-and-mechanics/grammar-avoid-sorry-dont.png)
*Don't The user made a mistake. No need for us to apologize.*

**Note:** Before you use “sorry” in UI text, ask yourself if you could change the design to avoid the situation.

---

## Contractions

They give our writing an informal, friendly tone. Some can be used, some can’t.

**Do:** We'll, Can’t, Don’t, You’re, Shouldn't, It’s, You’ve, Couldn’t, Haven’t.

**Don't:** Needn’t, Mustn’t, There’re, You’d, That’ll, Gotta, It’d, Could've, They've.

**The difference between *its* and *it's***

Don't confuse *its* (possessive pronoun) with *it's* (personal pronoun *it* + verb). *It’s* is a contraction of “it is” or “it has” while *its* is used to refer to something or to say that something belongs to someone/something.

**Do** The computer looked as though its power supply had failed.

**Do** It’s a good idea to read the Cobalt Design System guidelines.

---

## Currency

When writing about currency, give preference to the acronym instead of the symbol. The acronym should always be placed before the amount.

Since we write our product in American English, we should always use a decimal point.

**Do:** USD 250.00

**Don't:** $250.00 USD

---

## Dates and Times

Dates and times are represented according to examples in the table below.

| **When did it happen?**   | **How to use**                              |
| ------------------------- | ------------------------------------------- |
| Current day               | Today, 3:54 PM                              |
| Next day                  | Tomorrow, 2:16 AM                           |
| Previous day              | Yesterday, 2:25 PM                          |
| More than 48h ago         | May 3, 4:12 PM                              |
| In a previous/future year | Dec 25, 2019, 5:19 PM Apr 1, 2025, 11:12 PM |

### Dates

* Traditional US format: Month Day, Year (MMM D, YYYY).
* Months are usually abbreviated.
* The year is only represented if it’s not the current one.
* A comma between month/day and year.
* A comma between the date and time.
* “Today”, “Tomorrow” and “Yesterday” are the only relative dates used.
* Values are displayed without the leading “0”.
* In a graphic or a table, spell out the day of the week only if necessary.
* A comma between weekday and month.
* Choose to abbreviate weekdays over months.

| **Weekdays** | **Abbreviation** |
| ------------ | ---------------- |
| Monday       | Mon              |
| Tuesday      | Tue              |
| Wednesday    | Wed              |
| Thursday     | Thu              |
| Friday       | Fri              |
| Saturday     | Sat              |
| Sunday       | Sun              |

| **Months** | **Abbreviation** |
| ---------- | ---------------- |
| January    | Jan              |
| February   | Feb              |
| March      | Mar              |
| April      | Apr              |
| May        | May              |
| June       | Jun              |
| July       | Jul              |
| August     | Aug              |
| September  | Sep              |
| October    | Oct              |
| November   | Nov              |
| December   | Dec              |

| **Word**       | **Abbreviation** | **Example**  |
| -------------- | ---------------- | ------------ |
| **Year/Years** | yr.              | 1 yr. 12 yr. |
| **Years**      | yrs.             | 10 yrs.      |
| **Month**      | mo.              | 1 mo.        |
| **Months**     | mos.             | 3 mos.       |
| **Day/Days**   | d.               | 7 d.         |
| **Week**       | wk.              | 1 wk.        |
| **Weeks**      | wks.             | 6 wks.       |

Abbreviations for these words should be avoided, and you should prioritize writing the complete word.

In cases where there is a lack of space, or you want to specify the duration of something - when a subscription is ending or for how long the user is a member - use the abbreviations above.

![Example of date format and different abbreviations — a client details panel showing “Membership: Jan 12, 2019 (3 yr., 3 mos.)”](/assets/content-grammar-and-mechanics/grammar-date-abbreviations-example.png)
*Do Abbreviations for January, "years", and "months".*

**Time**

* 12-hour format.
* “AM” and “PM” are capitalized, without periods, and with a space between the numbers and “AM/PM”.
* Values are displayed without the leading “0”.
* Relative time (e.g. 20 minutes ago) is not used.

### Date and time ranges

To display a date or time range, show an en dash (without spaces) between dates or times.

| **Range** | **How to use**                                                                                                                                                                                                           | **Example**                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| Year      | Date ranges are formatted based on whether the range covers the same year or the current year: Show the year on both the start and end. If both dates have the current year, show the year only at the end of the range. | Dec 6, 2013–Jan 2, 2014 Jan 4–6, 2014 |
| AM/PM     | If both times have the same AM/PM, use a single AM or PM at the end of the range.                                                                                                                                        | 8:00–10:30 AM                         |

---

### Other date and time formats

If the US date format is not applicable, you can use one of these, according to the [language/country](https://en.wikipedia.org/wiki/Date_format_by_country) in question:

* Day Month, Year (D MMM, YYYY)
* Year Month Day (YYYY MMM D).

If the 12-hour format is not applicable, you can use the 24-hour format. In this format, values are displayed with the leading “0”.

The table below shows you how to represent date and time according to the Day Month, Year (D MMM, YYYY), and the 24-hour format.

| **When did it happen?**       | **How to use**                         |
| ----------------------------- | -------------------------------------- |
| **Current** day               | Today, 15:54                           |
| **Previous** day              | Yesterday, 14:25                       |
| More than **48 hours** ago    | 3 May, 16:12                           |
| In a previous/future **year** | 25 Dec, 2019, 17:19 1 Apr, 2025, 23:12 |

**Labels for the first 24 hours:**

* less than a minute ago, a minute ago, 2-59 minutes ago, 1 hour ago, 2-24 hours ago

**Label for the next 24 hours:**

* Yesterday, 9:43

**Label after the first 48 hours:**

* Thursday, January 19, 9:45 / Thu, January 19, 9:45 / Thu, Jan 19, 9:45

### Duration

Events with a duration (e.g., a call duration, a recording duration) are represented in the format 00:00. If the event reaches the hour mark, the format updates to 00:00:00.

In tables, these values should be right-aligned.

**Do:** 00:07

**Don't:** 7sec / 7s

**Do:** 01:23:42

**Don't:** 00:23:42 — The event did not reach the hour mark, so the format should be “23:42”.

---

## Decimals and fractions

### Decimals

Use commas and decimal points in accordance with standard American number formatting.

### Fractions

Use fractions when referring to multiple steps, as seen in our [progress bars](https://cobaltdesignsystem.zeroheight.com/styleguide/s/64259/p/63389d-progress-bar/b/06f00a).

---

## Emojis

Emojis are a fun way to express emotions and add humor, but let’s keep them out of our product. 💜

*Please bear in mind that we use icons in some of our [messages](https://designsystem.talkdesk.com/51aaf6147/p/04b4cd-message/b/35e7dd) and this does not mean you have to exclude them, as they're different from emojis.*

---

## File extensions

Use all caps to refer to a file extension type.

When referring to a specific file, you should include the word *file* after the filename and use their exact spelling. **Example: a CSV file**

When asking for the user to interact with a file, don’t use the file type as a verb.

**Do:** Open the ZIP file.

**Don't:** Unzip a ZIP file.

Use the file type name and not the filename extension.

**Do:** Drop your CSV file here.

**Don't:** Drop a .csv file here.

---

## Languages

* Write names of languages without abbreviations. When space is an issue, write out the name of the language on the first mention, and then on subsequent mentions, abbreviations are fine.
* Always mention the country of the language in parentheses.
* Write the name of the language in its own language.

**Do:** Français (CA) Français (FR)

**Don't:** Portuguese (PT) Spanish (ES)

When there is no space, follow the ISO norm. Capitalize the country, not the language.

**Example:** pt-PT, pt-BR

---

## Lists

* Use lists to make content easier to scan and reduce cognitive load.
* Use punctuation if you’re writing complete sentences.
* Avoid including more than 5 items on a list. If you need more, it might be better to create multiple lists.
* All lists and dropdowns should be sorted alphabetically if no other field is defined by default.

---

## Percentages

Use the % symbol instead of spelling out "percent."

---

## Punctuation

To help readers scan text at a glance, avoid using punctuation in places where it isn't necessary.

### Bold

Use **bold** for elements like titles, buttons, labels, or anything else you want to draw the user’s eye to. Try not to overdo it.

### Commas

Use the Oxford comma with “and” and “or”. The Oxford comma is placed after the penultimate item in a list of three or more items.

![Do — a search field placeholder reading “Search by name, number, or company”](/assets/content-grammar-and-mechanics/grammar-oxford-comma-do.png)
*Do*

![Don’t — a search field placeholder reading “Search by name, number or company”](/assets/content-grammar-and-mechanics/grammar-oxford-comma-dont.png)
*Don't*

**Note:** Why use the Oxford comma? **Example:** “We invited the mechanics, J.F.K. and Stalin.” With no Oxford comma, this sentence implies that the mechanics share their names with the 35th U.S. president and a Soviet dictator.

### Dashes and hyphen

Use a hyphen (-) without spaces on either side to link words into a single phrase.

**Do:** “First-time user”

**Don't:** “First time user”

You can often use an em dash (—) without spaces on either side to replace parentheses or colons.

**Do:** “Studio—released last year—is used by everyone at Talkdesk” “You can have two pets in the office—a dog and a cat”

**Don't:** 

Use the en dash (–) without spaces to indicate spans of time or ranges of numbers.

**Do:** “The 2020–2021 fiscal year was when it all started”

**Don't:** “The 2020-2021 fiscal year was when it all started”

### Exclamation points

Use exclamation points sparingly, and never more than one at a time, to be encouraging or generate excitement. Avoid using exclamation points in error messages, confirmation messages, or instructional text.

**Do:** “Almost there!” (To show progress during a process.)

**Don't:** “Your changes were saved!”

### Italics

Use *italics* for emphasis, citations, or defining a term.

### Periods

Avoid using periods on solitary sentences within these UI descriptions:

* Labels
* Tooltips
* Bulleted lists
* Modal dialog body text
* Toasts

**Do:** “Please check your internet connection and try again”

**Don't:** “Please check your internet connection and try again. “

Use periods on multiple sentences.

**Do:** “The interaction is already assigned to a different agent. Please try again shortly.”

**Don't:** “The interaction is already assigned to a different agent. Please try again shortly”

### Quotes

Use curly double quotes (“ ”) for initial quotations, and curly single quotes (‘ ’) for quotations within the initial quotation. Leave a space between a single and a double when they are next to each other.

**Do:** “Let’s explore the meaning of the quote ‘a misplaced phone is a Bastos phone,’ ” said Daniel.

**Don't:** ‘Let’s explore the meaning of the quote “a misplaced phone is a Bastos phone,”’ said Daniel.

### Underline

Use underline for hyperlinks, preferably giving it more emphasis with bold. Don’t underline text that will not be clickable, as users are used to that behavior.

## Phone numbers

Use the country code to help identify that the number is from another country. When space is not an issue, you can also add a flag to the country code.

All phone numbers are separated with non-breaking spaces, regardless of their origin.

The North American phone number format is: **+CC DDD DDD DDDD**

**Do:** +1 234 567 8999

**Don't:** +1 214-208-2146

**Phone numbers outside North America**

Numbers with 9 digits: **+CC DDD DDD DDD**

Numbers with 10 digits: **+CC DDD DDD DDDD**

---

## Sorting

When sorting items such as names, titles, or any other kind of data, it's important to follow a consistent and intuitive order.

Here's the suggested sorting order:

1. **Spaces**
2. **Symbols other than numerals, letters, and punctuation marks**
3. **Numerals (0 through 9)**
4. **Letters (A through Z)**

---

## States, provinces, cities, and countries

Spell out all city, state and province names without abbreviations. For countries or federations, when space is an issue, write out the name on the first mention, and then on subsequent mentions, abbreviations are fine.

**Do** United States of America, US United Kingdom, UK Brazil, BR

---

## Symbols and special characters

For accessibility purposes, avoid symbols. Don’t use *&* (ampersand) instead of *and*.

### The use of +

In [BadgeContainer](https://zeroheight.com/51aaf6147/p/86f1ac) and [Tag](https://zeroheight.com/51aaf6147/p/26887e), it's usual to represent a group of items through a number. When the maximum has been reached, a + is used to represent that there are more than a certain amount of items attached to that item.

In cases like this, **the + should be placed at the right of the number.**

The only case where we **represent the + on the left side of the number** is when representing [phone numbers](https://designsystem.talkdesk.com/51aaf6147/p/48e27a-grammar-and-mechanics/t/6809ef) and their **country code**.

---

## Titles and headings

Titles and headings should be descriptive but concise. It’s easier to navigate throughout the product if the headings and titles are different and unique.

* Use sentence case for headings and titles
* Keep it simple: headings with one sentence only.
* Don’t use punctuation.
* Don't put a link in a heading because it can easily be confused as a style applied to a heading instead of a link

**Do:** Simple and concise information.

**Don't:** Avoid title case.

---

## The use of "please"

Use “please” sparingly and only if an action is really serious, and important, or if you’re asking the user to complete a task that is not that easy. Sometimes, an imperative CTA is all that’s necessary.

Don't use "please" in the normal course of explaining how to use a product, even if you're explaining a difficult task.

Use "please" when you're asking for permission or forgiveness—for example, when what you're asking for benefits us, inconveniences a reader, or suggests a potential issue with a product.

---

## Units of measurement

When you specify a number with the unit, use a non-breaking space between the number and the unit. **Example: 65 MB**

However, when the unit of measure is [percentage](https://designsystem.talkdesk.com/51aaf6147/p/23fa55-grammar-and-mechanics/t/859ac1), don’t use a space. **Example: 50%**

On ranges of numbers with units, repeat the unit for each number and add the word *to* to separate the two numbers. **Example: 50% to 60%**

For [Currency](https://designsystem.talkdesk.com/51aaf6147/p/23fa55-grammar-and-mechanics/t/63b318), give preference to the acronym instead of the symbol.

---

## Use consistent words

Don’t use different words for the same thing. **Example:** if the correct term is “Notification Center”, don’t tell the user to go to his “Notifications area”. If the correct term is “interaction”, don’t call it “conversation” somewhere else, as it will only confuse the user.

### Delete vs Remove

Use the word “delete” when it’s impossible or nearly impossible to undo a certain action.

![Do — a confirmation dialog titled “Delete flow?” with “You can’t undo this action”](/assets/content-grammar-and-mechanics/grammar-delete-vs-remove-delete-do.png)
*Do*

![Don’t — the same irreversible action labeled “Remove flow?” instead of “Delete flow?”](/assets/content-grammar-and-mechanics/grammar-delete-vs-remove-delete-dont.png)
*Don't*

Use the word “remove” when the user can easily undo a certain action. When appropriate, reassure the user that the “removal” is reversible (see “optional” in the example below).

![Do — a confirmation dialog titled “Remove agents from the list?” with “You can add them back anytime”](/assets/content-grammar-and-mechanics/grammar-delete-vs-remove-remove-do.png)
*Do*

**Don't**

### Select vs Choose

You can **select** some text, one or more items in a table, one or more icons.

You **choose** a menu command or a toolbar command, an item in a popup menu, an item in a segmented control.

**Select** is to **choose** one or more elements of a set, especially a set of options. If you can apply a menu command to the item, then it’s a **selection**. To **choose** is to pick.

**Do** You select different ring groups

**Do** You choose the preferred language

### Settings vs Preferences vs Configuration

There isn't a single consistent style followed by all applications/websites. They are (broadly) synonyms. However, we will do our best to define them so we can be consistent across Talkdesk products and make sure our users always understand what the words mean.

**Configuration** is a deep, fundamental property of the system. These are things that the IT department might set up, and that the user may never change, unless you have very specific needs and knowledge.

On the other end of the scale there are **Preferences**. These are the user's personal choices. They may involve whether spell-check is active, choice of language, speed of the mouse-pointer, etc.

**Settings** is very similar to Preferences, with a less personal touch to it. It's where the user views or modifies the list of things that can be set. *Account settings* (where we change our Role and Team) would be a viable option for our Workspace, for example. Note that **setting** and **option** can also be used interchangeably in the singular (“check the option labeled *never*” or "You don't have permission to change this setting").

---

## Use numerals

![Do — “You have 3 messages”](/assets/content-grammar-and-mechanics/grammar-use-numerals-do.png)
*Do Faster to read.*

![Don’t — “You have three messages”](/assets/content-grammar-and-mechanics/grammar-use-numerals-dont.png)
*Don't Takes longer to read.*

**Exception 1:** When using numbers two different ways, refer to one in numerals and the other in text. E.g.: “Enter two 3s.”

**Exception 2:** If it's an expression that typically uses spelled-out numbers, leave them that way. E.g. “A friendly welcome email can help you make a great first impression.”

---

## Use sentence case

Capitalize only the first word in a phrase. It’s easier to read and to remember as a rule.

![Do — a button labeled “Create flow” in sentence case](/assets/content-grammar-and-mechanics/grammar-sentence-case-do.png)
*Do*

![Don’t — a button labeled “Create Flow” in title case](/assets/content-grammar-and-mechanics/grammar-sentence-case-dont.png)
*Don't*

---

## When you're stuck

You can always ping the Product Design team in our design-private channel.
