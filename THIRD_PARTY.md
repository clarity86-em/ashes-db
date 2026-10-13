# Third-party attribution

## Ashes card data and preconstructed decks

Source: [Ashteki/ashteki](https://github.com/Ashteki/ashteki), derived in turn from the Ashes.live community database.
Snapshot revision and date are recorded in `data/meta.json`.

Imported files:
- `data/cards/all-cards.json`
- `data/cards/kanna-galeheart.json`
- `data/cards/maeve-luminvale.json`
- `data/decks/precon-core.json`
- `data/decks/precon-pve.json`
- `data/decks/precon-ascendancy.json`

Upstream software/data repository license: GNU Affero General Public License version 3. A full copy is included in `LICENSE`. This project is distributed under AGPL-3.0-or-later as well. Its original source must remain available when you distribute or operate modified versions, subject to that license.

The dataset is normalized and deduplicated by card stub, with a release label added to the two Natural Magic files. Unsupported preconstructed decks with missing card records are omitted. No card rules have been invented or filled in by AI. Some upstream records lack rules text; the UI identifies this and links to the card's source.

## Art and game content

Ashes, Ashes Reborn, Ashes Ascendancy, game rules, card text and card illustrations belong to Plaid Hat Games and their respective owners. The software license does not confer rights to those separate assets. Card images are requested from the image URLs used by Ashteki (`https://cdn.ashes.live/images/cards/`); they are not copied into this repository. Availability depends on that third-party CDN. This is an unofficial, noncommercial fan tool, not an official Plaid Hat Games service.

## Interface

### Ashes dice and action symbols

`src/ashes-symbols.js` contains SVG outlines extracted from Ashteki's `client/assets/fonts/phg-ashes.woff` at revision `13b9078f1b63f7ff11b2f27b89da71a163498b12` (Git blob `43f52f59c68c5c69a24885f8a9f9dd9b92f2a9a3`). Character mappings come from `client/styles/_phg-ashes.scss`; printed die colours follow `client/Components/GameBoard/Die.scss` at the same revision. Outlines are unchanged, with SVG view boxes added for sizing. No font download is required at runtime.

Original font notice: "Copyright (C) 2026 by original authors @ fontello.com". The upstream repository is AGPL-3.0. Ashes symbols remain game content belonging to Plaid Hat Games; the repository's software license does not grant separate rights to the game's intellectual property.

Source: https://github.com/Ashteki/ashteki/tree/13b9078f1b63f7ff11b2f27b89da71a163498b12/client/assets/fonts

The interface is independently implemented. NetrunnerDB, ArkhamDB and MarvelCDB inspired its searchable tables and adjacent deck editor. No source code, logos or stylesheets from those sites are included.

Optional font CSS is loaded from Google Fonts (Inter and Noto Sans KR, SIL Open Font License). System fonts are the fallback; no font files are redistributed.

## Online hosting and authentication

The online version uses the Sites Vinext starter with React, Vinext and Cloudflare D1. Dependency licenses are retained by the package manager; the Sites Vite plugin license is kept in `build/sites-vite-plugin.LICENSE`. ChatGPT sign-in is platform-managed. No login secrets or personal decks are included in this source repository.
