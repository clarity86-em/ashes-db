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

The interface is independently implemented. NetrunnerDB, ArkhamDB and MarvelCDB inspired its searchable tables and adjacent deck editor. No source code, logos or stylesheets from those sites are included.

Optional font CSS is loaded from Google Fonts (Inter and Noto Sans KR, SIL Open Font License). System fonts are the fallback; no font files are redistributed.
