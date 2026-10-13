// Verified physical Phoenixborn reprints; retain canonical card IDs and original releases.
// Independent of the upstream snapshot so update-data cannot erase these memberships.
// Corpse roster also documented in https://ashesdb-media.plaidhatgames.com/pdf/faq7.pdf
export const REPRINT_SETS = [
  {
    "name": "The Corpse of Viros",
    "stub": "the-corpse-of-viros",
    "phoenixborn": [
      "noah-redmoon",
      "jessa-na-ni",
      "coal-roarkwin",
      "brennen-blackcloud"
    ],
    "source": "https://www.plaidhatgames.com/product/ashes-reborn-corpse-viros/"
  },
  {
    "name": "The Frostwild Scourge",
    "stub": "the-frostwild-scourge",
    "phoenixborn": [
      "aradel-summergaard",
      "koji-wolfcub",
      "lulu-firststone",
      "rin-northfell"
    ],
    "source": "https://www.plaidhatgames.com/product/ashes-reborn-red-rains-frostwild-scourge/"
  },
  {
    "name": "The Blight of Neverset",
    "stub": "the-blight-of-neverset",
    "phoenixborn": [
      "maeoni-viper",
      "saria-guideman",
      "leo-sunshadow",
      "astrea"
    ],
    "source": "https://www.plaidhatgames.com/product/ashes-reborn-red-rains-the-blight-of-neverset/"
  },
  {
    "name": "The Siege of Lordswall",
    "stub": "the-siege-of-lordswall",
    "phoenixborn": [
      "odette-diamondcrest",
      "james-endersight",
      "xander-heartsblood",
      "dimona-odinstar"
    ],
    "source": "https://www.plaidhatgames.com/product/ashes-reborn-red-rains-the-siege-of-lordswall/"
  },
  {
    "name": "The Spawn of Shadowreck",
    "stub": "the-spawn-of-shadowreck",
    "phoenixborn": [
      "rimea-careworn",
      "sembali-grimtongue",
      "victoria-glassfire",
      "hope-everthorn"
    ],
    "source": "https://www.plaidhatgames.com/product/ashes-reborn-red-rains-the-spawn-of-shadowreck/"
  },
  {
    "name": "The Flood of Moon Cove",
    "stub": "the-flood-of-moon-cove",
    "phoenixborn": [
      "echo-greystorm",
      "namine-hymntide",
      "harold-westraven",
      "fiona-mercywind"
    ],
    "source": "https://www.plaidhatgames.com/product/ashes-reborn-red-rains-the-flood-of-moon-cove/"
  },
  {
    "name": "The End of Argaia",
    "stub": "the-end-of-argaia",
    "phoenixborn": [
      "jericho-reborn",
      "tristan-darkwater",
      "orrick-gilstream",
      "rowan-umberend"
    ],
    "source": "https://www.plaidhatgames.com/product/pre-order-ashes-reborn-red-rains-the-end-of-argaia/"
  }
];
const extraReleases = new Map();
for (const {stub,name,phoenixborn} of REPRINT_SETS) {
 for (const id of phoenixborn) extraReleases.set(id,[...(extraReleases.get(id)||[]),{stub,name}]);
}
export function cardReleases(card) {
 const releases=[...(card?.release?[card.release]:[]),...(extraReleases.get(card?.stub)||[])];
 return [...new Map(releases.map(r=>[r.stub,r])).values()];
}
export const inRelease = (card,stub) => cardReleases(card).some(r=>r.stub===stub);
export const isOwnedCard = (card,owned) => cardReleases(card).some(r=>owned.includes(r.stub));
