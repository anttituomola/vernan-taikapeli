# Vernan taikapolku

Selainpeli 6-vuotiaalle: prinsessa ja yksisarvinen seikkailevat
taikametsässä, puutarhassa, jäällä, lammella ja kuutamotaivaalla.

## Tiedostot

Peli on jaettu osiin, jotta uusia vaiheita on helppo lisätä:

- `index.html` — kuori ja script-järjestys
- `css/game.css` — napit ja karttanäyttö
- `js/state.js` — jaettu tila
- `js/audio.js` — WebAudio
- `js/world.js` — koko, taustat
- `js/draw-actors.js` — tähti, pupu, yksisarvinen
- `js/fx.js` — kipinät, konfetti
- `js/flow-hub.js` — karttalabyrintti ja vaiheen käynnistys
- `js/play-forest.js` … `play-sky.js` — vaiheet
- `js/phases.js` — vaiheen sauma (`init`, ohjaus, seuraava)
- `js/update-draw.js` + `js/main.js` — silmukka ja syöte

Uusi vaihe: tiedosto `js/play-….js`, rivi `PHASES`-olioon, huone `HUB_ROOMS`-karttaan.

## Siirto tabletille

Kopioi koko kansio (html + `css/` + `js/`). Avaa `index.html` Chromella,
tai käytä Vercel-osoitetta.

## Kartta

Aloitus on labyrintti. Huoneet:

- **Metsä** — tähdet, puput, peikko, väriloitsut, laskutehtävä
- **Puutarha** — hyppy, perhoset, pöllö, lasku + muisti
- **Jää** — liukas ratsastus, hiutaleet, kettu, lumipallot
- **Lampi** — lumpeet, helmet, sammakko, sauva
- **Taivas** — lento, kuut, tuulenpuuskat, pilvilammas

**Kartta**-nappi palauttaa labyrinttiin. **Jatka** vie tarinassa seuraavaan
vaiheeseen.

## Ohjaus

- Metsä ja jää: pidä sormea pohjassa ratsastaaksesi, napauta kerätäksesi.
- Puutarha ja lampi: pidä pohjassa juostaksesi, **↑** hyppää, lyhyt napautus ampuu.
- Taivas: pidä pohjassa lentääksesi sormea kohti, **↑** on siivenisku.

## Tekniikka

Canvas 2D, ei riippuvuuksia. Tausta esirenderöidään. Äänet WebAudiolla.
`window.VT` on testauskahva (`play('ice')`, `showHub()`, `tick`).
