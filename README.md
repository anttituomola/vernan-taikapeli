# Vernan taikapolku

Selainpeli 6-vuotiaalle: prinsessa ja yksisarvinen seikkailevat
taikametsässä, puutarhassa, jäällä, lammella, kuutamotaivaalla,
kristalliluolassa, noidan suolla ja sateenkaarisillalla — ja lopuksi
pelastavat puput linnan Myrskynoidalta.

## Tiedostot

Peli on jaettu osiin, jotta uusia vaiheita on helppo lisätä:

- `index.html` — kuori ja script-järjestys
- `css/game.css` — napit ja karttanäyttö
- `js/state.js` — jaettu tila, kartta (`HUB_MAP`, `HUB_ROOMS`, `HUB_ORDER`)
- `js/audio.js` — WebAudio
- `js/progress.js` — edistymisen tallennus (localStorage), sydämet, tarkistuspisteet
- `js/world.js` — koko, taustojen esirenderöinti
- `js/draw-actors.js` — tähti, pupu, yksisarvinen
- `js/fx.js` — kipinät, konfetti, opastenuoli
- `js/flow-hub.js` — karttalabyrintti ja vaiheen käynnistys
- `js/play-forest.js` — metsä + tehtäväkaarten perusrunko
- `js/tasks-extra.js` — uudet tehtävätyypit (vähennys, kuvio, vertailu, rytmi)
- `js/play-garden.js` … `play-sky.js` — vaiheet 2–5
- `js/platformer.js` — jaettu tasohyppelyfysiikka (liikkuvat tasot, kantaminen)
- `js/play-cave.js`, `play-swamp.js`, `play-bridge.js` — vaiheet 6–8
- `js/play-finale.js` — linnan finaali
- `js/phases.js` — vaiheen sauma: `init/update/draw/tap/resize/renderBg/respawn`
- `js/update-draw.js` + `js/main.js` — silmukka ja syöte

**Uusi vaihe** = tiedosto `js/play-….js`, rivi `PHASES`-olioon (phases.js),
huone `HUB_ROOMS`-karttaan ja kirjain `HUB_MAP`iin sekä `HUB_ORDER`iin.
Silmukka, syöte ja koko kulkevat `PHASES`-koukkujen kautta, joten muuta
koodia ei tarvitse muokata.

## Siirto tabletille

Kopioi koko kansio (html + `css/` + `js/`). Avaa `index.html` Chromella,
tai käytä Vercel-osoitetta. Edistyminen tallentuu selaimeen; sen voi nollata
konsolista `VT.resetProgress()`.

## Kartta

Aloitus on labyrintti. Huoneet ovat portteja: jokainen on läpäistävä, jotta
tie jatkuu. Kun kaikki kahdeksan on läpäisty, linna hehkuu ja avaa finaalin.

- **Metsä** — tähdet, puput, peikko, väriloitsut, laskutehtävä
- **Puutarha** — hyppy, perhoset, pöllö, lasku + muisti
- **Jää** — liukas ratsastus, hiutaleet, kettu, lumipallot
- **Lampi** — lumpeet, helmet, sammakko, sauva
- **Taivas** — lento, kuut, tuulenpuuskat, pilvilammas
- **Kristalliluola** ♥ — pimeä tasohyppely: valo vain prinsessan ympärillä,
  liikkuvat tasot, tippuvat tippukivet, lepakot (sauva tainnuttaa), vesikuilut.
  Tehtävät: vähennyslasku, kuviosarja.
- **Noidan suo** ♥ — ratsastus sumussa: virvatulet näkevät edestä tulijan ja
  karkaavat — lähesty takaa. Noita luudalla pudottaa sammakoita.
  Tehtävät: rytmi (taputa iskut perässä) ×2, muistiloitsu 5 väriä / 4 palloa.
- **Sateenkaarisilta** ♥ — ruutu vierii itsestään ja nopeutuu: lennä
  renkaiden läpi, väistä ukkospilviä. Ohi mennyt rengas vie sydämen ja
  ilmestyy uudelleen edemmäs — opastenuoli näyttää sen, kunnes se on kerätty.
  Lopussa jäljellä olevat renkaat leijuvat prinsessan ulottuville.
  Tehtävä: kummalla puolella on enemmän.
- **Linna (finaali)** ♥ — Myrskynoidan suojapallot välähtävät järjestyksessä;
  ammu ne sauvalla samassa järjestyksessä (3 kierrosta, sarja pitenee 3→5).
  Salamat pakottavat liikkumaan, väärä pallo heittää sammakon. Sitten
  kolme pupua vapautetaan häkeistä tehtävillä, ja kaikki ystävät juhlivat.

♥ = **sydämet käytössä**: 3 sydäntä, osuma vie yhden. Kun sydämet loppuvat,
palataan viimeiselle sytytetylle lyhdylle ja lyhdyn jälkeen kerätyt esineet
palautuvat. Kenttä itse ei ala alusta.

**Kartta**-nappi palauttaa labyrinttiin.

## Ohjaus

- Metsä, jää ja suo: pidä sormea pohjassa ratsastaaksesi, napauta kerätäksesi.
- Puutarha, lampi, luola ja finaali: pidä pohjassa juostaksesi, **↑** hyppää,
  lyhyt napautus ampuu sauvalla.
- Taivas ja silta: pidä pohjassa lentääksesi sormea kohti, **↑** on siivenisku.
- Rytmitehtävä: kuuntele iskut, taputa sama kuvio mihin tahansa ruudulla.
  Tempo saa heittää, kuvion pitää täsmätä.

## Vaikeuden säätö

- Sydänten määrä: `HEART_MAX` (progress.js)
- Pupujen ja kurkkimisajat, peikko, pilvet: play-forest.js / update-draw.js
- Luola: lepakoiden nopeus `viewW * 0.065`, tippukiven varoitus `1.1` s ja putoamiskiihtyvyys `viewH * 1.15`, kuilujen leveys `caveGround`, valon säde `viewH * 0.72` (play-cave.js)
- Suo: noidan pudotusväli `3.2 + Math.random() * 1.4`, sammakon loikat `bounces > 3`
- Silta: vieritysnopeudet `BRIDGE_SEGMENT_SPEEDS`
- Finaali: kierrokset `BOSS_ROUNDS`, sarjan pituus `3 + boss.round`, salaman väli `3.0 + …`
- Rytmin sallittu heitto: `tol = Math.max(0.15, want * 0.32)` (tasks-extra.js)
- Muistiloitsun pituus ja pallot: `makeTask(fx, 'memory', { seqLen, orbs })`

## Tekniikka

Canvas 2D, ei riippuvuuksia. Tausta esirenderöidään (isot maailmat
pienennettynä vanhojen laitteiden canvas-rajan takia). Äänet WebAudiolla.

Testaus: `window.VT` on testauskahva — `VT.play('cave')`, `VT.tick(dt)`,
`VT.hold(true, x, y)`, `VT.jump()`, `VT.taskTap(x, y)`, `VT.hearts()`,
`VT.showHub()`, `VT.info()`. Paikallinen palvelin tarvitaan (tiedostot
ladataan erillisinä): `node tools/serve.js` ja avaa http://localhost:8765.
