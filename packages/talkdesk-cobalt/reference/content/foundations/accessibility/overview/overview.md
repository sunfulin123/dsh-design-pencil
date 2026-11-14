# Overview

## Guidance

:::note
Sourced from Cobalt's live Accessibility docs, which the Cobalt team has flagged as under review —
treat as a starting point, not settled guidance.
:::

Talkdesk firmly believes that web and software experiences should be accessible for everyone. TDS
(Talkdesk design system) is committed to following and complying with accessibility best practices.

## What is accessibility?

Accessibility is the qualities that make an experience open to all. The ability to see, hear, speak,
think and touch affects the human capacity to use technology so when designing an experience we should
consider different abilities levels.

By designing experiences that can be used by people with different abilities we are increasing the
number of people with disabilities that can use our products and also improving the experience for all
users. As an example closed captioning was initially designed to support people who are deaf and hard
of hearing however, it is now used by people without physical disabilities when in contexts where this
technique is useful such as in public places (when using public devices or when using their own mobile
device in silent mode), in loud environments, by someone who is learning a new language, among others.

The [World Health Organization](https://www.afro.who.int/health-topics/disabilities) defines that,

> "Disability is an umbrella term, covering impairments, activity limitations and participation
> restrictions. Impairments are problems in body functions or structures while activity limitations
> are difficulties encountered by an individual in executing tasks or actions. Problems experienced by
> an individual in life situations are called participation restrictions. In other words, disability is
> not just one health problem. It is a complex phenomenon, reflecting the interaction between features
> of a person's body and features of the society in which he or she lives."

Human disability can be permanent, temporary or situational.

| Permanent disability             | Temporary disability           | Situational disability                  |
| -------------------------------- | ------------------------------ | --------------------------------------- |
| Someone deaf or hard of hearing. | Someone with an ear infection. | Someone that is in a noisy environment. |

The [World Wide Web Consortium (W3C)](https://www.w3.org/WAI/fundamentals/accessibility-intro/#what)
defines web accessibility as follows,

> "Web accessibility means that websites, tools, and technologies are designed and developed so that
> people with disabilities can use them. More specifically, people can: perceive, understand,
> navigate, and interact with the Web; contribute to the Web."

Examples of different disability use cases applied to ICT are,

|           | Permanent                                                                                                                                                                                                                                               | Temporary                                                                                                                                                                                                                            | Situational                                                                                                                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auditory  | A user who is deaf and relies on captions or sign language interpretation to communicate and understand customer inquiries.                                                                                                                             | A user who has recently undergone ear surgery and is experiencing temporary hearing loss. They may use captions or request written communication until their hearing recovers.                                                       | A user working in a noisy environment with loud background noise, such as construction noise or a bustling call center. They may use captions to ensure they can accurately understand customer conversations.                |
| Cognitive | A user with a cognitive disability, such as autism or a learning disability, who benefits from written communication. They may rely on captions or chat-based interfaces to effectively communicate with customers.                                     | A user recovering from a concussion or experiencing temporary cognitive difficulties due to illness. They may require written communication, including captions, to support their understanding and responsiveness.                  | A user working during a time of extreme fatigue or high stress, which may impair their cognitive abilities. They may use captions or written communication as a support tool to ensure accurate information exchange.         |
| Physical  | A user with a physical disability that affects their mobility or dexterity, such as paralysis or limb loss. They may use assistive technologies, like speech recognition software or alternative input devices, to interact with customers effectively. | A user who recently underwent surgery and is recovering from a broken arm, making it difficult to type or use a mouse. They may rely on voice recognition software or speech-to-text tools to assist in their customer interactions. | A user working in an environment with limited mobility, such as a temporary workspace due to renovations or holding a baby. They may use assistive devices or alternative setups to accommodate their physical limitations.   |
| Speech    | A user with a speech impairment that affects their ability to articulate spoken words clearly. They may rely on alternative communication methods, such as text-based chat or pre-recorded messages, to assist in their interactions.                   | A user who has undergone throat surgery and is unable to speak fluently during the recovery period. They may use text-based communication, including chat or captions, to communicate with customers effectively.                    | A user working in a noisy environment or experiencing voice strain due to a cold or illness. They may use written communication, such as captions or chat, to ensure accurate customer interactions.                          |
| Visual    | A user who is blind or visually impaired and relies on screen reader software or Braille displays to access information. They may use these assistive technologies to navigate customer requests and respond effectively.                               | A user recovering from eye surgery or wearing temporary eye patches, which affects their vision. They may require screen magnification tools or enlarged captions to assist in their customer interactions.                          | A user working in a dimly lit environment or experiencing temporary vision difficulties due to eye strain. They may rely on high-contrast interfaces, larger fonts, or captions to ensure clear communication with customers. |

## Talkdesk accessibility goals

Our ambition should be to make **Talkdesk products WCAG 2.1 level A and level AA compliant**.

This achievement will contribute to being compliant with standards and guidelines such as,

* [EN 301 549 "Accessibility requirements for ICT products and services"](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/02.01.02_60/en_301549v020102p.pdf) from the European Standards Organizations (ESOs), [CEN](https://www.cen.eu/), [CENELEC](https://www.cenelec.eu/), and [ETSI](https://www.etsi.org/)
* ["National accessibility requirements and standards for products and services in the European single market: overview and examples"](https://ec.europa.eu/social/BlobServlet?docId=14840\&langId=en) from the [European accessibility act (EAA)](https://ec.europa.eu/social/main.jsp?catId=1202)
* [ICT Accessibility 508 Standards and 255 Guidelines](https://www.access-board.gov/ict/)
* [Americans with Disabilities Act (ADA)](https://www.ada.gov/resources/web-guidance/)
