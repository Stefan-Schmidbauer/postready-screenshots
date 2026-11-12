# Chrome Web Store Submission — PostReady Screenshots

This file contains the text and justifications to paste into the Chrome Web
Store Developer Dashboard when publishing PostReady Screenshots. It is
documentation for the submitter and is not shipped as part of the extension's
runtime.

Every block meant for the dashboard is in a fenced code block and is verbatim
paste-ready: no quote markers, no line wrapping — copy the whole block as is.

---

## Store listing

**Name:** comes from `_locales/*/messages.json` (`extName`) — nothing to enter.

`PostReady Screenshots` in both languages — kept short like the other
extensions; the keywords live in the summary and the description.

**Category:** Productivity

**Summary (short description, max 132 characters):** also from
`_locales/*/messages.json` (`extDescription`).

**Detailed description (English, default language):**

```text
Screenshots that are ready to post – in the exact size every platform asks for.

Most screenshot tools capture whatever is on screen and leave the cropping to you. PostReady works the other way round: pick the target format – say "LinkedIn portrait" or "Chrome Web Store" – and PostReady resizes the browser window so the captured area matches it pixel for pixel. One click, and the image is saved in the right size as PNG or JPEG.

What makes it different:
• Exact sizes, no cropping: the window adapts to the format, not the other way round
• Captures more than the page: the web page only, the page including the side panel, or the whole browser window with tabs and toolbar – ideal for presenting browser extensions
• Sharp on HiDPI screens: high-resolution displays are captured at full resolution and scaled down cleanly to the target size
• Lossless page content: the web page itself is captured pixel-perfect; only the side panel and the browser interface come from the window share

44 formats included – fully editable:
• LinkedIn: landscape, square, portrait, carousel, article/newsletter cover
• X/Twitter images, YouTube thumbnails, Open Graph social cards, Product Hunt gallery
• Articles and blogs: Medium, Substack, dev.to, Hashnode, header and inline images
• README & docs: GitHub social preview, README hero, screenshot and banner images, docs pages
• Chrome Web Store, Firefox Add-ons, Edge Add-ons, Mac App Store
• Common screen sizes from HD to 4K
Sort formats into your own categories, rename them and add your own sizes.

Fast workflow:
• Choose a category and a size in the popup, then click "Screenshot" – or press Alt+Shift+S
• Enter a file name once: images are saved as name-format-timestamp.png in a subfolder of your Downloads folder (or ask where to save each time)
• Optional countdown, so you can open a menu or a hover state before the capture
• “Free height”: only the width is fixed — drag the window taller or shorter by hand, the screenshot keeps it
• PNG or JPEG with adjustable quality

How it works: capturing the side panel or the whole window requires Chrome's window sharing. The first time, PostReady opens a small Studio window and asks you to pick the browser window in Chrome's standard sharing dialog. Keep the Studio open (minimised is fine) and every further screenshot takes a single click. "Web page only" works without window sharing.

Privacy first: PostReady collects no data, uses no analytics and never sends anything to any server. Every image is written straight to your local Downloads folder.

Good to know:
• Chrome doesn't let extensions capture internal pages (chrome://) or the Chrome Web Store directly. In "Page + side panel" and "Whole window" mode these pages still work via window sharing; "Web page only" doesn't.
• Very large formats such as 4K (3840 × 2160) need a large enough screen – or switch the size unit to physical screen pixels in the settings.
• Available in English and German.

Free and open source (MIT licence) — the full source is on GitHub, so you can read exactly what it does before you install it.

Questions or feedback? Email support@ancroo.com — happy to help.

PostReady is an independent project and not affiliated with or endorsed by any of the platforms named above. Product names are used only to describe image formats; all trademarks belong to their respective owners.

Source code, issues and licence:
https://github.com/Stefan-Schmidbauer/postready-screenshots

Privacy policy:
https://github.com/Stefan-Schmidbauer/postready-screenshots/blob/main/PRIVACY.md
```

**Detailed description (German):** dashboard → *Store listing* → language
selector → *German*.

```text
Screenshots, die sofort gepostet werden können – in genau der Größe, die jede Plattform verlangt.

Die meisten Screenshot-Tools nehmen auf, was gerade auf dem Bildschirm ist, und überlassen dir das Zuschneiden. PostReady macht es umgekehrt: Du wählst das Zielformat – etwa „LinkedIn hochkant“ oder „Chrome Web Store“ – und PostReady passt das Browserfenster so an, dass der aufgenommene Bereich pixelgenau stimmt. Ein Klick, und das Bild ist in der richtigen Größe als PNG oder JPEG gespeichert.

Was PostReady anders macht:
• Exakte Größen statt Zuschneiden: Das Fenster passt sich dem Format an, nicht umgekehrt
• Mehr als nur die Seite: nur die Webseite, die Seite inklusive Sidepanel oder das ganze Browserfenster mit Tabs und Symbolleiste – ideal, um Browser-Extensions zu präsentieren
• Scharf auf HiDPI-Bildschirmen: Hochauflösende Displays werden mit voller Auflösung aufgenommen und sauber auf die Zielgröße verkleinert
• Verlustfreier Seiteninhalt: Die Webseite selbst wird pixelgenau aufgenommen; nur Sidepanel und Browser-Oberfläche stammen aus der Fensterfreigabe

44 Formate inklusive – frei anpassbar:
• LinkedIn: quer, quadratisch, hochkant, Karussell, Artikel-/Newsletter-Titelbild
• Bilder für X/Twitter, YouTube-Thumbnails, Open-Graph-Social-Cards, Product-Hunt-Galerie
• Artikel und Blogs: Medium, Substack, dev.to, Hashnode, Titel- und Artikelbilder
• README & Docs: GitHub Social Preview, README-Titel-, Screenshot- und Bannerbilder, Docs-Seiten
• Chrome Web Store, Firefox Add-ons, Edge Add-ons, Mac App Store
• Gängige Bildschirmformate von HD bis 4K
Sortiere Formate in eigene Kategorien, benenne sie um und lege eigene Größen an.

Schneller Ablauf:
• Im Popup Kategorie und Größe wählen, dann „Screenshot“ klicken – oder Alt+Shift+S drücken
• Dateinamen einmal eintragen: Bilder werden als name-format-zeitstempel.png in einem Unterordner deines Download-Ordners gespeichert (oder auf Wunsch jedes Mal mit Nachfrage)
• Optionaler Countdown, um vor der Aufnahme noch ein Menü oder einen Hover-Zustand zu öffnen
• „Höhe frei“: Nur die Breite ist fest – zieh das Fenster von Hand länger oder kürzer, der Screenshot übernimmt das
• PNG oder JPEG mit einstellbarer Qualität

So funktioniert es: Für das Sidepanel und das ganze Fenster braucht es die Fensterfreigabe von Chrome. Beim ersten Mal öffnet PostReady ein kleines Studio-Fenster und bittet dich, im üblichen Freigabedialog von Chrome das Browserfenster auszuwählen. Lass das Studio geöffnet (minimiert reicht), dann genügt für jeden weiteren Screenshot ein Klick. „Nur Webseite“ funktioniert ohne Fensterfreigabe.

Datenschutz zuerst: PostReady erhebt keine Daten, nutzt keine Analyse und sendet nichts an irgendeinen Server. Jedes Bild landet direkt in deinem lokalen Download-Ordner.

Gut zu wissen:
• Chrome erlaubt Extensions nicht, interne Seiten (chrome://) oder den Chrome Web Store direkt aufzunehmen. Mit „Seite + Sidepanel“ und „Ganzes Fenster“ klappt es über die Fensterfreigabe trotzdem, mit „Nur Webseite“ nicht.
• Sehr große Formate wie 4K (3840 × 2160) brauchen einen ausreichend großen Bildschirm – oder du stellst die Größenangabe in den Einstellungen auf physische Bildschirmpixel um.
• Verfügbar auf Deutsch und Englisch.

Kostenlos und Open Source (MIT-Lizenz) – der komplette Quellcode liegt auf GitHub, du kannst also vor der Installation nachlesen, was die Erweiterung tut.

Fragen oder Feedback? Schreib an support@ancroo.com – ich helfe gern.

PostReady ist ein unabhängiges Projekt und steht in keiner Verbindung zu den oben genannten Plattformen. Produktnamen dienen nur zur Bezeichnung der Bildformate; alle Marken gehören ihren jeweiligen Inhabern.

Quellcode, Issues und Lizenz:
https://github.com/Stefan-Schmidbauer/postready-screenshots

Datenschutzerklärung:
https://github.com/Stefan-Schmidbauer/postready-screenshots/blob/main/PRIVACY.md
```

Note: the description is plain text — URLs are shown but **not** clickable. The
clickable links in the listing come from the dedicated URL fields below, so fill
in both.

**Additional fields (store listing → Additional fields):**

| Field | Value |
|---|---|
| Homepage URL | `https://github.com/Stefan-Schmidbauer/postready-screenshots` |
| Support URL | `https://github.com/Stefan-Schmidbauer/postready-screenshots/issues` |
| Contact email (Account tab) | `support@ancroo.com` — the public address for users, never the login of the publisher account |

**Privacy policy URL:**

```text
https://github.com/Stefan-Schmidbauer/postready-screenshots/blob/main/PRIVACY.md
```

The repo must be public for this to resolve for reviewers and users — it is the
same URL the About section in the settings links to.

---

## Single purpose (required field)

```text
PostReady Screenshots captures screenshots of the browser – the web page, optionally including the side panel or the whole browser window – in exact, predefined pixel sizes for social media, blogs and app stores, and saves them as image files to the local Downloads folder.
```

---

## Permission justifications

Paste each justification into the matching field in the dashboard (*Privacy*
tab). The blocks are in the order the dashboard shows the fields. Limit: 1000
characters each. Because of the host permission, the dashboard warns that the
item may need an in-depth review that delays publishing — expected, nothing to
do about it.

### `desktopCapture`

```text
Required to capture the browser side panel and the browser's own interface (tab strip, toolbar), which chrome.tabs.captureVisibleTab cannot capture. The user explicitly picks the browser window in Chrome's standard window-sharing dialog, started from the extension's Studio window. The stream is only used locally to take a single frame per screenshot the user requests; it is never recorded, stored or transmitted, and sharing can be stopped at any time from Chrome's sharing indicator or by closing the Studio window.
```

### `downloads` (also covers `downloads.ui`)

The dashboard has no separate field for `downloads.ui`, so its use is explained
here.

```text
Required to save each screenshot as an image file (PNG or JPEG) into a subfolder of the user's Downloads folder, optionally with the "Save as" dialog. This is the extension's core output mechanism. The folder button in the popup and the Studio window uses chrome.downloads.show to open the folder of the last screenshot in the file manager (or the Downloads folder if there is none yet). The downloads.ui permission is used only to hide Chrome's download bubble while a screenshot is being saved, so it does not appear in the next screenshot of the browser window; it is re-enabled as soon as the download has finished, or after 15 seconds at the latest, and the user can turn this off in the settings.
```

### `storage`

```text
Used to remember the user's own settings locally via chrome.storage.local: the format library (categories, names and pixel sizes), the selected format, capture area, file type, file name and save options. chrome.storage.session holds the result of the last capture so the popup can show it. No data is transmitted; storage is entirely local.
```

### `system.display`

```text
Reads the work area of the display the browser window is on, so the extension can check whether the requested capture size fits on that screen before resizing the window, keep the resized window inside the visible area, and tell the user clearly when a format is too large for their screen.
```

### Host permission: `<all_urls>`

```text
chrome.tabs.captureVisibleTab requires host access to the page being captured, and the user decides which page that is – their own product, a blog or any other site, so the host is not known in advance. Captures are triggered from the popup, from keyboard shortcuts and from the extension's Studio window; from the Studio window activeTab is not granted, so host access is required. The tab image is used to insert the page content losslessly into the screenshot and to measure the display's pixel ratio. The tab title is shown in the Studio's window list and can optionally be used in the file name. The extension injects no scripts, reads no page content other than the captured pixels, makes no network requests and only acts when the user starts a capture.
```

---

## Remote code

Select **No, I am not using remote code**. The justification field stays empty:
all logic ships inside the package, no external scripts are loaded and nothing is
evaluated via `eval()`.

## Data usage disclosures (Privacy practices tab)

**Read this before ticking the boxes.** "Collect" here does *not* mean "sent to
the developer". Google's [User Data
FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
requires disclosure even when data is processed or stored only locally on the
user's device. So a category gets **Yes** if the extension *touches* that data
at all. "It never leaves the device" belongs in the certifications below and in
[PRIVACY.md](PRIVACY.md), not in a **No** here.

Answer the "What user data do you collect" checklist as follows:

- Personally identifiable information: **No**
- Health information: **No**
- Financial and payment information: **No**
- Authentication information: **No**
- Personal communications: **No**
- Location: **No**
- Web history: **No** *(only the active tab's title is read, to show it in the
  Studio's window list and optionally in a local file name; URLs and visit times
  are never read or stored)*
- User activity: **No** *(no clicks, scrolling, mouse position or keystrokes are
  logged; the keyboard shortcuts are Chrome commands, not key logging)*
- **Website content: Yes** — a screenshot of the rendered page is website content
  (the dashboard lists "text, images, sounds, videos or hyperlinks" as examples).
  This is the one box that must be ticked.

The form has no justification field for the categories; the explanation lives in
[PRIVACY.md](PRIVACY.md), whose URL goes into the *Privacy policy URL* field.

Certifications (all must be checked / true):

- ☑ I do not sell or transfer user data to third parties, apart from the
  approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my
  item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for
  lending purposes.

---

## Store icon

Upload `store-assets/icon128.png` (128×128), so everything the dashboard needs
is in `store-assets/`. It is a copy of `icons/icon128.png` — the icon the
extension ships — so copy it again whenever that one changes. It follows Google's guidance: 96×96 artwork with 16 px of transparent
padding on each side. Unlike the screenshots and promo tiles, the icon may (and
should) keep its alpha channel.

## Promotional images

Promo tiles live in `store-assets/` (SVG sources + rendered PNGs, not shipped
inside the extension zip):

- **Small promo tile** — `store-assets/small-promo-440x280.png` (440×280)
- **Marquee promo tile** — `store-assets/marquee-1400x560.png` (1400×560)

Inkscape exports RGBA, and the store rejects images that carry an alpha channel,
so drop it after rendering:

```
inkscape store-assets/marquee-1400x560.svg -o store-assets/marquee-1400x560.png -w 1400 -h 560
inkscape store-assets/small-promo-440x280.svg -o store-assets/small-promo-440x280.png -w 440 -h 280
mogrify -alpha off -define png:color-type=2 store-assets/marquee-1400x560.png store-assets/small-promo-440x280.png
```

## Screenshots

Captured with PostReady itself where possible (format "Chrome Web Store", area
"Whole window") and kept in `store-assets/screenshots/` as `<n>-<topic>.png`
(separate from the README images in `assets/screenshots/`), uploaded in this order:

1. `1-popup.png` — the popup open over a real page.
2. `2-side-panel-result.png` — a side panel extension captured with "Page +
   side panel", which shows what other tools can't do.
3. `3-studio.png` — the Studio window next to the browser.
4. `4-settings.png` — the settings page with the format library.

Shots 1 and 3 show more than one window (popups are separate system windows),
so PostReady can't take them — use a system screenshot tool. With display
scaling, a system screenshot is larger than 1280×800 (e.g. ×1.3); capture in a
browser started with `--force-device-scale-factor=1 --lang=en` so pixels match
1:1, then crop.

Requirements: **1280×800** (640×400 also allowed but looks soft in the listing),
24-bit PNG **without** alpha, or JPEG; the image must fill the frame. At least
one is required, up to five are allowed. Check for an alpha channel before
uploading:

```
identify -format '%f %wx%h %[channels]\n' store-assets/screenshots/*.png
```

`srgb` is good, `srgba` needs `mogrify -alpha off` as above.

## Store listing URL

Extension ID: `jgplipgmkfmcknlpakfaoihdhafcgpfi` — set as the `CWS_EXTENSION_ID`
variable of the `store` environment (see [RELEASING.md](RELEASING.md); it is
public, not a credential).

Listing URL (live once the review has passed):
<https://chromewebstore.google.com/detail/jgplipgmkfmcknlpakfaoihdhafcgpfi>

Once it is live, also add the store link to the README, to the release notes in
[.github/workflows/build.yml](.github/workflows/build.yml) and a "Rate on
Chrome Web Store" link (listing URL + `/reviews`) to the About section in the
settings.

## Building and releasing

Build, CI upload and store credentials are documented in
[RELEASING.md](RELEASING.md).
