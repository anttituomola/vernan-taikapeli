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
- `js/ambient.js` — tunnelmahiukkaset, etualan siluetit ja kentän alkukortti (PHASES: `ambient`, `fg`)
- `js/flow-sea.js` — saaristokartta (ylin navigaatio), saaret ja sateenkaari
- `js/flow-hub.js` — saaren karttalabyrintti ja vaiheen käynnistys
- `js/play-forest.js` — metsä + tehtäväkaarten perusrunko
- `js/tasks-extra.js` — uudet tehtävätyypit (vähennys, kuvio, vertailu, rytmi)
- `js/play-garden.js` … `play-sky.js` — vaiheet 2–5
- `js/platformer.js` — jaettu tasohyppelyfysiikka (liikkuvat tasot, kantaminen)
- `js/play-cave.js`, `play-swamp.js`, `play-bridge.js` — vaiheet 6–8
- `js/play-finale.js` — linnan finaali
- `js/tasks-drag.js` — raahaustehtävät (muoto varjoon, täydennä kuva) ja muistipeli
- `js/play-beach.js`, `play-candy.js`, `play-tower.js` — maailma 2 (vaiheet 10–12)
- `js/play-reef.js`, `play-nightwood.js`, `play-clouds.js`, `play-moon.js` — maailma 3 (vaiheet 13–16)
- `js/play-pen.js` — Taikakynä (maailma 4, piirto-ohjauksen prototyyppi, vaihe 17)
- `js/phases.js` — vaiheen sauma: `init/update/draw/tap/resize/renderBg/respawn`
- `js/update-draw.js` + `js/main.js` — silmukka ja syöte

**Uusi vaihe** = tiedosto `js/play-….js`, rivi `PHASES`-olioon (phases.js),
huone `HUB_ROOMS`-karttaan ja kirjain `HUB_MAP`iin sekä `HUB_ORDER`iin
(maailmat 2 ja 3: `HUB_MAP2/3`, `HUB_ROOMS2/3`, `HUB_ORDER2/3`, kootaan `HUB_WORLDS`-olioon).
**Uusi saari** = rivi `ISLANDS`-taulukkoon (flow-sea.js: sijainti, vartijahuone
`finaleKind`, koristeet) ja oma sokkelo `hubMap()/hubRooms()/hubOrder()`-valintoihin.
Silmukka, syöte ja koko kulkevat `PHASES`-koukkujen kautta, joten muuta
koodia ei tarvitse muokata.

## Siirto tabletille

Kopioi koko kansio (html + `css/` + `js/`). Avaa `index.html` Chromella,
tai käytä Vercel-osoitetta. Edistyminen tallentuu selaimeen; sen voi nollata
konsolista `VT.resetProgress()`.

## Kartta

Peli alkaa **saaristokartalta**: saaret ovat maailmoja, ja vene kulkee niiden
välillä. Saaren napautus purjehduttaa veneen sinne ja avaa saaren
labyrintin; labyrintin satamaruutu (**B**) palauttaa saaristoon. Seuraava saari
aukeaa, kun edellisen saaren vartijahuone on läpäisty (Linnasaari: finaali,
Karkkisaari: Arvoitusten torni). Sumuinen saari kartan reunassa vihjaa
tulevista maailmoista.

**Tarina:** Myrskynoidan myrsky huuhtoi sateenkaaren värit merelle. Jokaisen
saaren vartija palauttaa yhden värin, ja saaristokartan sateenkaari täyttyy
väri kerrallaan (paljastus animoituu, kun kartalle palataan). Seitsemän väriä
= tilaa seitsemälle saarelle.

Linnasaaren labyrintissä huoneet ovat portteja: jokainen on läpäistävä, jotta
tie jatkuu. Kun kaikki kahdeksan on läpäisty, linna hehkuu ja avaa finaalin.

**Uusinta:** läpäisty huone on kulkukelpoinen, joten sen voi ohittaa
napauttamalla sen ohi. Kun nappula pysähtyy läpäistyyn huoneeseen, yksisarvinen
ehdottaa puhekuplassa ↻-nappia: napautus pelaa kentän uudestaan, muualle
napautus sulkee kuplan. Linnassa finaalin jälkeen kuplassa on vene (maailma 2)
ja ↻ (finaali uudestaan).

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
  ammu ne sauvalla samassa järjestyksessä (3 kierrosta, sarja pitenee 2→4).
  Väärä pallo heittää sammakon. Sitten kolme pupua vapautetaan häkeistä
  tehtävillä, ja kaikki ystävät juhlivat.

### Karkkisaari (maailma 2)

Aukeaa, kun linnan finaali on läpäisty. Huoneet painottavat raahaustehtäviä;
Arvoitusten torni on saaren vartija.

- **Rannikko** ♥ — ratsastus rannalla: simpukat napataan, ravut saksivat
  polulla, ja aalto huuhtoo polun alaosan vaahtovaroituksen jälkeen — pysy
  polun yläreunassa. Tehtävät: muoto varjoon, lasku, parit.
- **Karkkilaakso** ♥ — tasohyppely: vaahtokarkkitasot, joista pinkit
  pomputtavat korkealle (korkeat karkit vaativat pompun), kuulakarkit
  vierivät maassa (hyppää yli), limonadikuilut. Tehtävät: täydennä kuva,
  muoto varjoon.
- **Arvoitusten torni** ♥ — neljä tehtäväovea peräkkäin (parit 4 paria,
  täydennä kuva, muoto varjoon, muisti 4/4), jalokivet hyllyillä ja heiluvat
  kattokruunut, joiden alta kuljetaan kun ne ovat sivulla.

### Kuutamosaari (maailma 3)

Aukeaa, kun Arvoitusten torni on läpäisty. Kuun vartija on saaren vartija.

- **Merenpohja** ♥ — uinti: pidä pohjassa uidaksesi sormea kohti, **↑** potkaisee
  ylös. Helmet simpukoista, meduusat pistävät (kelluvat ylös–alas), virtaukset
  työntävät sivulle. Arkku aukeaa, kun helmet on kerätty. Tehtävät: parit 4,
  laske.
- **Kuutamometsä** ♥ — ratsastus yössä: kiiltomadot vilkkuvat ja ne saa kiinni
  vain loistaessa (ajoitus). Pöllö huhuilee ja silmät hehkuvat 1,2 s, sitten se
  syöksyy kohtaan jossa olit — siirry pois. Tehtävät: muisti 4/4, erilainen.
- **Pilvipolku** ♥ — tasohyppely pilvillä: haihtuvat pilvet katoavat 0,7 s
  seisomisen jälkeen (palaavat 2,5 s), pinkit pilvet pomputtavat, myrskypallot
  vierivät (hyppää yli), kuiluista putoaa taivaaseen. Tehtävät: täydennä kuva,
  vertaa.
- **Kuun vartija** ♥ — neljä tehtäväporttia (rytmi, muoto varjoon, vähennys,
  muisti 5/4). Tähtiä putoaa: hehku maassa varoittaa 0,9 s ennen osumaa.
  Kuunkivet kerätään kiviltä, ja kuun kasvot heräävät tehtävä kerrallaan.
  Ovi aukeaa, kun kaikki tehtävät ja kivet on tehty.

### Taikakynän saari (maailma 4, prototyyppi)

Aukeaa, kun Kuun vartija on läpäisty. Yksi kenttä, joka on samalla saaren vartija.

- **Taikakynä** ♥ — uusi verbi: **piirtäminen**. Prinsessa kävelee itsekseen ja
  pysähtyy rotkon reunalle (hetken päästä hän näyttää kynä-ajatuskuplan). Piirrä
  sormella silta tai ramppi, niin hän kävelee sitä pitkin; liian jyrkkää viivaa
  hän ei kiipeä. Muste (palkki ylhäällä) kuluu viivan pituuden mukaan ja palautuu
  ajan kanssa; viivat haihtuvat 8 sekunnissa. Mustetipat täyttävät musteen ja
  avaavat lopun taulukehyksen. Ympyrä myrskypilven ympärille vangitsee sen
  kuplaan 6 sekunniksi. Napautus prinsessaan kääntää kulkusuunnan.
  Tehtävät: muoto varjoon, kuvio.

♥ = **sydämet käytössä**: 3 sydäntä, osuma vie yhden. Kun sydämet loppuvat,
palataan viimeiselle sytytetylle lyhdylle ja lyhdyn jälkeen kerätyt esineet
palautuvat. Kenttä itse ei ala alusta.

**Kartta**-nappi (🏠) palauttaa kentästä saaren labyrinttiin, ja labyrintin
**vene**-nappi (⛵ vasemmassa yläkulmassa) palauttaa saaristokartalle. Samaan
paikkaan pääsee myös kävelemällä satamaruutuun.

## Ohjaus

- Metsä, jää, suo ja rannikko: pidä sormea pohjassa ratsastaaksesi, napauta kerätäksesi.
- Puutarha, lampi, luola, finaali, karkkilaakso ja torni: pidä pohjassa
  juostaksesi, **↑** hyppää, lyhyt napautus ampuu sauvalla (missä sauva on).
- Hyppy myös **toisella sormella**: kun yksi sormi juoksee, napautus millä
  tahansa toisella sormella mihin tahansa hyppää. Vasen alakulma napin
  ympärillä (27 vmin) hyppää sekin, vaikka napista osuisi ohi.
- Raahaustehtävät: paina palaa, vedä ja päästä irti kohteen päällä.
- Taikakynä: piirrä sormella mihin tahansa; napauta prinsessaa kääntääksesi.
- Taivas ja silta: pidä pohjassa lentääksesi sormea kohti, **↑** on siivenisku.
- Rytmitehtävä: kuuntele iskut, taputa sama kuvio mihin tahansa ruudulla.
  Tempo saa heittää, kuvion pitää täsmätä.

## Tehtävät

Tehtäväkaaret pysäyttävät hahmon ja avaavat tien, kun tehtävä on ratkaistu.
Pelaaja ei lue, joten malli näytetään puhekuplassa ja kysymysmerkki kertoo
mitä kysytään. Tehtävissä ei ole vihjenuolia; pomppiva nuoli on käytössä vain
kartalla (seuraava huone, linna).

- **Lasku / vähennys** — a + b tai a − b, kolme numerovaihtoehtoa
- **Laske** — montako mallin mukaista kuviota joukossa on; joukossa on myös
  hämääjiä (eri väri tai eri muoto)
- **Samanlainen** — malli on 2–3 kuvion ryhmä; 4 vaihtoehdosta väärät eroavat
  yhdellä yksityiskohdalla (yhden väri, yhden muoto tai lukumäärä)
- **Erilainen** — 5 kuviota, joista yksi eroaa: useimmiten pieni yksityiskohta
  (5 vs 6 sakaraa, 5 vs 8 terälehteä, kimallus sydämessä), joskus väri
- **Kuviosarja** — mikä tulee seuraavaksi (ABAB, AABB, ABC…)
- **Kummalla enemmän** — kaksi laatikkoa, kuviot hajallaan ja ero vain 1–2;
  napauta laatikkoa tai sen alla olevaa palloa
- **Muisti** — Simon: katso värit, toista (pituus ja värimäärä säädettävissä)
- **Rytmi** — käsi taputtaa rumpua iskujen tahdissa; toista sama kuvio
- **Muoto varjoon** (raahaus) — 4 muotoa alhaalla, varjot sekaisin ylhäällä;
  raahaa jokainen omaan varjoonsa. Väärään varjoon pudotettu palaa alas.
- **Täydennä kuva** (raahaus) — 3×3 ruudukko, jossa rivi määrää muodon ja
  sarake värin; raahaa puuttuva pala kolmesta ehdokkaasta koloon
- **Parit** — muistipeli: käännä kaksi korttia kerrallaan, parit jäävät auki

Kuvatehtävissä (samanlainen, erilainen, kuviosarja, kummalla enemmän) väärä
vastaus arpoo uuden tehtävän, joten arvaamalla ei pääse läpi. Laskuissa
väärästä vastauksesta tulee vain ravistus.

## Vaikeuden säätö

- Sydänten määrä: `HEART_MAX` (progress.js)
- Pupujen ja kurkkimisajat, peikko, pilvet: play-forest.js / update-draw.js
- Luola: lepakoiden nopeus `viewW * 0.065`, tippukiven varoitus `1.1` s ja putoamiskiihtyvyys `viewH * 1.15`, kuilujen leveys `caveGround`, valon säde `viewH * 0.72` (play-cave.js)
- Suo: noidan pudotusväli `3.2 + Math.random() * 1.4`, sammakon loikat `bounces > 3`
- Silta: vieritysnopeudet `BRIDGE_SEGMENT_SPEEDS`
- Finaali: kierrokset `BOSS_ROUNDS`, sarjan pituus `2 + boss.round`, näytön tahti `stepLen = 0.9`, pallojen väli `viewH * 0.22` (play-finale.js)
- Rytmin sallittu heitto: `tol = Math.max(0.15, want * 0.32)` (tasks-extra.js)
- Muistiloitsun pituus ja pallot: `makeTask(fx, 'memory', { seqLen, orbs })`
- Parien määrä: `makeTask(fx, 'pairs', { pairs })`
- Rannikko: aallon väli `6 + Math.random() * 3`, rapujen nopeus `viewW * 0.06`
- Karkkilaakso: pompun voima `viewH * 1.15` (platformer.js), kuulakarkkien nopeus `viewW * 0.07`
- Torni: kattokruunujen heilunta `speed: 1.1`, kulma `0.55`
- Merenpohja: meduusojen nopeus/amplitudi `jellyDefs`, virtauksen voima `viewW * 0.35`, uinnin kiihtyvyys `viewW * 0.42` / `viewH * 0.55`
- Kuutamometsä: kiiltomadon valoaika `GLOW_ON = 1.5` jaksosta `GLOW_CYCLE = 2.9`, pöllön varoitus `1.2` s, syöksyn nopeus `dt * 1.3`
- Pilvipolku: haihtumisaika `PUFF_STAND = 0.7`, paluu `PUFF_BACK = 2.5`, myrskypallot `viewW * 0.07`
- Kuun vartija: tähtien väli `1.8 + Math.random() * 0.9`, varoitus `0.9` s, putoamiskiihtyvyys `viewH * 1.3`
- Taikakynä: musteen määrä `penInkMax = viewW * 1.6`, palautuminen `viewW * 0.22`/s, viivan ikä `PEN_LIFE = 8`, askelkorkeus `PEN_STEP = 0.07`, jyrkin viiva `PEN_SLOPE = 1.4`, kävelynopeus `viewW * 0.11`

## Tekniikka

Canvas 2D, ei riippuvuuksia. Tausta esirenderöidään (isot maailmat
pienennettynä vanhojen laitteiden canvas-rajan takia). Äänet WebAudiolla.

Testaus: `window.VT` on testauskahva — `VT.play('cave')`, `VT.tick(dt)`,
`VT.hold(true, x, y)`, `VT.jump()`, `VT.taskTap(x, y)`, `VT.hearts()`,
`VT.showHub()`, `VT.info()`. Paikallinen palvelin tarvitaan (tiedostot
ladataan erillisinä): `node tools/serve.js` ja avaa http://localhost:8765.
