# Tool logo sources

Logos for the Tools section. None of them was drawn, redrawn, recoloured or inverted here:
eleven are copied unchanged from the simple-icons package, five are the projects' own official
files, copied byte for byte. Every file was read as text before use and holds no script, event
handler, `foreignObject` or external reference (the Jenkins file's RDF metadata names the Dublin
Core type URI as an identifier; nothing is loaded from it; the Xray file's one reference points
to a PNG embedded in the same file).

The names and logos are trademarks of their owners. They appear only to name the tools the
site's owner uses, which is nominative use; none of them implies endorsement. The site footer
credits the logos whose licences ask for attribution (Jenkins, Git, Playwright) on both pages.

`src/lib/tools.ts` names the file each tool shows; a unit test checks that every file here is
shown and has a row below.

## simple-icons 16.38.0

Package licence: CC0-1.0 (https://github.com/simple-icons/simple-icons). CC0 covers the
package; it does not override each brand's trademark rules. Brand colour is the package's `hex`
field.

| File | Brand | Hex | Source the package lists | Licence or brand note |
| --- | --- | --- | --- | --- |
| typescript.svg | TypeScript | #3178C6 | https://www.typescriptlang.org/branding | Trademark of Microsoft; guidelines: https://www.typescriptlang.org/branding |
| cypress.svg | Cypress | #69D3A7 | https://www.cypress.io/press-kit | Trademark of Cypress.io |
| cucumber.svg | Cucumber | #23D96C | https://cucumber.io | Trademark of its owner |
| appium.svg | Appium | #EE376D | https://github.com/openjs-foundation/artwork/blob/270575392800eb17a02612203f6f0d5868c634a7/projects/appium/appium-icon-mono.svg | Trademark of the OpenJS Foundation; guidelines: its artwork repository |
| postman.svg | Postman | #FF6C37 | https://www.getpostman.com/resources/media-assets/ | Trademark of Postman, Inc. |
| k6.svg | k6 | #7D64FF | https://commons.wikimedia.org/wiki/File:K6-logo.svg | Trademark of Grafana Labs |
| apache.svg | Apache JMeter row (Apache feather) | #D22128 | https://www.apache.org/foundation/press/kit | Apache-2.0; marks policy: https://www.apache.org/foundation/marks. The JMeter row shows the feather alone, at the owner's request: simple-icons' `apachejmeter.svg` is the feather plus the "JMeter" wordmark, which reads as a smudge at 20px, so the package's `apache.svg` (the Apache feather, with its small ™ mark, unchanged) is used instead, with its own hex for hover. On the page the feather's box is 24px (laid out at 20px) and turned 20° in CSS so it runs diagonally; the file itself is unchanged |
| githubactions.svg | GitHub Actions | #2088FF | https://github.com/features/actions | Trademark of GitHub, Inc. |
| docker.svg | Docker | #2496ED | https://www.docker.com/company/newsroom/media-resources | Trademark of Docker, Inc. |
| git.svg | Git | #F03C2E | https://git-scm.com/community/logos | CC-BY-3.0 (Git logo by Jason Long); credited in the site footer with a link to the licence |
| jira.svg | Jira | #0052CC | https://atlassian.design/resources/logo-library | Trademark of Atlassian; guidelines: https://atlassian.design/foundations/logos/ |

## Official files (not in simple-icons)

| File | Brand | Downloaded from | Same file also at | Licence or brand note |
| --- | --- | --- | --- | --- |
| playwright.svg | Playwright | https://playwright.dev/img/playwright-logo.svg | https://raw.githubusercontent.com/microsoft/playwright.dev/main/static/img/playwright-logo.svg (identical bytes) | The microsoft/playwright.dev repository is CC-BY-4.0; Playwright is a Microsoft project (microsoft/playwright, Apache-2.0) and its name and logo are Microsoft trademarks. Credited in the site footer with a link to the licence |
| maestro.svg | Maestro | https://maestro.dev/favicon.svg (the site's own mark: white mark on a black tile) | none | Maestro by mobile.dev (mobile-dev-inc/Maestro, Apache-2.0); no public brand guidelines found; the mark is a trademark of its owner. Light-theme file, at rest and on hover |
| maestro-reversed.svg | Maestro (reversed: near-black #141415 mark on a white tile) | https://raw.githubusercontent.com/mobile-dev-inc/Maestro/main/.idea/icon.svg (the project's own icon in its official repository) | none | Same owner and licence as above. Dark-theme file, at rest and on hover, because the official black tile disappears on the graphite ground |
| jenkins-official.svg | Jenkins (full-colour butler) | https://www.jenkins.io/images/logos/jenkins/jenkins.svg (the jenkins.io logo page) | none | CC-BY-SA-3.0 Unported, per https://www.jenkins.io/artwork/: "you must include an attribution to the Jenkins project, with a link (https://jenkins.io/), if you display these logos". Credited in the site footer: the Jenkins project with that link, and the licence |
| xray.svg | Xray | https://www.getxray.app/wp-content/uploads/2026/08/Xray-Logo-by-Sembi.svg (the logo in the site header) | none | The site states "© 2026 Xray. All rights reserved."; no public brand guidelines found; trademark of its owner. The file embeds one small PNG texture as a `data:` URI inside the SVG; it references nothing outside the file |

## How the page shows them

Each logo keeps the same artwork at rest and on hover; only the colour changes. The simple-icons
marks are an alpha mask filled with the theme's muted text colour at rest and with the package's
hex while the pointer rests on the tool. The four official files (Playwright, Jenkins, Maestro,
Xray) are shown as themselves in both states: at rest through `grayscale(1)`, a brightness step
and reduced opacity, tuned per theme so the mark keeps at least 3:1 against the ground (paper:
brightness 0.5, opacity 0.85; graphite: brightness 1.8, opacity 0.78, with Jenkins at 2.2 and
Xray at 1.25; Maestro's one-tone tile keeps brightness 1); on hover the filter lifts to full
colour. Xray's file is shown cropped to its mark. Maestro is `maestro.svg` on paper and
`maestro-reversed.svg` on graphite.
