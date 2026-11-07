# Privacy Policy — PostReady Screenshots

**Last updated:** 31 October 2026
**Developer:** Stefan Schmidbauer

PostReady Screenshots is a Chrome extension that captures screenshots of your
browser in predefined sizes and saves them to your local Downloads folder. This
policy explains what the extension does and does not do with your data.

## Summary

**PostReady Screenshots does not collect, store, transmit, or share any personal
data.** Everything the extension does happens locally on your own computer. There
are no servers, no analytics, no tracking, and no third parties involved.

## What data the extension handles

- **Screenshots.** When you start a capture, the extension captures the visible
  web page and — depending on the area you chose — the side panel or the whole
  browser window. The images are written directly to your local Downloads
  folder. They are never uploaded or sent anywhere. The extension only compares
  the page image with the window image to place the page exactly; it does not
  otherwise read, inspect, or analyze the contents.

- **Window sharing.** To capture the side panel or the whole window, the
  extension uses Chrome's window sharing, which you start yourself in Chrome's
  sharing dialog. The stream stays on your computer and is only used to take a
  single image whenever you request a screenshot. It is never recorded or
  transmitted. You can stop sharing at any time from Chrome's sharing indicator
  or by closing the Studio window.

- **The active tab's title.** It is shown in the Studio's window list and, if
  your file name pattern contains `{title}`, used in the local file name. It is
  not stored anywhere else and never leaves your device.

- **Your settings.** Your format library (categories, names, sizes), the
  selected format and your other preferences are stored locally on your device
  using Chrome's `storage` API so they are remembered between sessions. These
  settings never leave your computer and contain no personal information.

## What the extension does NOT do

- It does **not** collect or transmit any personal or sensitive information.
- It does **not** use analytics, telemetry, cookies, or tracking of any kind.
- It does **not** send data to the developer or to any third-party server.
- It does **not** sell or share any data with anyone.
- It does **not** inject scripts into web pages or monitor your browsing.

## Permissions

PostReady Screenshots requests only the permissions required for its screenshot
functionality: capturing the visible tab and the shared window, saving files to
Downloads (and briefly hiding the download bubble so it does not appear in the
next screenshot), reading the screen size to fit the window, and storing your
settings. None of these permissions are used to collect or transmit data. A
detailed justification for each permission is available in
[STORE.md](STORE.md).

## Data storage and retention

- Screenshots are saved to your local Downloads folder and remain fully under
  your control. You can delete them at any time.
- Settings are stored locally by Chrome and are removed when you uninstall the
  extension.

The developer has no access to any of this data.

## Children's privacy

PostReady Screenshots does not knowingly collect any data from anyone, including
children.

## Changes to this policy

If this policy changes, the updated version will be published at the same
location with a new "Last updated" date.

## Contact

For privacy questions or data requests, email support@ancroo.com. To report a
security vulnerability, please use [GitHub's private vulnerability
reporting](https://github.com/Stefan-Schmidbauer/postready-screenshots/security/advisories/new)
rather than a public issue. For other, non-sensitive questions you can open an
[issue](https://github.com/Stefan-Schmidbauer/postready-screenshots/issues).
