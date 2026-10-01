# Vernan taikapolku

Selainpeli 6-vuotiaalle: prinsessa ja yksisarvinen seikkailevat
taikametsässä, puutarhassa, jäällä, lammella, kuutamotaivaalla,
kristalliluolassa, noidan suolla ja sateenkaarisillalla — ja lopuksi
pelastavat puput linnan Myrskynoidalta.

## Tiedostot

Peli on jaettu osiin, jotta uusia vaiheita on helppo lisätä:

- `index.html` — kuori ja versioleima `VT_VERSION`, joka liitetään jokaiseen tiedostonimeen
  (`?v=…`). Skriptien latauslista johdetaan `js/worlds.js`:n `scriptManifest()`-funktiosta.
  **Nosta leimaa julkaistessa**, muuten
  tabletin välimuisti voi yhdistää vanhan `index.html`:n uusiin skripteihin ja kenttä jää jumiin.
- `css/game.css` — napit (SVG-ikonit: kartta, vene, uudestaan, jatka, hyppy, tuli, kynä, ääni), fontti ja karttanäyttö
- `fonts/` — pelin fontti Fredoka (SIL Open Font License, `OFL.txt`), paketoitu mukaan
- `js/worlds.js` — **saarirekisteri (`WORLDS`)**: pelin ainoa totuus maailmoista ja kentistä.
  Vaiheen sauma: `init/update/draw/tap/resize/renderBg/renderBgLayers/light/respawn`. Rekisteristä johdetaan
  `PHASES` (kenttäkoukut), `HUB_WORLDS` (sokkelot), `ISLANDS` (saaristokartta) ja `scriptManifest()`.
- `js/state.js` — jaettu tila, sokkelon ajonaikainen tila, fonttipino `UI_FONT`
- `js/art.js` — **piirtokirjasto**: tarrakirja-ilmeen muodot, värit, pehmennykset, tärinä ja pop-efektit (ks. Tyyliopas)
- `js/audio.js` — WebAudio
- `js/progress.js` — edistymisen tallennus (localStorage), sydämet, tarkistuspisteet
- `js/world.js` — koko, taustojen esirenderöinti kerroksiksi (parallaksi), maiseman yhteiset muodot (puu, pensas, kukka, linna, pilvi)
- `js/draw-actors.js` — tähti, pupu, yksisarvinen
- `js/fx.js` — kipinät, konfetti, opastenuoli
- `js/ambient.js` — tunnelmahiukkaset, etualan siluetit, valaistus (`drawLight`) ja kentän alkukortti (PHASES: `ambient`, `fg`, `light`)
- `js/flow-sea.js` — saaristokartta (ylin navigaatio), saaret ja sateenkaari
- `js/flow-land.js` — **Kaukamaa**: mantereen kartta (toinen ylätason kartta), purjehdus
  saaristosta mantereelle ja takaisin, saaristokartan avomerimerkki ja sokkelon tienviitta
- `js/flow-hub.js` — saaren karttalabyrintti, vaiheen käynnistys ja kentän elinkaaren
  yhteinen alku (`levelBegin`: tilan nollaus ja nappien ilme rekisterin lipuista; skipTo
  ja uusinta kutsuvat sitä ennen kentän omaa init-koukkua)
- `js/flow-home.js` — linnan sisustus (tähtikauppa, raahaus, puput)
- `js/flow-castle.js` — linnakartta (linnan oma karttanäkymä, huoneiden pienoiskuvat)
- `js/flow-bank.js` — pankkiholvi (talletus, nosto, korko, pankin huonekalut)
- `js/flow-yard.js` — linnan puutarha (kasvit, kastelu, sato, rikkaruohot, puutarhan tavarat)
- `js/play-forest.js` — metsä + tehtäväkaarten perusrunko
- `js/tasks-extra.js` — uudet tehtävätyypit (vähennys, kuvio, vertailu, rytmi)
- `js/play-garden.js` … `play-sky.js` — vaiheet 2–5
- `js/platformer.js` — jaettu tasohyppelyfysiikka (liikkuvat tasot, kantaminen)
- `js/play-cave.js`, `play-swamp.js`, `play-bridge.js` — vaiheet 6–8
- `js/play-finale.js` — linnan finaali
- `js/tasks-drag.js` — raahaustehtävät (muoto varjoon, täydennä kuva) ja muistipeli
- `js/play-beach.js`, `play-candy.js`, `play-lollipop.js`, `play-candysky.js`, `play-sweetclock.js`, `play-tower.js` — maailma 2
- `js/play-reef.js`, `play-nightwood.js`, `play-clouds.js`, `play-stars.js`, `play-moonword.js`, `play-moon.js` — maailma 3
- `js/tasks-mix.js` — värien sekoitus: 'mix'-tehtävä ja Taikakeittiön pata
- `js/play-herd.js`, `play-berry.js`, `play-cafe.js`, `play-naptime.js`, `play-bedtime.js`, `play-kitchen.js` — maailma 5
- `js/tasks-more.js` — lajittele, järjestä koon mukaan, peilikuva, yhdistä pisteet, anna N kappaletta, puuttuva ruutu
- `js/play-mine.js`, `play-rapids.js`, `play-lighthouse.js`, `play-glide.js`, `play-summit.js` — maailma 6
- `js/tasks-read.js` — lukemisen tehtävät: kuva→sana, kokoa sana tavuista, alkukirjain
- `js/play-letterfield.js`, `play-wordshop.js`, `play-grove.js` — maailma 7; Tavukoski ja Kirjainpilvet käyttävät `play-rapids.js`-moottoria (tilat `syl` ja `letters`)
- `js/tasks-fair.js` — Tivolisaaren tehtävät: mitä kello on, maksa rahoilla, palapeli, ohjelmoi reitti
- `js/play-circus.js`, `play-wire.js`, `play-balloon.js`, `play-icecream.js`, `play-ducks.js`, `play-magician.js` — maailma 8; Trapetsi käyttää `play-circus.js`-moottoria (tila `hard`)
- `js/tasks-north.js` — Revontulimaan lukutehtävät: loppusointu, loppukirjain, puuttuva tavu
- `js/play-voyage.js`, `play-aurora.js`, `play-reindeer.js`, `play-sled.js`, `play-snowword.js`, `play-foxguard.js` — maailma 9
- `js/play-nest.js` — Kaukamaa, Lohikäärmelaakso (maailma 10): Pesäkallio (ritsa), lohikäärmeenpoikasten piirto
- `js/play-dragonfly.js` — Lohikäärmelaakso: Tulilento (lento lohikäärmeellä + tulihengitys, tulinappi `fireBtn` / `usesFire`)
- `js/play-eggs.js`, `js/play-scale.js` — Lohikäärmelaakso: Munapesä (raahaa munat kuvion mukaan, hauto pitämällä) ja Aarrevaaka (tasapainota vaaka raahaamalla jalokiviä)
- `js/play-giant.js` — Lohikäärmelaakson vartija Tulivuoren jätti (ritsa + tulihengitys, kolme kovenevaa kierrosta)
- `js/play-bounce.js`, `js/play-catch.js`, `js/play-moth.js` — Kaukamaa, Hohtometsä (maailma 11): Sienipomppu (pomppu), Tulikärpässieppo (sipaisu) ja vartija Varjoperhonen (sipaisu + pomppu)
- `js/play-dune.js`, `play-dowse.js`, `play-caravan.js`, `play-whirl.js` — Kaukamaa, Aurinkodyynit (maailma 12): Dyynilasku (liuku), Aarrevarpu (etsintä), Kamelikaravaani (laskut raahaamalla) ja vartija Hiekkapyörre
- `js/play-bcode.js`, `play-prism.js`, `play-bloop.js`, `play-mole.js`, `play-duo.js` — Kaukamaa, Porkkanakumpu (maailma 13): Pupupolku (ohjelmointi), Värisäde (värilasit), Loitsupolku (aliohjelma, myyrät, odotus), vartija Myyräkuningas ja bonushuone Yhteispolku (yhteispeli kahdelle)
- `js/play-gear.js` — Kaukamaa, Kellopaja (maailma 14): Rataspaja (rattaat kolmiohilassa, suunta ja jumi), sokkelon maasto `HUB_TILE_DECOR.clock`
- `js/pen-core.js` — Taikakynän ydin: viivat, muste, kynätila, pintoja seuraava kävely, muodontunnistus
- `js/play-pen.js`, `play-rain.js`, `play-bunnybridge.js`, `play-orchard.js`, `play-scribble.js` — maailma 4
- `js/update-draw.js` + `js/main.js` — silmukka ja syöte

**Uusi vaihe** = tiedosto `js/play-….js` ja yksi `levels`-alkio js/worlds.js:n
`WORLDS`-rekisteriin (`kind`, `script`, huoneen kirjain `room`, ohjaus ja koukut;
kirjain myös saaren `map`-karttaan). Kartan merkki `?` on **tuleva huone**:
se piirretään usvan peittämänä mitalina lukolla, ja nappulan saapuminen näyttää
lukon. Kun kenttä valmistuu, `?` vaihdetaan huoneen kirjaimeksi. Kentän numero, `next`-ketju,
`HUB_ROOMS`/`HUB_ORDER` ja skriptien latauslista johdetaan rekisteristä.
**Uusi saari** = yksi `WORLDS`-alkio: nimi, `island`-tiedot (sijainti,
vartijahuone `finaleKind`, koristeet), `map` ja `levels`.
**Uusi paikka Kaukamaalla** = sama, mutta `region: 'land'`, `place`-tiedot
(`island`-kentän vastine mantereen kartalla) ja `band` (sokkelon maaston teema,
värit `HUB_TILE_COLORS`). Huoneen kuvake rekisteröidään kentän omassa
tiedostossa `HUB_ICONS[kind] = function (c, x, y, s)` ja maaston koristeet
`HUB_TILE_DECOR[band]`, joten flow-hub.js:ää ei tarvitse muokata.
Silmukka, syöte ja koko kulkevat `PHASES`-koukkujen kautta, joten muuta
koodia ei tarvitse muokata.

## Siirto tabletille

Kopioi koko kansio (html + `css/` + `js/`). Avaa `index.html` Chromella,
tai käytä Vercel-osoitetta. Edistyminen tallentuu selaimeen; sen voi nollata
konsolista `VT.resetProgress()`. Testausta varten kaikki kentät saa läpäistyiksi
osoitteella `index.html?unlock` (tai konsolista `VT.unlockAll()`).

## Kartta

Peli alkaa **saaristokartalta**: saaret ovat maailmoja, ja vene kulkee niiden
välillä. Saaren napautus purjehduttaa veneen sinne ja avaa saaren
labyrintin; labyrintin satamaruutu (**B**) palauttaa saaristoon. Seuraava saari
aukeaa, kun edellisen saaren vartijahuone on läpäisty (Linnasaari: finaali,
Karkkisaari: Arvoitusten torni). Värisaaria on seitsemän, yksi sateenkaaren
väriä kohti (`SEA_FOG`-taulukkoon voi lisätä sumuisen saaren vihjeeksi), ja
kahdeksas saari (Tivolisaari) odottaa sateenkaaren päässä. Sen jälkeen
aukeaa horisontin takainen **Revontulimaa** (maailma 9); se ei lisää
sateenkaareen yhdeksättä väriä.
Avatulla saaressa, jossa on vielä pelaamattomia huoneita, näkyy keltainen
numero saaren vasemmassa yläkulmassa.

**Kaukamaa** on saariston takainen manner ja pelin toinen ylätason kartta
(`js/flow-land.js`). Kun kultatähti loistaa kaaren huipulla (Taikurin teltta
läpäisty), saaristokartan itäreunaan ilmestyy **avomerimerkki**: poiju, jossa on
nuolikyltti ja lohikäärmeen pää. Sen napautus purjehduttaa veneen avomerelle, ja
lyhyen purjehduksen jälkeen (delfiinit, manner nousee usvasta; napautus
ohittaa) aukeaa mantereen kartta. Mantereella **paikat** (`LAND_PLACES`,
rekisterin `place`-kentästä) ovat maailmoja kuten saaret: paikan napautus
kävelyttää yksisarvisen polkua pitkin sinne ja avaa paikan sokkelon; seuraava
paikka aukeaa, kun edellisen vartija on läpäisty. Usvaiset laikut (`LAND_FOG`)
vihjaavat tulevista alueista. Länsirannan vene palauttaa saaristoon (vene
ilmestyy avomerimerkille eikä avaa saarta itsestään). Mantereen sokkelossa
lähtöruutu **B** on tienviitta, joka palauttaa mantereen kartalle; vene-nappi
tekee saman. Peli avautuu sille kartalle, jolla viimeksi oltiin.

**Tarina:** Myrskynoidan myrsky huuhtoi sateenkaaren värit merelle. Jokaisen
saaren vartija palauttaa yhden värin, ja saaristokartan sateenkaari täyttyy
väri kerrallaan (paljastus animoituu, kun kartalle palataan). Kun kaikki
seitsemän väriä on koossa, sateenkaaren päästä löytyy Tivolisaari, jonka
vartija kruunaa kaaren **kultatähdellä** (`RAINBOW_COLORS.length`:n jälkeinen
paljastus piirretään tähtenä). Tähti ei kasva: `rainbowEarned()` rajataan
seitsemään väriin plus kultatähteen, vaikka saaria olisi enemmän.

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
- **Tikkumetsä** ♥ — ratsastus karkkimaisemassa: tikkarit kerätään sormella
  tai ohitse ratsastaen, salmiakkipyörät vierivät polulla (sydän). Karkkiportti
  aukeaa, kun kaikki kahdeksan tikkarin on kerätty. Tehtävät: laske, erilainen.
- **Karkkitaivas** ♥ — vapaa lento karkkipilvien välissä: kahdeksan käärekarkkia
  kerätään, ajelehtivat ukkospilvet vievät sydämen. Karkkiportti hehkuu, kun
  karkit on koossa — lennä sen luo. Tehtävät: anna N kappaletta, lasku.
- **Karkkikello** — kiireetön ratsastus karkkileipomossa: kahdeksan
  piparkakkukelloa kerätään sormella tai ohitse ratsastaen. Uuni hehkuu, kun
  kellot on koossa. Ei sydämiä. Tehtävät: kello, lue sana (2 tavua).
- **Arvoitusten torni** ♥ — neljä tehtäväovea peräkkäin (parit 4 paria,
  täydennä kuva, lue sana, muisti 4/4), jalokivet hyllyillä ja heiluvat
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
- **Tähtisumu** — ei liikkumista, ei sydämiä. Pilvet ajelehtivat tähtien
  päällä: napauta pilveä puhaltaaksesi sen hetkeksi pois, ja napauta
  paljastunutta tähteä kerätäksesi sen. Kuusi tähteä; tehtävät avautuvat
  keräilyn edetessä. Tehtävät: puuttuva ruutu, muisti 4/4.
- **Tähtisana** — kiireetön ratsastus kuutamossa: kahdeksan kirjaintähteä
  kerätään sormella tai ohitse ratsastaen. Portti hehkuu, kun tähdet on
  koossa. Ei sydämiä. Tehtävät: lue sana (3 tavua), kuva→sana (2 tavua).
- **Kuun vartija** ♥ — neljä tehtäväporttia (rytmi, muoto varjoon, vähennys,
  muisti 5/4). Tähtiä putoaa: hehku maassa varoittaa 0,9 s ennen osumaa.
  Kuunkivet kerätään kiviltä, ja kuun kasvot heräävät tehtävä kerrallaan.
  Ovi aukeaa, kun kaikki tehtävät ja kivet on tehty.

### Taikakynän saari (maailma 4)

Aukeaa, kun Kuun vartija on läpäisty. Kaikissa kentissä ohjaus on sama: pidä
pohjassa kävelläksesi, kynänappi ottaa kynän käteen, kynä kädessä piirretään.
Sotkumörkö on saaren vartija.

- **Taikakynä** ♥ — uusi verbi: **piirtäminen**. Pidä pohjassa kävelläksesi
  sormea kohti kuten muualla (myös taaksepäin); rotkon reunalle prinsessa
  pysähtyy. Kynänappi (hyppynapin paikalla) ottaa kynän käteen: nappi hehkuu ja
  kynä leijuu prinsessan vierellä. Kynä otetaan esiin ja laitetaan pois vain
  napista, ei koskaan itsestään; reunalla odottava prinsessa näyttää pienen
  kynävihjeen. Kynä kädessä sormella piirretään silta tai ramppi, jota pitkin hän
  kävelee, kun kynä laitetaan pois; liian jyrkkää viivaa hän ei kiipeä. Muste
  (palkki ylhäällä) kuluu viivan pituuden mukaan ja palautuu ajan kanssa; viivat
  haihtuvat 8 sekunnissa. Mustepullot täyttävät musteen ja avaavat lopun
  taulukehyksen. Kentässä ei ole vihollisia: se on rauhallinen harjoituskenttä,
  jossa sydämen vie vain rotkoon putoaminen. Tehtävät: muoto varjoon, kuvio.
- **Sadesuoja** ♥ — sadealueilla taivaalta tippuu mustetahroja prinsessan
  lähelle. Piirretty viiva pään päällä toimii sateenvarjona: tahra läiskähtää
  viivaan. Sama muste sillaksi ja suojaksi. Tehtävät: laske, samanlainen.
- **Pupusilta** ♥ — kolme pupua on saarekkeilla rotkojen takana. Ne kävelevät
  piirrettyjä viivoja pitkin prinsessan luo, kun tämä on lähellä, ja seuraavat
  häntä sen jälkeen. Kaikki kolme pupukoloon. Pudonnut pupu palaa
  saarekkeelleen ilman sydänmenetystä. Tehtävät: parit 3, erilainen.
- **Omenavarat** ♥ — kuusi omenaa roikkuu puissa laskevien terassien
  yläpuolella. Napauta omena pudottaaksesi sen — se vierii piirrettyjä
  ramppeja pitkin kohti koria. Rotkoon pudonnut omena palaa puuhunsa;
  prinsessalta menee sydän. Kaikki omenat koriin. Tehtävät: kuvio, muoto
  varjoon.
- **Sotkumörkö** ♥ — vartija. Kolme porttia näyttää muodon (ympyrä, kolmio,
  neliö): piirrä sama muoto kynä kädessä, ja portti aukeaa; väärä muoto
  tärisyttää porttia. Mörkö heittää tahroja, jotka leijuvat hetken ja putoavat:
  ympyrä leijuvan tahran ympärille vangitsee sen. Lopuksi salama (siksak)
  rauhoittaa mörön ja avaa oven. Tehtävät: kuvio.

### Hoivasaari (maailma 5)

Aukeaa, kun Sotkumörkö on rauhoitettu. Kaikki kentät ovat kiireettömiä: ei
sydämiä. Taikakeittiö on saaren vartija.

- **Pupupaimen** — ratsastus niityllä. Kolme pupua alussa liittyy laumaan, kun
  yksisarvinen tulee lähelle, ja seuraa perässä. Pöllön huuto ja syöksy
  pelästyttävät lähellä olevat puput pensaisiin piiloon (korvat ja huutomerkki
  näkyvät); napautus kutsuu pupun takaisin. Kaikki kolme pupukoloon. Nuoli
  näyttää piilossa olevan pupun tai kolon. Tehtävät: lue sana (2 tavua), laske.
- **Marjaniitty** — kiireetön ratsastus. Mansikat ja mustikat kerätään koriin
  sormella tai ohitse ratsastaen.
  Kori hehkuu, kun kaikki kahdeksan on koossa — vie kori perille. Ei sydämiä.
  Tehtävät: parit 6, lajittele.
- **Pupukahvila** — ei liikkumista, kuvat eikä sanoja. Pupuasiakas tilaa
  evästä kuplassa; napauta oikea eväs (porkkana, omena, marja) hyllyltä
  tarjottimeen. Ensin yksi eväs per tilaus, lopuksi kaksi. Väärä eväs vain
  ravistaa. Viisi tilausta. Ei sydämiä.
- **Uniaika** — ei liikkumista, ei sydämiä. Kolme pupua väsyttää (haukottelevat
  kuplineen): napauta pupua, niin se kävelee petiinsä, ja napauta petiä, niin
  pupu saa peiton ja tuutulaulun. Tehtävät avautuvat hoitamisen edetessä.
  Tehtävät: anna N kappaletta, laske.
- **Unikello** — kiireetön ratsastus iltahämärässä: kahdeksan unikuuta
  kerätään sormella tai ohitse ratsastaen ja viedään petiin. Ei sydämiä.
  Tehtävät: kello, lue sana (2 tavua).
- **Taikakeittiö** — ei liikkumista. Pupuasiakas tilaa kuplassa värillisen
  juoman; kaada hyllyn pulloista (punainen, keltainen, sininen) pataan. Perusväri
  on yksi kaato, sekoitus kaksi: punainen + keltainen = oranssi, keltainen +
  sininen = vihreä, punainen + sininen = violetti. Väärä sekoitus pöhähtää
  harmaaksi ja tyhjenee. Kuusi tilausta: ensin kaksi perusväriä, sitten neljä
  sekoitusta.

### Vuorisaari (maailma 6)

Aukeaa, kun Taikakeittiön tilaukset on tarjoiltu. Kentät vuorottelevat
helppo–vaikea, ja kolme niistä on kokonaan uusia pelimalleja. Tuulenhuippu on
saaren vartija.

- **Kaivos** — uusi malli: **ruudukkokaivos** yhdellä ruudulla. Napauta ruutua,
  ja prinsessa kaivaa tunnelin sinne (multa murtuu, kivi ei – kierrä). Kuusi
  jalokiveä kimaltaa mullan läpi; arkkuun kaivautuminen avaa tehtävän. Ovi
  aukeaa, kun kivet on koossa. Ei sydämiä. Tehtävät: lajittele, lasku.
- **Koski** ♥ — uusi malli: **virran ylitys**. Napauta prinsessan yläpuolelle
  hypätäksesi seuraavalle kaistalle (alapuolelle = takaisin). Tukit lipuvat
  sivuttain ja vievät mukanaan; hyppy tyhjään veteen vie sydämen ja palauttaa
  viimeiselle rannalle. Kaksi ylintä kaistaa ovat nopeampia, ja niillä uiva
  kilpikonna sukeltaa hetken heilahdettuaan. Saarella lyhty ja tehtävä,
  ylärannalla toinen. Tehtävät: yhdistä pisteet, samanlainen.
- **Majakka** — uusi malli: **palikkatorni**. Nosturi heiluu palikkaa ruudun
  poikki; napautus pudottaa sen. Palikka pysyy, jos vähintään noin puolet osuu
  edellisen päälle, muuten se keikahtaa mereen (ei rangaistusta). Kahdeksan
  palikkaa ja lopuksi lamppu, jonka valo pyörähtää. Kolmen ja kuuden palikan
  jälkeen avautuu tehtävä. Ei sydämiä. Tehtävät: peilikuva, laske.
- **Kotkalento** ♥ — vapaa liito vuoristoalueen yllä: kahdeksan kotkan sulkaa
  keinuu tuulessa, ajelehtivat ukkospilvet vievät sydämen. Tuuliportti hehkuu,
  kun sulat on koossa. Tehtävät: puuttuva ruutu, peilikuva.
- **Tuulenhuippu** ♥ — vartija. Tasohyppely lumihuipulla rotkoineen. Lippu
  nousee ja lehtiä lentää sekunnin ajan, sitten **tuulenpuuska** työntää
  prinsessaa (ilmassa enemmän) – isojen kivien vierellä on suojassa. Kuusi
  jääkidettä ja kolme tehtäväkaarta; Tuulen henki rauhoittuu ja ovi aukeaa, kun
  kaikki on tehty. Tehtävät: järjestä koon mukaan, yhdistä pisteet, muisti 5/4.

### Kirjainsaari (maailma 7)

Aukeaa, kun Tuulenhuippu on läpäisty. Pääpaino lukemisessa: kaikki teksti on
TIKKUKIRJAIMIA ja sanat tavutettuina (KUK-KA). Sanat ja kuvat tulevat samasta
`WORD_LIST`-listasta kuin lue sana -tehtävässä. Kirjainpilvet on saaren vartija.

- **Kirjainniitty** — ratsastus. Ylhäällä näkyy sana tavutettuna, ja niityllä
  leijuu ratsastuskorkeudella sen kirjaimet sekä kaksi hämäyskirjainta. Kerää
  kirjaimet sanan järjestyksessä ratsastamalla niiden läpi tai napauttamalla:
  seuraava kirjain hehkuu sekä sanassa että niityllä, väärän napautus heilauttaa.
  Kerätty kirjain lentää sanaan. Sanakuplan napautus lukee sanan. Valmis sana luetaan tavu kerrallaan ja sen
  kuva paljastuu (myös alueen pupun kylttiin). Kolme sanaa, lyhin ensin; portti
  aukeaa lopuksi. Ei sydämiä. Tehtävät: kuva→sana, lue sana.
- **Tavukoski** ♥ — Kosken hyppely, mutta tukeissa on **tavuja**. Ylhäällä
  vasemmalla kirjoitettava sana: seuraava tavu hehkuu (kuplan napautus lukee
  sanan). Hyppää tukille, jossa on se tavu: napautus suoraan seuraavan kaistan
  tukkiin hyppää sitä kohti, muu napautus yläpuolelle hyppää suoraan ylös; väärän tavun tukki keikahtaa ja pudottaa veteen (sydän). Ensin
  2-tavuinen sana saarelle, sitten 3-tavuinen ylärannalle. Valmis sana soi ja
  kuva paljastuu. Tehtävät: kokoa sana tavuista, lue sana.
- **Sanapaja** — ei liikkumista. Pupu tilaa kuvalla, ja sana kootaan
  raahaamalla tavukortit paikoilleen (seuraava paikka hehkuu; väärä tavu palaa
  alas). Valmis sana luetaan ja ripustetaan kylttinä pajan seinälle. Viisi
  tilausta: kaksi 2-tavuista, kolme 3-tavuista. Ei sydämiä.
- **Kirjainpuutarha** — ei liikkumista, ei sydämiä. Kuudessa pensaassa kylpee
  kirjaimia; sanakupla ylhäällä näyttää tavutettuna, mikä sana on vuorossa
  (kuplan napautus lukee sen). Napauta pensasta, jossa on sanan seuraava
  kirjain — kirjain lentää sanaan ja pensaat sekoittuvat. Kolme sanaa;
  tehtävät avautuvat sanojen valmistuessa. Tehtävät: alkukirjain, kuva→sana.
- **Kirjainpilvet** ♥ — vartija. Sama hyppely taivaalla: pilvissä on
  **kirjaimia**, ja sana kirjoitetaan kirjain kerrallaan ylös asti (3-kirjaiminen
  sana pilvisaarelle, 4-kirjaiminen Sanapöllön luo). Väärä kirjain pudottaa.
  Sanapöllö herää, kun molemmat sanat on kirjoitettu. Tehtävät: alkukirjain,
  kuva→sana.

### Tivolisaari (maailma 8)

Aukeaa, kun Kirjainpilvet on läpäisty eli sateenkaari on kokonaan koossa.
Jokainen kenttä on oma pelimallinsa, ja saaren tehtävät opettavat kelloa,
rahaa, palapelin kokoamista ja ohjelmointia. Taikurin teltta on saaren
vartija; sen läpäisy nostaa kultatähden sateenkaaren huipulle.

- **Sirkusteltta** ♥ — uusi verbi: **trapetsi**. Prinsessa roikkuu
  heilahtelevassa trapetsissa; napautus irrottaa, ja hän lentää kaaressa
  seuraavaan tankoon. Lähellä oleva tanko vetää käsiä puoleensa, joten ajoitus
  on anteeksiantava mutta vaatii eteenpäin heilahtavan hetken (ikkuna n. 0,8 s
  4,5 s:n jaksosta). Haalea pistekaari näyttää, mihin irrotus juuri nyt veisi.
  Ohi lentävä putoaa turvaverkkoon (sydän) ja palaa viimeiselle korokkeelle;
  korokkeelta napautus loikkaa ensimmäiseen tankoon. Kahdeksan tähteä kerätään
  lennossa (bonus, ei vaadita). Tehtävät korokkeilla: kello, palapeli.
- **Trapetsi** ♥ — sama verbi, vaikeampi rata. Pidempi ketju (4 + 5 + 5 tankoa
  ilman lepoa), harvempi väli, nopeampi heilahdus ja vähän vetoa, joten irrotus
  pitää ajoittaa eteenpäin heilahtavaan hetkeen.
  Kultainen teltta erottaa kentän Sirkusteltasta. Tehtävät korokkeilla: maksa, reitti.
- **Nuorallakävely** ♥ — uusi verbi: **tasapaino**. Prinsessa kävelee itsekseen
  nuoraa pitkin tasapainotangon kanssa. Tuuli kallistaa; pidä sormea sen puolen
  puolella, johon haluat nojata. Liika kallistus pudottaa verkkoon (sydän) ja
  palauttaa viimeiselle korokkeelle. Korokkeelta napautus lähtee seuraavalle
  nuoralle. Kahdeksan tähteä kerätään kävellessä. Tehtävät korokkeilla: kello, palapeli.
- **Kuumailmapallo** ♥ — uusi verbi: **korkeuden valinta**. Pidä pohjassa:
  sormi pallon yläpuolella = poltin (nousu), alapuolella = venttiili (lasku).
  Kolme tuulikerrosta, joita erottavat katkoviivat: ylin ja alin vievät
  eteenpäin, sinertävä keskikerros taaksepäin. Isot valkoiset nuolet
  ajelehtivat kerroksissa tuulen suuntaan, ja pallon huipun viiri liehuu
  siihen suuntaan, johon tuuli juuri nyt vie. Taaksepäin vievä kerros on
  hyödyksi, jos ilmapallo jäi taakse. Kerää kahdeksan juhlailmapalloa (myös napauttamalla läheltä),
  väistä leijoja (sydän) ja laskeudu lopuksi alustalle, kun se hehkuu.
  Illan tivoli maailmanpyörineen pyörii alla. Tehtävät: reitti, kello.
- **Jäätelökoju** — ei liikkumista, ei sydämiä. Pupuasiakas tilaa kuplassa
  tötterön, jossa on 2–4 palloa tietyissä väreissä **alhaalta ylös** — nuoli
  kuplassa näyttää seuraavan pallon. Napauta oikea maku astiasta (5 makua);
  väärä pallo putoaa tiskille. Kahdessa viimeisessä tilauksessa myös koriste
  (kirsikka tai strösseli) viimeiseksi. Kuusi tilausta; tehtävät toisen ja
  neljännen jälkeen: maksa, kello.
- **Ankkaonginta** — ei liikkumista, ei sydämiä. Kymmenen numeroankkaa lipuu
  kolmella kaistalla eri suuntiin. Napauta lampeen: koukku sukeltaa
  napautuskohtaan 0,35 sekunnissa, joten ankan liike pitää ennakoida. Ankat
  pyydetään numerojärjestyksessä 1…10 (seuraava numero kuplassa); väärä ankka
  pärskähtää takaisin. Pyydetyt ankat rivistyvät hyllylle. Tehtävät 4 ja 8
  ankan jälkeen: reitti, maksa.
- **Taikurin teltta** ♥ — vartija. Taikuripupu piilottaa kultatähden kupin
  alle ja sekoittaa kupit kaarissa: seuraa silmillä ja napauta oikea kuppi.
  Kolme kierrosta (3 kuppia / 3 vaihtoa, 3 / 5, 4 / 6 nopeammin). Väärä kuppi
  vie sydämen, ja tähti näytetään uudestaan. Kierrosten välissä tehtävät:
  palapeli (6 palaa), kello. Lopuksi tähti nousee hatusta ja ilotulitus alkaa.

♥ = **sydämet käytössä**: 3 sydäntä, osuma vie yhden. Kun sydämet loppuvat,
palataan viimeiselle sytytetylle lyhdylle ja lyhdyn jälkeen kerätyt esineet
palautuvat. Kenttä itse ei ala alusta.

### Revontulimaa (maailma 9)

Aukeaa, kun Taikurin teltta on läpäisty. Prinsessa seilaa horisonttiin ja
löytää revontulten maan. Pelimekaniikka on tuttua (vene, ratsastus, lento,
napautus), mutta tehtävät painottavat päättelyä, hahmotusta, matematiikkaa
ja lukemista Kirjainsaaren jälkeen: loppusointu, loppukirjain ja puuttuva
tavu.

- **Horisontti** ♥ — vene kulkee itse eteenpäin; pidä sormea ohjataksesi
  (vasemmalla palaa, oikealla jatkaa, ylös/alas väistää jäitä). Kahdeksan
  tähteä: ohi mennyt tähti ilmestyy uudelleen eteen, laituri pysäyttää veneen
  ja jäljellä olevat leijuvat luo. Tehtävät: laske, kummalla enemmän.
- **Revontulipolku** ♥ — ratsastus. Valopallot syttyvät vain, kun revontuli
  on niiden yllä; kerää ne loistaessaan. Tuulenpuuskat vievät sydämen.
  Tehtävät: kuviosarja, muistiloitsu 5/4.
- **Porolaakso** — ratsastus. Kolme poroa seuraa; revontulipulssi pelästyttää
  ne kivien taa. Napauta piilossa olevaa poroa ja vie kaikki aitaukseen.
  Tehtävät: anna N, vähennys.
- **Kelkkamäki** ♥ — ruutu vierii itse. Ohjaa kelkkaa pidolla, lennä
  revontulirenkaiden läpi, väistä kiviä. Tehtävät: peilikuva, yhdistä pisteet.
- **Lumisana** — ei liikkumista. Kuusi kierrosta vuorottelee loppusointua,
  loppukirjainta ja puuttuvaa tavua. Tehtäväkaaret (laske, vähennys) toisen
  ja neljännen kierroksen jälkeen.
- **Revontulikettu** — vartija. Ratsastus tunturissa, neljä tehtäväporttia
  (loppusointu, loppukirjain, puuttuva tavu, muisti 5/4) ja kuusi
  revontulikidettä. Kettu herää, kun portteja on avattu.

### Kaukamaa: Lohikäärmelaakso (maailma 10)

Mantereen ensimmäinen alue. Aukeaa avomerimerkistä, kun Taikurin teltta on
läpäisty. Sokkelon maasto on lämmintä punamultaa saniaisin, tulikristallein ja
munakivin; tienviitta palauttaa mantereen kartalle. Viisi kenttää; alueen
vartija on Tulivuoren jätti (`finaleKind: 'giant'`). Kentät vuorottelevat
vauhdikasta ja rauhallista: Pesäkallio (ritsa), Tulilento (lento, sydämet),
Munapesä ja Aarrevaaka (rauhalliset, raahaus, ei sydämiä) ja vartija, joka
yhdistää ritsan ja tulihengityksen.

- **Pesäkallio** — uusi verbi: **ritsa**. Prinsessa ruokkii pesissä odottavia
  lohikäärmeenpoikasia tulimarjoilla: paina mihin tahansa, vedä taakse ja päästä
  irti. Vetäessä haalea pistekaari näyttää lentoradan ja pysähtyy kiveen, johon
  marja osuisi; kaari muuttuu kultaiseksi ja suu saa renkaan, kun marja menisi
  suuhun. Ennen ensimmäistä laukausta käsi näyttää vedon. Kolme kalliota
  (asemaa): ensimmäisellä kaksi pesää; toisella kurkkiva poikanen (suu auki vain
  ylhäällä, 2,6 s / 1,2 s) ja pilari, jonka yli täytyy lobata; kolmannella
  köynnöksessä keinuva pesä, kielekkeen alla oleva pesä (matala heitto) ja
  **harakka**, joka nappaa lennossa olevan marjan. Pesän yllä näkyy, montako
  marjaa poikanen vielä haluaa (2–3). Kylläinen poikanen lähtee lentoon ja
  seuraa prinsessaa seuraavalle kalliolle; kun kaikki kahdeksan on ruokittu,
  emolohikäärme herää kallion laella. Kuusi bonustähteä kerätään osumalla niihin
  marjalla. Ei sydämiä. Tehtäväkaaret kallioiden välissä: anna N kappaletta,
  laske.
- **Tulilento** ♥ — uusi verbi: **tulihengitys**. Prinsessa lentää
  lohikäärmeenpoikasella laavakanjonissa yössä: pidä pohjassa lentääksesi
  sormea kohti (irti päästettynä lohikäärme liitää ja vajoaa hitaasti), ja
  **tulinappi** (hyppynapin paikalla; myös toinen sormi ja vasen alakulma)
  puhaltaa liekin eteenpäin. Tulella sytytetään kahdeksan soihtua, sulatetaan
  kolme kanjonin tukkivaa jääporttia (kaksi puhallusta: ensin halkeama, sitten
  höyry) ja hajotetaan ajelehtivia tuhkapilviä. Liekkejä on kolme (HUD:n
  liekit): yksi palautuu 1,6 sekunnissa, ja tulimarja täyttää kaikki heti.
  Laava alhaalla, kivipilarit ja tippukivet sekä tuhkapilvet vievät sydämen;
  lyhdyt ovat tarkistuspisteitä (lyhdyn jälkeen sytytetyt soihdut sammuvat, jos
  sydämet loppuvat). Opastenuoli näyttää seuraavan sammuneen soihdun. Kun
  kaikki soihdut palavat, kanjonin päässä oleva lohikäärmeiden **rovio** hehkuu:
  sytytä se. Tehtävät: vähennys, puuttuva ruutu.
- **Munapesä** — ei liikkumista, ei sydämiä. Luolan hyllyillä on kuusi
  lohikäärmeenmunaa kolmella kuviolla (pilkut, raidat, siksak), ja lattialla
  kolme pesää, joiden kyltissä on kuvio. **Raahaa** muna pesään, jonka kuvio on
  sama; väärään pesään pudotettu muna keikahtaa takaisin hyllylle. Kun pesässä on
  kaksi munaa, **pidä sormea pesän päällä**: Minttu lentää viereen ja puhaltaa
  lämpöä, lämpörengas täyttyy 2,6 sekunnissa ja munat halkeilevat vaihe
  vaiheelta, kunnes poikaset kuoriutuvat. Irti päästettynä lämpö hiipuu, joten
  hautominen tehdään yhdellä pidolla. Käsi näyttää sekä raahauksen että pidon.
  Kaksi kierrosta, joiden kuviot, pesien järjestys ja munien hyllyt arvotaan
  joka peluukerralla (30.9.2026, palaute: liian helppo, ei kutsu uusintaan).
  Ensimmäisellä kierroksella pesät ovat eriväriset. Toisella kaksi pesää on
  samanvärisiä ja kuviot lähes samanlaiset (pienet pilkut / isot täplät, vaaka-
  / pystyraidat, siksak / renkaat), ja luolan suulta puhaltaa **kylmä puhuri**:
  huurre ja iso lumihiutale kasvavat 1,5 s varoitukseksi, ja puhallus nollaa
  kaikkien keskeneräisten pesien lämmön (Minttu värisee). Hautominen (2,6 s)
  on ajoitettava puhurien väliin (tyyntä 4–5,5 s). Tehtävät: järjestä koon
  mukaan (kierrosten välissä), samanlainen (toisen kierroksen ensimmäisen
  kuoriutumisen jälkeen).
- **Aarrevaaka** — ei liikkumista, ei sydämiä. Vanha lohikäärme Vaari laittaa
  kultaisen vaa'an vasempaan kuppiin jalokiviä; raahaa lattian jalokiviä oikeaan
  kuppiin, kunnes vaaka on tasan. Pieni jalokivi painaa yhden ja iso kaksi, ja
  vaaka **kallistuu heti** painavamman puolen mukaan, joten liian painavan kupin
  näkee ja kiven voi raahata takaisin lattialle. Osoitin muuttuu vihreäksi
  tasapainossa. Viisi arvottua kierrosta (30.9.2026, palaute: liian helppo):
  jalokivissä on kolme painoa (pieni 1, iso 2, jättikivi 3; valkoiset pisteet
  kertovat painon), ja lattialla on vain 5–6 kiveä, joten yhdistelmä on
  mietittävä. Vaarin paino arvotaan lattiakivien jostakin yhdistelmästä
  (3–4, 4–5, 5–6, 7–8, 8–9), joten kierros ratkeaa aina. Kolmannesta
  kierroksesta alkaen **harakka** huutaa oikeasta reunasta (!) ja syöksyy
  kupille noin 8–11 sekunnin välein: se vie viimeksi lisätyn kiven takaisin
  lattialle, ellei sitä napauteta pois ennen kuin se ehtii kupille. Joka
  kierroksesta Vaarin kasaan tulee uusi aarre; jos oikea kuppi ei kertaakaan
  käynyt liian painavana, aarre hehkuu HUD:ssa kultaisena (virheetön punnitus).
  Tehtävät toisen ja neljännen kierroksen jälkeen: kummalla enemmän, lasku.
- **Tulivuoren jätti** ♥ — vartija, joka yhdistää **ritsan ja tulihengityksen**.
  Kraatterissa nukkuva Kivijätti herää, nostaa kätensä varoitukseksi ja heittää
  laavakiviä kaaressa prinsessaa kohti. Kun kivi tulee kantamalle, sen ympärille
  syttyy oranssi rengas: tulinappi (tai toinen sormi) puhaltaa Mintun tulipallon,
  joka sulattaa lähimmän kiven. Ohi mennyt kivi vie sydämen. Heittojen jälkeen
  jätin etureunassa aukeaa **kristalli-ikkuna** arvotussa paikassa (vatsa,
  olkapää tai otsa) hetkeksi (3,0 / 2,4 / 1,9 s, valkoinen aikakaari kutistuu):
  ammu siihen tulimarja ritsalla, ennakkokaari kultaisena kun osuu. Jos ikkuna
  ehtii sulkeutua, jätti heittää uuden sarjan. Kolme kierrosta: 2, 3 ja 4 kiveä,
  nopeammin ja lyhyempi ikkuna. Kolmas osuma lämmittää jätin sydämen, ja se
  rauhoittuu ystäväksi. Sydänten loppuminen aloittaa kierroksen heitot alusta.
  HUD näyttää osumat ja sulatettujen kivien määrän. Tehtävät osumien välissä:
  kuviosarja, muistiloitsu 5/4.

### Kaukamaa: Hohtometsä (maailma 11)

Mantereen toinen paikka, yöllinen hohtosienimetsä. Aukeaa, kun Lohikäärmelaakson
vartija Tulivuoren jätti on läpäisty. Varjoperhonen on vienyt tulikärpästen
valot, ja prinsessa kerää ne takaisin. Kaksi uutta verbiä, **pomppu** ja
**sipaisu**, ja vartija yhdistää ne. Vaikeus on mitoitettu Tulivuoren jätin
tasolle (palaute: se oli juuri lapsen ylärajalla); välikenttä on hieman
helpompi. Kaikki kentät arvotaan joka peluukerralla. Neljäs kenttä, Kuunsäde,
on rauhallisempi ajattelupulma ennen vartijaa (uusi verbi **kääntö**).

- **Sienipomppu** ♥ — uusi verbi: **pomppu**. Prinsessa pomppii itsestään
  sienten hatuilla ylöspäin kohti Kuukukkaa, ja sormi ohjaa sivuttain
  (prinsessa hakeutuu sormen kohdalle pehmeästi). Rata arvotaan neljään
  kovenevaan osioon: tavalliset sienet; liikkuvat (nuolet hatun reunoilla) ja
  jousisienet (pinkki, kierre, iso pomppu); lakastuvat sienet (ruskeat, kestävät
  yhden pompun) ja takiaiset (piikkipallot, osuma vie sydämen). Jokaisen osion
  alussa on lyhtysieni, joka syttyy tarkistuspisteeksi ja täyttää sydämet.
  Alas pudotessa menee sydän ja prinsessa palaa viimeiselle lyhdylle.
  Jokainen arvottu hyppy tarkistetaan simuloimalla: sen pitää onnistua, vaikka
  sormi lähtisi seuraavan sienen kohdalle vasta osion reaktioajan jälkeen
  (0,6 / 0,48 / 0,42 / 0,38 s). Tulikärpäsiä on 12 bonuksena (HUD), ja oikean
  reunan mittari näyttää matkan Kuukukalle. Tehtävät toisella ja neljännellä
  lyhdyllä: laske, kuviosarja.
- **Tulikärpässieppo** ♥ — uusi verbi: **sipaisu**. Prinsessan purkin paikat
  näyttävät, minkä värisiä tulikärpäsiä haavitaan. Liikkuva sormi vetää
  hohtavaa haavia (paikallaan oleva ei nappaa). Väärän värinen säikähtää ja vie
  purkista viimeksi napatun mukanaan. Varjokoihin osuminen vie sydämen ja
  rikkoo haavin hetkeksi, ja myöhemmillä kierroksilla koit hakeutuvat haavin
  valoa kohti. Neljä kierrosta: yksi arvottu väri, toinen väri, välkkyvät
  tulikärpäset (pimeänä ei voi napata) ja lopuksi värit järjestyksessä.
  Sydänten loppuessa kierros alkaa alusta. Tehtävät: erilainen, järjestys.
- **Kuunsäde** — uusi verbi: **kääntö**. Kuukivi kerää kuun valon ja lähettää
  säteen kivilaattojen yli. Napautus kääntää kristallipeiliä (/ ↔ \), ja säde
  kimpoaa peileistä; kivet pysäyttävät sen. Kun säde sytyttää kaikki kuukukat
  yhtä aikaa, kierros on valmis. Neljä arvottua, kovenevaa kierrosta: 4×3
  ruudukko, 2 peiliä ja 1 kukka; 5×4, 3 peiliä, 2 kukkaa, hämäyspeili ja kivi;
  5×4, 4 peiliä ja varjokoi; 6×4, 5 peiliä ja 3 kukkaa. Toisesta kierroksesta
  alkaen kuu laskee (70 / 65 / 60 s, aikakaari kuun ympärillä, viimeiset 10 s
  oranssina): jos se ehtii laskea, pilvi peittää kuun ja kierros arvotaan
  uudestaan. Kolmannesta kierroksesta alkaen varjokoi lentää säteellä olevan
  peilin päälle ja pimentää säteen; napautus häätää sen. Nukkuvat tulikärpäset
  ovat bonuksia: ne heräävät, kun säde kulkee niiden kautta (yleensä vain jollain
  muulla peiliasennolla). Ei sydämiä. Tehtävät: reitti, vähennys.
- **Varjoperhonen** ♥ — vartija, joka yhdistää **sipaisun ja pompun**. Joka
  kierros alkaa parvella: perhonen lähettää varjokoita hohtokuplassa seisovaa
  prinsessaa kohti, ja sipaisu hajottaa ne (koit väistävät lähestyvää haavia;
  perille päässyt vie sydämen). Sitten perhonen syöksyy matalalle ja lipuu
  sivuttain, ja sen sydänpilkku hehkuu (valkoinen aikakaari kutistuu).
  Prinsessa pomppii kolmella sienellä, ja sormi ohjaa. Pilkkuun ylttää vain
  pompun huipulla, sienen kohdalta ja kun pilkku on heilunnan alaosassa, joten
  ajoitus ratkaisee. Sienten väliin maahan pudonnut pomppii matalalle.
  Perhonen pudottaa varjoitiöitä prinsessan kohdalle. Jos aika loppuu, tulee
  uusi parvi. Kolme kierrosta: enemmän ja nopeampia koita, nopeampi lipuminen,
  lyhyempi ikkuna. Kolmas osuma palauttaa valot, ja perhonen muuttuu vaaleaksi
  kuukehrääjäksi. Tehtävät osumien välissä: peili, muistiloitsu 5/4.

### Kaukamaa: Aurinkodyynit (maailma 12)

Mantereen kolmas paikka, aavikko keitaineen itärannalla. Aukeaa, kun
Hohtometsän vartija Varjoperhonen on läpäisty. Hiekkamyrsky on hajottanut
karavaanin, ja prinsessa kulkee dyynien yli keitaalta toiselle ja etsii
haudatut aarteet. Vartija Hiekkapyörre yhdistää alueen kaksi verbiä, liu'un ja
etsinnän (`finaleKind: 'whirl'`). Kamelikaravaani täytti sokkelon usvahuoneen
30.9.2026 (laskut saivat hyvää palautetta, joten niistä tehtiin oma kenttä).

- **Dyynilasku** ♥ — uusi verbi: **liuku**. Prinsessa liukuu hiekkalaudalla
  itsestään tasaista vauhtia itään; napautus hyppää. Lyhyt napautus on matala
  hyppy (noin 0,17 ruudun korkeus), pohjassa pitäminen korkea ja pitkä hyppy
  (0,30); napautus juuri ennen laskeutumista laukeaa laskeutuessa. Esteet:
  kaktus (matala hyppy riittää), korkea kaktus (korkea hyppy), skorpioni
  (kulkee edestakaisin), tuplakaktus ja juoksuhiekka (pitkä hyppy). Törmäys
  vie sydämen ja hidastaa hetkeksi, jolloin takana seuraava hiekkamyrsky
  lähestyy; kiinni saanut myrsky vie sydämen. Yläreunan mittari näyttää
  prinsessan, myrskyn ja keitaat. Kolme arvottua osuutta, joiden lopussa on
  keidas (sydämet täyttyvät, matka jatkuu napautuksella): 1) kaktukset,
  2) + korkea kaktus ja skorpioni, 3) + tuplakaktus ja juoksuhiekka; vauhti
  0,30 / 0,33 / 0,36 ruutua/s ja esteet tihenevät. Kunkin estetyypin kaksi
  ensimmäistä saavat maahan hyppymerkin (keltainen nuoli = napauta, kaksi
  pinkkiä = pidä pohjassa), ja käsi näyttää napautuksen ennen ensimmäistä
  hyppyä. Jokaisen esteen ajoitusikkuna lasketaan simuloimalla (vähintään
  0,3 s, keskimäärin noin 0,45 s). Aurinkokivet ovat bonuksia: korkeiden
  esteiden yllä hypyn lakipisteessä ja matalalla esteiden välissä. Sydänten
  loppuessa palataan edelliselle keitaalle. Tehtävät keitailla: anna N
  kappaletta, kello. (Aiempi paino- ja kaarevuusliuku hylättiin 29.9.2026: se
  ei ollut intuitiivinen.)
- **Aarrevarpu** ♥ — uusi verbi: **etsintä**. Taikavarpu seuraa sormea hiekan
  yllä, ja sen kärki jättää hehkuvan jäljen: sininen on kylmä, turkoosi
  viileä, keltainen lämmin, oranssi kuuma ja kultainen tähti polttava (tästä
  kaivamalla arkku löytyy). Kärjen hehku ja äänimerkin tahti kertovat saman.
  Kun sormi pysyy paikallaan hetken (valkoinen rengas latautuu), aavikkokettu
  Fenni juoksee paikalle ja kaivaa. Kaivuja on rajallisesti (tassut HUD:ssa:
  arkut + 3 / 3 / 2 / 2 ylimääräistä); tyhjä kuoppa muistaa lämpönsä. Jos
  kaivut loppuvat, tuuli peittää kuopat ja arkut hautautuvat uusiin paikkoihin.
  Hiekassa piilee skorpioneja arkkujen lähellä: varpu värisee ja jälki saa
  punaiset renkaat niiden kohdalla, ja skorpionin päälle kaivaminen vie
  sydämen (sydänten loppuessa kierros alkaa alusta). Neljä arvottua,
  kovenevaa kierrosta: 1, 2, 2 ja 3 arkkua, 0–3 skorpionia, lyhenevä lämmön
  kantama, ja viimeisellä kierroksella tuulenpuuskat pyyhkivät jäljen.
  Säästyneet kaivut lentävät aurinkokivinä HUD:iin. Ketulle, kaktuksille ja
  kiville voi napauttaa. Tehtävät: maksa, kummalla enemmän.
- **Kamelikaravaani** ♥ — laskukenttä **raahaamalla**. Jokaisen kamelin kyltissä
  on luku, ja kameli jaksaa kantaa juuri sen verran: raahaa matolta numerosäkkejä
  (1–5, luku ja pisteet) kamelin selkään, kunnes säkkien summa on kyltin luku.
  Summaa ei näytetä, vaan se lasketaan itse. Liian painava kuorma saa kamelin
  istahtamaan: sydän menee, ja viimeksi nostettu säkki putoaa takaisin. Oikea
  kuorma: kyltti vihertyy ja kameli hymyilee. Selästä voi raahata säkin pois.
  Neljä arvottua, kovenevaa kierrosta: yksi kameli (5–7, kaksi säkkiä); kaksi
  kamelia (6–8); kaksi kamelia, joista toisen kuorma on kolme säkkiä (7–10);
  kolme kamelia, joista yksi istuu valmiiksi liian raskaana, joten sen selästä
  pitää ottaa säkki pois (vähennys). Ratkaisu arvotaan ensin, joten kierros
  ratkeaa aina, ja hämäyssäkkejä on 1–2; ykkössäkkejä on enintään yksi per
  kameli. Toisesta kierroksesta alkaen hiekkamyrsky lähestyy oikealta
  (70 / 75 / 90 s, mittari yläreunassa): jos se ehtii kameleille, sydän menee ja
  kierros arvotaan uudestaan, kuten myös sydänten loppuessa. Virheetön kierros
  antaa HUD:iin kultaisen säkin. Ensimmäisellä kierroksella käsi näyttää
  raahauksen. Kameliin voi napauttaa. Tehtävät toisen ja kolmannen kierroksen
  jälkeen: maksa, vähennys.
- **Hiekkapyörre** ♥ — vartija, joka yhdistää **liu'un ja etsinnän**.
  Kiukkuinen pyörremyrsky hajotti karavaanin ja hautasi sen taikalampun. Joka
  kierros alkaa liu'ulla kuten Dyynilaskussa: lauta liukuu itsestään, napautus
  hyppää (pohjassa korkeammalle), ja pyörre ajaa takaa (törmäys hidastaa,
  kiinni jääminen ja esteet vievät sydämen). Keitaalla alkaa etsintä: varpu ja
  lämpöjälki kuten Aarrevarvussa, ja Fenni kaivaa. Pyörre leijuu taivaanrannassa
  ja kerää voimaa (rengas sen ympärillä, viimeinen neljännes punaisena): kun
  rengas täyttyy, se puhaltaa, vie sydämen ja hautaa lampun uuteen paikkaan.
  Skorpionit pistävät. Löydetty lamppu nousee ja ampuu valonsäteen pyörteeseen,
  joka kutistuu. Kolme kierrosta: liukuvauhti 0,31 / 0,34 / 0,37 ruutua/s,
  6 / 8 / 10 estettä (tuplakaktus toisesta, juoksuhiekka kolmannesta
  kierroksesta; ei hyppymerkkejä), 1 / 2 / 3 skorpionia etsinnässä, lyhenevä lämmön
  kantama ja puhallusväli 20 / 17 / 14 s; kahdella viimeisellä tuulenpuuskat
  haalistavat jäljen. Sydänten loppuessa vaihe alkaa alusta (liuku radan
  alusta, etsintä uudella lampulla). Kolmas osuma rauhoittaa pyörteen
  lempeäksi tuulihengeksi, ja karavaanin kameli palaa. Pyörteeseen ja kettuun
  voi napauttaa. Tehtävät osumien välissä: lajittele, muistiloitsu 5/4.

### Kaukamaa: Porkkanakumpu (maailma 13)

Mantereen neljäs paikka, pupujen vihreät kummut etelärannalla. Aukeaa, kun
Aurinkodyynien vartija Hiekkapyörre on läpäisty. Syntyi palautteesta:
reittitehtävän pupun ohjaus oli mieluisa, joten siitä tehtiin isompi ja
haastavampi oma kenttä, ja Kuunsäteen peilipulmasta värimuunnelma. Vartija
Myyräkuningas yhdistää ne (`finaleKind: 'mole'`). Loitsupolku täytti sokkelon
usvahuoneen 30.9.2026 (palaute: pupun ohjelmointiin isompia ja haastavampia ratoja).

- **Pupupolku** — uusi verbi: **ohjelmointi**. Napauta nuolia ohjelmariville ja
  paina ▶: pupu hyppii ohjelman askel kerrallaan (käynnissä oleva ruutu
  hehkuu). Ohjelmarivin ruudun napautus poistaa sen. Pensas, reuna tai
  suljettu portti pysäyttää pupun (punainen !), ja jos ohjelma loppuu ennen
  maalia, pupu ihmettelee (?); kummassakin pupu palaa alkuun ja ohjelma jää
  korjattavaksi. Neljä arvottua, kovenevaa kierrosta: 5×5 ja yksi porkkana
  (rivi 8); 6×5, kaksi porkkanaa ja lopuksi kotikoloon (rivi 10); 6×6, avain
  avaa portin ja **toistonapit** ×2 / ×3 kertaavat viimeisen nuolen (rivi 7,
  joten toistoa on pakko käyttää); 7×6, kaksi porkkanaa, avain ja toisto
  (rivi 8). Jokainen rata tarkistetaan leveyshaulla: ratkeaa, reitti on
  kierroksen mittainen, siinä on vähintään kaksi käännöstä, portti on
  pakollinen ja toistokierroksilla reitti ei mahdu riville ilman toistoa.
  Ensimmäisellä ajolla onnistunut kierros antaa kultaisen porkkanan (HUD).
  Ensimmäisellä kierroksella käsi näyttää kaksi ensimmäistä nuolta ja ▶:n.
  Ei sydämiä. Pupuun ja porkkanoihin voi napauttaa. Tehtävät: lasku, vähennys.
- **Värisäde** — Kuunsäteen muunnelma **värilaseilla**. Aurinkokivi lähettää
  valkoisen säteen, ja peiliä käännetään napauttamalla kuten Kuunsäteessä.
  Värilasit ovat kiinteitä: säde saa lasin värin, ja kaksi eri lasia sekoittaa
  värit kuten Taikakeittiössä (punainen + keltainen = oranssi, punainen +
  sininen = violetti, keltainen + sininen = vihreä, kaikki kolme = ruskea).
  Kukat ovat värillisiä ja aukeavat vain oman värisestä valosta; väärän värinen
  valo saa kukan värisemään. Neljä arvottua, kovenevaa kierrosta: 4×4, yksi
  lasi ja kukka; 5×4, kaksi lasia (sekoitus) ja kaksi eriväristä kukkaa;
  5×5, neljä peiliä ja kimalainen; 6×5, viisi peiliä ja kolme kukkaa.
  Hämäyslasit ja -peilit reitin ulkopuolella. Toisesta kierroksesta alkaen
  aurinko laskee (75 / 70 / 65 s): pilvi peittää sen ja kierros arvotaan
  uudestaan. Kimalainen istuu säteellä olevalle peilille ja varjostaa säteen;
  napautus häätää sen. Perhoset lepäävät ruuduissa bonuksena. Laseihin,
  kukkiin ja kiviin voi napauttaa. Tehtävät: sekoita väri (sekavärit), lasku.
- **Loitsupolku** — Pupupolun isompi jatko: **loitsu** eli aliohjelma. Rivejä on
  kaksi: pupurivi (pääohjelma) ja ★-rivi (loitsu). Rivin napautus valitsee sen
  (keltainen kehys), nuolet ja ⏸ menevät valitulle riville, ja ★-nappi lisää
  pupuriville loitsun, jolloin pupu tekee koko ★-rivin (pupu kimaltaa, ja
  käynnissä oleva ruutu hehkuu kummallakin rivillä). Pupurivi on niin lyhyt,
  ettei reitti mahdu siihen ilman loitsua. Kolmannesta kierroksesta alkaen
  niityllä on **myyriä**, jotka nousevat joka toisella askeleella (ylhäällä
  parillisilla askelilla; ajon ulkopuolella ne kurkkivat samassa tahdissa), ja
  **odota**-nappi ⏸ pitää pupun paikallaan yhden askeleen. Pensas, reuna tai
  nouseva myyrä pysäyttää pupun (!), ohjelman loppuminen kesken saa sen
  ihmettelemään (?), ja ohjelma jää korjattavaksi. Neljä arvottua, kovenevaa
  kierrosta: 7×5, loitsu valmiina ja pupurivi 4 (2 loitsua + 2 nuolta);
  7×5, loitsu 3 ja pupurivi 5, kaksi porkkanaa; 7×6, pupurivi 6, myyrät ja
  odotus; 8×6, loitsu 4 ja pupurivi 7, kaksi odotusta, myyrät ja kaksi
  porkkanaa. Rata rakennetaan arvotusta ohjelmasta (loitsu kolmesti), joten se
  ratkeaa aina; myyrät ovat reitillä odotusten jälkeen ja hämäysmyyrät reitin
  vieressä, ja leveyshaku varmistaa, ettei lyhin reitti mahdu pupuriville ilman
  loitsua. Käsi näyttää ★-napin, ★-rivin ja ⏸:n niiden ensimmäisellä
  kierroksella. Ensimmäisellä ajolla onnistunut kierros antaa kultaisen
  porkkanan. Ei sydämiä. Tehtävät: lukumäärä, kuviosarja.
- **Myyräkuningas** ♥ — vartija, joka yhdistää **ohjelmoinnin ja värisäteen**.
  Myyräkuningas on vienyt kummun värit, ja sen kruunun kiteet ovat himmeät.
  Uusi sääntö: pupu kääntää kristallipeiliä hyppäämällä sen päälle (tassunjälki
  peilin kulmassa; toinen hyppy kääntää takaisin). Ohjelmoi pupun reitti
  nuolilla niin, että kun ohjelma loppuu, aurinkokiven säde kulkee värilasien
  kautta kiteeseen oikean värisenä (katkoviivarengas kertoo kiteen värin).
  Säde näkyy koko ajan ja muuttuu pupun hyppiessä. Pensaat, kivet, lasit ja
  kide tukkivat pupun tien; kivet pysäyttävät myös säteen. Epäonnistunut ajo
  (törmäys tai väärä lopputulos) vie sydämen, ja pupu ja peilit palaavat
  alkuun; sydänten loppuessa kierros arvotaan uudestaan. Kolme kierrosta: 5×4,
  yksi väärä peili ja yksi lasi (rivi 8); 6×5, kaksi väärää peiliä, kaksi
  lasia ja reitin peili, jota ei saa kääntää (rivi 10); 6×6, kolme väärää
  peiliä ja toistonapit (rivi 8, toisto pakollinen). Jokainen rata tarkistetaan
  leveyshaulla (pupun paikka × peilien parillisuus). Osuma sytyttää kruunuun
  kiteen; kolmas palauttaa värit, ja Myyräkuningas ilahtuu. Kuninkaaseen voi
  napauttaa. Tehtävät osumien välissä: lasku, vähennys.
- **Yhteispolku** (bonushuone vartijan jälkeen, 1.10.2026) — **yhteispeli**
  lapselle ja aikuiselle samalla tabletilla. Kaksi pupua samalla niityllä:
  vasemman puolen pelaaja ohjelmoi pinkin pupun ja oikean puolen pelaaja
  sinisen (kummallakin omat nuolet, ⏸ ja kahden rivin ohjelma), ja keskellä
  oleva ▶ ajaa molemmat ohjelmat yhtä aikaa askel kerrallaan. Niittyä halkoo
  pensasaita, jonka **portti** on auki vain, kun toinen pupu seisoo
  samanvärisellä **laatalla** (katkoviiva yhdistää laatan porttiinsa): toisen
  on odotettava laatalla, kun toinen kulkee portista. Pensas, reuna, suljettu
  portti tai toinen pupu (samaan ruutuun tai ristiin) pysäyttää pupun (!).
  Kierros onnistuu, kun molemmat ovat omassa kolossaan (värilippu) ja
  porkkanat on kerätty. Neljä arvottua, kovenevaa kierrosta: 6×5, yksi aita ja
  laatta, sininen kolo lähtöpuolella (rivi 8); 7×5, laatta aidan kummallakin
  puolella ja molemmat kolot takana (rivi 10); 8×5, kaksi aitaa ja kaksi
  porttia (rivi 12); 8×5, kaksi aitaa ja neljä laattaa (rivi 14). Jokainen
  rata ratkaistaan yhteisellä leveyshaulla (molempien pupujen paikat), ja
  ratkaisussa jonkun on aina odotettava. Ensimmäisellä kierroksella käsi
  näyttää ⏸:n sille pelaajalle, joka odottaa. Ensimmäisellä ajolla onnistunut
  kierros antaa kultaisen porkkanan. Ei sydämiä. Tehtävä toisen kierroksen
  jälkeen: parit (5 paria, kahdestaan).

### Kaukamaa: Kellopaja (maailma 14)

Mantereen viides paikka, tonttujen mekaaninen paja lounaisrannalla. Aukeaa,
kun Porkkanakummun vartija Myyräkuningas on läpäisty. Jatkaa loogisten
pulmien linjaa (palaute 1.10.2026: Loitsupolku ja Kamelikaravaani olivat
"liki täydellinen ylätaso vaikeudelle"). Uusi verbi: **rattaat**. Sokkelossa
on kaksi usvahuonetta: Vesikouru (kourupalojen kääntö, vesi myllylle) ja
vartija Kellokoneisto. Kunnes vartija on tehty, `finaleKind` on `'gear'`.

- **Rataspaja** — tonttu veivaa moottoriratasta pajan seinällä. Raahaa
  rattaita laatikosta tappitaulun tappeihin: ratas, joka koskettaa pyörivää
  ratasta, alkaa heti pyöriä vastakkaiseen suuntaan, ja kun ketju yltää
  **soittorasiaan** (värillinen ratas, jonka kannessa on tähti), rasia hehkuu
  ja soi. Tapit ovat kolmiohilassa, joten ratas voi koskettaa kuutta
  naapuria: jos kolme ratasta koskettaa toisiaan kolmiossa, koneisto
  **jumittuu** (rattaat tärisevät punaisina eikä mikään pyöri). Toisesta
  kierroksesta alkaen rasian ympärillä on suuntanuoli: rasian on pyörittävä
  siihen suuntaan, ja suunta riippuu ketjun pituudesta (joka toinen ratas
  pyörii vastapäivään). Väärään suuntaan pyörivä rasia narisee ja nuoli
  punertuu. Suorin reitti antaa aina väärän suunnan ainakin yhdelle rasialle,
  joten ketjuun on tehtävä mutka. Rattaita on vain ratkaisun verran ja 1–2
  ylimääräistä, ja rikkinäisiin tappeihin (×) ei voi laittaa ratasta. Ratasta
  voi siirtää tai viedä takaisin laatikkoon. Neljä arvottua, kovenevaa
  kierrosta: 6×3 ja yksi rasia ilman suuntaa; 7×4 ja suunta; 7×4 ja kaksi
  rasiaa; 8×5 ja kolme rasiaa. Ratkaisu rakennetaan ensin puuna, jossa mikään
  ratas ei koske kahta muuta, joten kierros ratkeaa aina. Ensimmäisellä
  kierroksella käsi vie rattaan moottorin viereen. Kierros ilman yhtään jumia
  antaa kultaisen rattaan. Tonttuun voi napauttaa. Ei sydämiä. Tehtävät:
  kello, kuviosarja.

### Linnan sisustus

Jokainen läpäisty kenttä (myös uusinta) antaa **2 tähteä**, ja +1 jos sydämet
säilyivät täysinä; juhlassa näkyy "+n". Tähtisaldo näkyy kartoilla vasemmalla
ylhäällä. **Linnakartta:** saaristokartan ja Kaukamaan kartan vasemmassa
reunassa (tähtisaldon alla) on vaaleanpunainen linnanappi, joka avaa linnan
oman karttanäkymän. Siinä linna on leikattu auki ja jokainen huone näkyy
pienoiskuvana maaleineen ja tavaroineen: tornihuone ylhäällä, keittiö ja sali
maan tasalla, pankkiholvi maan alla ja puutarha pihalla linnan vasemmalla
puolella. Huoneen napautus vie suoraan huoneeseen;
huoneen kotinappi palaa linnakartalle ja linnakartan venenappi sille kartalle,
jolta tultiin. Huoneistossa on neljä sisähuonetta ja puutarha: **sali** (sydäntapetti, ikkuna),
**tornihuone** (tähtitaivas, pyöreä kuuikkuna, kivilattia), **keittiö**
(kaakeliseinä, verhoikkuna yrttiruukulla, astiakisko, ruutulattia) ja
**pankkiholvi** (kultaiset seinälevyt, lyhdyt, kivilaatat). Salista oikea ovi
(portaat-kyltti) vie torniin, vasen ovi (kattila-kyltti) keittiöön ja keskimmäinen
rautaovi (tähti-kyltti) holviin; muista huoneista palataan saliin (sydän-kyltti).
Puput tulevat perässä.
**Pankkiholvi:** takaseinän pyöreässä holvissa säilytetään tähtiä. Kultainen nappi
(tähti ja nuoli holviin) vie yhden tähden kukkarosta holviin, hopeinen nappi
nostaa yhden takaisin; tähti lentää kaupan saldon ja holvin väliä. Napin
pitäminen pohjassa siirtää tähtiä yhä nopeammin. Ylin, hehkuva nappi (kolme
tähteä) **tallettaa kaikki**: koko kukkaro lentää tähtiparvena holviin.
**Oven sulkeminen:** napautus auki olevaan oveen kääntää sen kiinni, jolloin
salvat napsahtavat ja pyörä näkyy; napautus suljettuun oveen pyörittää pyörää,
vetää salvat ja avaa oven. Suljetusta holvista ei voi tallettaa eikä nostaa
(napeissa lukko, painallus tärähdyttää ovea). Oven asento tallentuu ja näkyy
linnakartalla. Napautus avoimen holvin sisään hypäyttää tähtikasaa. Holvin kyltti näyttää
talletuksen, ja holvin kasa näyttää sen **kymmenjärjestelmänä**: iso kultaharkko
tähtileimalla = 100 tähteä, pieni kultaharkko = 10 ja tähti = 1 (456 = 4 isoa
harkkoa, 5 pientä ja 6 tähteä; yli 999 tähden päälle ilmestyy kruunu). Kun
talletus osuu tasakymmeneen, tähdet sulavat harkoksi kilahduksella, ja
tasasadassa soi pieni fanfaari. **Korko:** joka vuorokausi holvi
antaa 1 tähden jokaista kymmentä talletettua kohden (vähintään 1), ja korko
lisätään talletukseen (korkoa korolle). Holvin kehällä kiertävä aurinko näyttää,
kuinka pitkällä seuraava korko on. Kun holviin tullaan korkopäivän jälkeen,
uudet tähdet ilmestyvät juhlan kanssa ("+n"); linnakartalla holvin kohdalla
näkyy siihen asti "+n". Pankin tavarat: säästöpossu (kolikko putoaa rakoon,
pupu syöttää sitä), avaintaulu (avaimet helisevät), kultakasa, rahasäkit,
kassakaappi (aukeaa, sisällä aarteita), jalokivivitriini (kimaltaa),
pankkitiski (kello soi, pupu asettuu virkailijaksi) ja kruunu tyynyllä.
Keittiön tavarat: hedelmäkulho ja piparilautanen (puput syövät), kattilat
seinällä (kilisevät), tiskiallas (hana laskee vettä), seinäkaappi (aukeaa,
sisällä mukit ja lautaset), liesi (levy hehkuu ja kattila kiehuu), ruokapöytä
(kynttilä syttyy, kaksi pupua istuu pöytään) ja jääkaappi (ovi aukeaa, valo
ja herkut). Tavaroita voi viedä mihin huoneeseen vain.
**Puutarha:** linnan viides huone on ulkona: taivas, aita (seinämaali),
nurmikko ja kivipolku (lattiamaali), ja linnan muurin portti (kattila-kyltti)
vie keittiöön; keittiön vasen ovi (kukka-kyltti) tuo puutarhaan. Kauppa aukeaa
puutarhassa puutarhasivulta. Kasvit (tulppaanit, auringonkukka, mansikat,
porkkanapenkki, ruusupensas, kurpitsa, omenapuu, taikakukka) istutetaan
raahaamalla kuten huonekalut, ja ne alkavat siemenenä multakummussa.
**Kastelu:** kastelukannu (1 tähti) raahataan niin, että sen suutin on kasvin
kohdalla: kannu kallistuu, vesi valuu ja noin 0,6 s:n kaadon jälkeen kasvi
kasvaa askeleen (siemen, taimi, nuppu, kukka/kypsä; 4 kastelua). Kastelun
jälkeen kasvi juo 3 s, ennen kuin se kasvaa taas. Janoisen kasvin yllä on
vesitippakupla. Täysikasvuinen kasvi janoaa taas seuraavana päivänä (nuokkuu,
auringonkukka surullinen), kunnes se kastellaan. **Sato:** kypsän mansikan,
porkkanan tai kurpitsan napautus pudottaa herkun ja kasvi palaa nupuksi;
omenapuusta putoaa omena kerrallaan (3), sitten se kukkii uudelleen. Pupu
juoksee herkun luo ja syö sen. Kukkien napautus heilauttaa niitä ja soittaa
(taikakukka soittaa sävelmän sateenkaarikipinöin). **Aurinko** taivaalla
hymyilee ja pyörittää säteitään napautuksesta, ja kukat hypähtävät.
**Rikkaruohot** kasvavat nurmikolle (enintään 3), ja napautus kiskoo ne irti.
Puutarhatavarat: lapio (kaivaa, multaa lentää), kottikärryt (vierivät, pupu
istuu kyytiin), puutarhatonttu (lakki heiluu), linnunpönttö (lintu kurkistaa ja
visertää), mehiläispesä (mehiläiset lentävät laajemmalle), lintujen allas
(roiskuu) ja keinu (heiluu, pupu keinuu).
Oikean reunan kaupasta ostetaan huonekaluja tähdillä (hinta tähtinä kortissa)
**raahaamalla**: tartu korttiin, vedä tavara huoneen puolelle ja päästä irti
haluamaasi kohtaan, niin tähdet veloitetaan. Kaupan päälle palautettu tavara
peruu oston. Liian kallis kortti ravistaa. Kauppa on sivutettu, sivua
vaihdetaan alareunan nuolista. Tavarat ovat siinä huoneessa, johon ne on
tuotu, ja niitä voi raahata minne vain (seinätavarat seinälle, lattiatavarat
lattialle). **Siirto ja varasto:** tavara raahataan **ovelle**, niin se muuttaa
toiseen huoneeseen (ilmestyy sen oven viereen); tavara raahataan **kaupan
päälle**, niin se menee varastoon, ja sen kortissa näkyy laatikko. Varastosta
tavaran saa takaisin raahaamalla kortista huoneeseen ilmaiseksi.
**Maalit ja rusetit** ovat kaupan viimeisellä sivulla, ilmaisia: maalipurkki
raahataan seinälle tai lattialle, ja pinta vaihtaa väriä (huoneittain, myös
lattialista); rusetti raahataan pupun päähän. Maalit ja rusetit tallentuvat. Napautus tavaraan tekee
jotain: lamppu ja valosarja syttyvät, soittorasia ja piano soittavat, kello
lyö, pallo pyörii, keinuhevonen keinuu, arkku aukeaa, kakun kynttilä sammuu,
akvaarion kalat säntäävät, teekannu höyryää. Puput reagoivat: peti nukuttaa
(tai nalle halataan), porkkanakulho tai kakku syöttää, pallon kanssa leikitään
(tai trampoliinilla pompitaan). Sisustus tallentuu. Vanha tallennus saa 2
tähteä jokaisesta jo läpäistystä kentästä, ja sen tavarat ovat salissa.

**Kartta**-nappi (🏠) palauttaa kentästä saaren labyrinttiin, ja labyrintin
**vene**-nappi (⛵ vasemmassa yläkulmassa) palauttaa saaristokartalle. Samaan
paikkaan pääsee myös kävelemällä satamaruutuun.

## Ohjaus

- Metsä, jää, suo, rannikko, tikkumetsä, paimen ja marjaniitty: pidä sormea pohjassa ratsastaaksesi, napauta kerätäksesi.
- Pesäkallio: paina mihin tahansa, vedä taakse ja päästä irti — ritsa laukaisee
  marjan vedon vastaiseen suuntaan; pistekaari näyttää lentoradan vetäessä.
- Tulilento: pidä pohjassa lentääksesi sormea kohti; tulinappi (tai toinen
  sormi / vasen alakulma) puhaltaa tulta lentosuuntaan.
- Munapesä ja Aarrevaaka: raahaa (paina, vedä, päästä irti); Munapesässä pito
  pesän päällä hautoo.
- Tulivuoren jätti: ritsa kuten Pesäkalliossa (vedä taakse, päästä irti) ja
  tulinappi (tai toinen sormi / vasen alakulma) sulattaa lähimmän laavakiven.
- Sienipomppu: prinsessa pomppii itsestään; pidä sormea ruudulla, niin hän
  hakeutuu sivusuunnassa sormen kohdalle.
- Tulikärpässieppo: sipaise (vedä sormea) tulikärpäsen läpi; paikallaan
  pysyvä sormi ei nappaa.
- Varjoperhonen: parven aikana sipaise koit pois, syöksyn aikana ohjaa pomppua
  sormella kuten Sienipompussa.
- Kuunsäde: napauta peiliä kääntääksesi sitä; napautus koihin häätää sen.
- Dyynilasku: napauta hypätäksesi (pidä pohjassa korkeampaan ja pidempään
  hyppyyn); lauta liukuu itsestään. Keitaalta liikkeelle napautuksella.
- Aarrevarpu: vedä sormea hiekalla (varpu jättää lämpöjäljen), pidä sormi
  paikallaan kaivaaksesi.
- Hiekkapyörre: liukuvaiheessa kuten Dyynilaskussa, etsintävaiheessa kuten
  Aarrevarvussa.
- Pupupolku: napauta nuolia ohjelmariville (×2 / ×3 kertaa viimeisen), ▶ ajaa;
  rivin ruudun napautus poistaa sen.
- Värisäde: napauta peiliä kääntääksesi sitä; napautus kimalaiseen häätää sen.
- Myyräkuningas: ohjelmoi kuten Pupupolussa; pupu kääntää peilin hypätessään sen päälle.
- Puutarha, lampi, luola, finaali, karkkilaakso ja torni: pidä pohjassa
  juostaksesi, **↑** hyppää, lyhyt napautus ampuu sauvalla (missä sauva on).
- Hyppy myös **toisella sormella**: kun yksi sormi juoksee, napautus millä
  tahansa toisella sormella mihin tahansa hyppää. Vasen alakulma napin
  ympärillä (27 vmin) hyppää sekin, vaikka napista osuisi ohi.
- Raahaustehtävät: paina palaa, vedä ja päästä irti kohteen päällä.
- Taikakynä, sadesuoja, pupusilta ja omenavarat: pidä pohjassa kävelläksesi;
  kynänappi ottaa kynän käteen, jolloin sormella piirretään. Omenavaroissa
  napautus pudottaa omenan puusta.
- Taivas, silta, karkkitaivas ja kotkalento: pidä pohjassa lentääksesi sormea
  kohti, **↑** on siivenisku.
- Tähtisumu, uniaika ja kirjainpuutarha: pelkkä napautus — hahmo ei liiku.
- Sirkusteltta: napautus irrottaa trapetsista (tai loikkaa korokkeelta).
- Kuumailmapallo: pidä pohjassa — sormi pallon yläpuolella nostaa, alapuolella
  laskee; tuuli vie sivulle.
- Jäätelökoju, ankkaonginta ja taikurin teltta: pelkkä napautus.
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
- **Sekoita väri** — kohdepullo kuplassa ja kolme pulloa (punainen, keltainen,
  sininen); kaada pataan värit, joista kohde syntyy. Väärä sekoitus pöhähtää ja
  tyhjenee. Käytössä puutarhassa (perus- ja sekavärit) ja Pilvipolulla (vain
  sekavärit, `{ mixLevel: 2 }`).
- **Lue sana** — sana TIKKUKIRJAIMIN tavuviivoilla (esim. KUK-KA) ja viisi
  kuvaa, joista yksi on sana. Sanan napautus lukee sen: tavut korostuvat ja
  soivat vuorotellen. Väärä kuva himmenee ja sana luetaan uudestaan; sana ei
  vaihdu, jotta sen voi tavata loppuun. Käytössä lammessa, Kuutamometsässä
  (2 tavua), Sadesuojassa, Pupusillalla ja tornissa (3 tavua).

- **Lajittele** (raahaus) — kaksi koria ja kuusi kuviota; korin merkki on joko
  värilaikku (lajittelu värin mukaan, muodot vaihtelevat) tai harmaa muoto
  (lajittelu muodon mukaan, värit vaihtelevat). Väärään koriin pudotettu palaa alas.
- **Järjestä koon mukaan** (raahaus) — neljä samanlaista kuviota eri kokoisina;
  raahaa ne portaille pienimmästä suurimpaan (katkoviivarengas näyttää koon)
- **Peilikuva** — 3×3 ruudukko molemmin puolin peiliviivaa; napauta oikean
  puolen ruutuja päälle ja pois, kunnes kuva on vasemman peilikuva
- **Yhdistä pisteet** — numerot 1…7 kuvion ääriviivalla; seuraava numero
  hehkuu ja kynä osoittaa sitä. Oikea napautus vetää viivan, väärä ravistaa.
  Valmis kuvio (tähti, talo, sydän, jalokivi, puu) täyttyy värillä.
- **Anna N kappaletta** — keko kuvioita pöydällä; napauta oikeanlaiset (sama
  muoto JA väri kuin kuplassa) koriin, kunnes kuplan määrä (2–4) on täynnä.
  Oikea kuvio lentää koriin kaaressa, väärä ravistaa. Hämääjät eroavat joko
  muodoltaan tai väriltään.
- **Puuttuva ruutu** — 2×2-ruudukko, jossa rivi määrää värin ja sarake muodon;
  yksi ruutu on piilossa (?). Valitse puuttuva kuvio kolmesta pallosta:
  väärät ovat sama muoto väärällä värillä ja väärä muoto oikealla värillä.

- **Kuva→sana** — kuva kuplassa ja kolme sanakorttia tavutettuna; kuvan
  napautus lukee sanan (tavut soivat). Väärä kortti himmenee, oikea luetaan.
- **Kokoa sana** (raahaus) — kuva kuplassa, tyhjät tavupaikat väliviivoilla
  ja tavukortit alhaalla (sanan tavut + 2 hämäystä). Raahaa tavut paikoilleen;
  seuraava paikka hehkuu. Valmis sana luetaan.
- **Alkukirjain** — iso kirjain kuplassa ja neljä kuvaa; valitse kuva, jonka
  sana alkaa kirjaimella. Väärä kuva himmenee; kirjaimen napautus soittaa sen.

- **Mitä kello on** — kellotaulu kuplassa näyttää ajan (punainen tuntiviisari,
  harmaa minuuttiviisari). Tasatuntien lisäksi tulee puolia (`7:30`) ja
  vartteja (`7:15` / `7:45`). Kolme palloa digiajoin; väärät ovat läheisiä
  aikoja. Väärästä arvotaan uusi kello.
- **Maksa** — lipussa hinta 3–9; pöydällä rahat 5, 2, 2, 1, 1, 1. Napautettu
  raha lentää lautaselle ja summa näkyy vieressä; lautasen rahan napautus
  palauttaa sen. Summa yli hinnan pöhähtää ja rahat palaavat pöydälle.
- **Palapeli** (raahaus) — kuva (pupu, linna, kukka, yksisarvinen, pallo)
  leikattuna 2×2 palaan (vartijassa 3×2, `{ pieces: 6 }`); malli kuplassa.
  Raahaa palat kehyksen ruutuihin; väärä ruutu palauttaa palan alas.
- **Reitti** — 4×4 ruudukko: pupu, porkkana ja pensaita. Napauta nuolia
  ohjelmariville (enintään 6), rivin napautus poistaa viimeisen, ▶ ajaa
  ohjelman askel kerrallaan. Pensaaseen tai reunaan törmäys palauttaa pupun
  alkuun (ohjelma säilyy korjattavaksi). Perillä porkkanalla tehtävä ratkeaa.

Kuvatehtävissä (samanlainen, erilainen, kuviosarja, kummalla enemmän, kello)
väärä vastaus arpoo uuden tehtävän, joten arvaamalla ei pääse läpi. Laskuissa
väärästä vastauksesta tulee vain ravistus.

## Kentän suunnittelun muistilista

Pelaaja on ikäryhmäänsä taitavampi, ja kenttä pelataan monta kertaa. Palautteen
mukaan (syyskuu 2026) kentät, joissa ei voi epäonnistua ja joiden sisältö on
joka kerta sama (Munapesä, Aarrevaaka), olivat hauskoja mutta liian helppoja
eivätkä kutsu uudelleen (ne korjattiin 30.9.2026: arvonta, kierrokset, puhuri
ja harakka); Pesäkallion ritsa sai kiitosta juuri haasteesta, ja
Tulilento oli aluksi liian kaoottinen. Uudessa kentässä pitää olla vähintään
kaksi seuraavista:

1. **Takaisku** — sydän, esineen menetys, aikaraja tai kierroksen uusinta.
2. **Ajoitus tai tarkkuus** — ikkuna noin 0,8 s, mieluiten ennakoiva vihje.
3. **Kasvava vaikeus** — monivaiheinen tai kierroksittain kovenevat kierrokset.
4. **Satunnaistus** — paikat, kuviot, painot tai järjestys arvotaan joka
   peluukerralla, jotta uusinta ei ole ulkoa opittu.
5. **Mitattava suoritus** — bonustähdet, virheettömyys tai aika, joka näkyy
   juhlassa (+1 tähti täysillä sydämillä on jo käytössä).

Rauhallinen kenttä ilman sydämiä on sallittu, mutta silloin vaihtelun on
tultava satunnaistuksesta ja kovenevista kierroksista. Ohjauksen pitää pysyä
hallittavana: vapaassa lennossa kiihtyvyys sormen etäisyyden mukaan ja
vaimennus, ei päälle/pois-ohjausta. Mittaa osuma- ja ajoitusikkunat
simuloimalla `VT`-kahvalla ennen tabletille viemistä.

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
- Sekoita väri: värit `MIX_COLORS` (tasks-mix.js), vaikeus `{ mixLevel }`; Taikakeittiön tilausmäärä `K_ORDERS`
- Pupupaimen: pöllön varoitus `1.2` s, pelästymissäde `viewW * 0.35`, pupun nopeus `viewW * 0.26`
- Lue sana: sanat `WORD_LIST` (tasks-extra.js), tavujen enimmäismäärä `makeTask(fx, 'word', { maxSyl })`, tavun kesto `WORD_SYL_T`
- Rannikko: aallon väli `6 + Math.random() * 3`, rapujen nopeus `viewW * 0.06`
- Tikkumetsä: pyörien nopeus `viewW * 0.06` ja kaistat `lollyWheels`, tikkareiden määrä `LOLLY_COUNT`
- Marjaniitty: marjojen määrä `BERRY_COUNT`, muistipelin parit `{ pairs: 6 }` (initBerry)
- Pupukahvila: tilausten määrä `CAFE_ORDERS`, kaksiosaiset tilaukset `doubles` (initCafe)
- Karkkilaakso: pompun voima `viewH * 1.15` (platformer.js), kuulakarkkien nopeus `viewW * 0.07`
- Torni: kattokruunujen heilunta `speed: 1.1`, kulma `0.55`
- Merenpohja: meduusojen nopeus/amplitudi `jellyDefs`, virtauksen voima `viewW * 0.35`, uinnin kiihtyvyys `viewW * 0.42` / `viewH * 0.55`
- Kuutamometsä: kiiltomadon valoaika `GLOW_ON = 1.5` jaksosta `GLOW_CYCLE = 2.9`, pöllön varoitus `1.2` s, syöksyn nopeus `dt * 1.3`
- Pilvipolku: haihtumisaika `PUFF_STAND = 0.7`, paluu `PUFF_BACK = 2.5`, myrskypallot `viewW * 0.07`
- Kuun vartija: tähtien väli `1.8 + Math.random() * 0.9`, varoitus `0.9` s, putoamiskiihtyvyys `viewH * 1.3`
- Sisustus: tähdet per kenttä `awardStars()` (progress.js, saldo `starCoins`), hinnat `HOME_ITEMS` (flow-home.js), kaupan sivukoko `HOME_SHOP_PAGE`, huoneet `HOME_ROOMS`, maalit `HOME_PAINTS`, rusetit `HOME_BOWS`
- Pankkiholvi: korko `BANK_RATE` (0,1 / vrk, vähintään 1), koron väli `BANK_DAY`, pisin laskettava poissaolo `BANK_MAX_DAYS` (flow-bank.js); testissä `VT.bankSkip(tunnit)` kelaa korkokelloa
- Sadesuoja: tahrojen väli `0.8 + Math.random() * 0.6`, alueet `rainZones`
- Pupusilta: pupun nopeus `viewW * 0.14`, lähtöetäisyys `viewW * 0.45`
- Sotkumörkö: heittoväli `2.4 + Math.random() * 1.2`, leijunta `1.2` s, muodontunnistus `penClassify` (pen-core.js: kulma `0.87` rad, pyöreys `0.13`)
- Kaivos: kartta `MINE_MAP` (play-mine.js), kaivuaika `MINE_DIG_T = 0.3`, askel `MINE_MOVE_T = 0.16`
- Kirjainniitty: alueet `LF_ZONES`, sanan pituus 3–5 kirjainta (`lfPickWords`), hämäyskirjaimia 2
- Tavukoski ja Kirjainpilvet: sanat `rapPickWords` (2+3 tavua / 3+4 kirjainta), kaistan nopeus `0.06 + rivi * 0.009`, tukin pituus `0.17` / `0.14`, keikahdus `tipT = 1.2`
- Sanapaja: tilauksia `WS_ORDERS`, tavukorttien hämäyksiä 2 (`makeBuildProblem`)
- Koski: kaistat `RAP_LANE_DEFS` (suunta, nopeus, tukin pituus, kilpikonna), kilpikonnan jakso `TURTLE_CYCLE/TURTLE_UP/TURTLE_WARN`, hypyn kesto `RAP_HOP_T`, laskeutumisen sallima `rowH * 0.3`
- Majakka: palikoita `LH_BLOCKS`, heilunnan nopeus `1.3 + stack * 0.1`, tarvittava päällekkäisyys `bw * 0.45` (lamppu `0.3`)
- Tuulenhuippu: puuskan vaiheet `WIND_WARN = 1.0` / `WIND_BLOW = 1.3`, tyyni `sumWindCalm()`, työntö `viewW * 0.15` (ilmassa ×1.6), suojaetäisyys kivestä `viewW * 0.08`, alueet `sumWindDefs`
- Taikakynä: musteen määrä `penInkMax = viewW * 1.6`, palautuminen `viewW * 0.22`/s, viivan ikä `PEN_LIFE = 8`, askelkorkeus `PEN_STEP = 0.07`, jyrkin viiva `PEN_SLOPE = 1.4`, kävelynopeus `viewW * 0.16`
- Karkkitaivas: karkkien määrä `CANDYSKY_COUNT`, ukkospilvet `tFx` (initCandysky)
- Tähtisumu: tähtien määrä `STARS_COUNT`, pilvet `nebCloudDefs`, puhalluksen kesto `blowT = 2.2`
- Omenavarat: terassit `orchardTerraces`, omenoita `ORCHARD_COUNT`, vierimisnopeus `viewW * 0.13`
- Uniaika: pupujen määrä `NAP_BUNNIES`, haukotusväli `2.5 + Math.random() * 2.5`
- Kotkalento: sulkien määrä `GLIDE_COUNT`, ukkospilvet `tFx` (initGlide)
- Kirjainpuutarha: sanojen määrä `GROVE_WORDS`, pensaita `GROVE_BUSHES`, hämääjät `GROVE_DISTRACTORS`
- Sirkusteltta / Trapetsi: heilahdus `CIRC_A`/`CIRC_W`, irrotuksen voima `CIRC_K`, lennon painovoima `CIRC_G`, tarttumis- ja vetosäde `CIRC_GRAB`/`CIRC_MAG`; vaikeampi rata `CIRC_HARD` + `CIRC_HARD_DEFS` (play-circus.js; tarttumisikkunan voi mitata simuloimalla `circBarPos`/`circBarVel`-funktioilla)
- Nuorallakävely: kallistusraja `WIRE_MAX`, pidon voima `WIRE_HOLD`, tuuli `WIRE_WIND`, kävelynopeus `WIRE_SPD`, rata `wirePlats` (play-wire.js)
- Kuumailmapallo: tuulikerrokset `BAL_BANDS`, leijat `balKiteDefs`, polttimen voima `viewH * 0.8`, vajoaminen `viewH * 0.3`
- Jäätelökoju: tilaukset `ICE_ORDERS` ja koot `initIcecream`, maut `ICE_FLAVORS`
- Ankkaonginta: kaistat `DUCK_LANES` (suunta, nopeus), koukun sukellus `0.35` s, pyyntisäde `viewH * 0.065`
- Taikurin teltta: kierrokset `MAG_ROUNDS` (kupit, vaihdot, vaihdon kesto)
- Maksa: rahat `PAY_COINS`, hinta `6 + randInt(8)`; Reitti: ruudukko `ROUTE_N`, askeleita `4–6`, askelaika `0.5` s; Palapeli: kuvat `JIGSAW_PICS`
- Horisontti: tähdet `VOY_STARS`, jäät `voyIceDefs`, veneen nopeus `viewW * 0.20`
- Revontulipolku: valoja `AUR_COUNT`, verhon leveys `viewW * 0.20`, tuulenpuuskat `aurWind`
- Porolaakso: poroja `REIN_N`, pulssiväli `5.2 + Math.random() * 1.4`
- Kelkkamäki: renkaat `SLED_RINGS`, vieritys `SLED_SPEEDS`, kivet `sledRocks`
- Lumisana: kierrokset `SW_ROUNDS`, tyypit `SW_KINDS`
- Revontulikettu: kiteet `FOX_STONES`
- Pesäkallio: asemat `NEST_STATIONS` (pesien paikat, toiveet, `peek`, `swing`, `overhang`, pilarit `rocks`), laukaisu `NEST_VMAX` / veto `NEST_PULL`, painovoima `NEST_G`, kurkistus `NEST_PEEK_UP` / `NEST_PEEK_DOWN`, suun säde `nestMouth` (`s * 1.1`), ennakkokaaren osumatarkkuus `nestPreview` (`m.r * m.r * 0.6`), harakan väli `3.5 + Math.random() * 2`; osumaikkunat voi mitata selaimessa käymällä vedot läpi `nestLaunchVel` + `nestPreview`
- Tulilento: soihdut `FLY_TORCHES`, portit `FLY_GATES` (kesto `hp: 2`), pilarit `FLY_PILLARS`, tuhkapilvet `FLY_CLOUDS` (poissa `gone = 7` s), marjat `FLY_BERRIES`, liekkejä `FLY_FLAMES`, palautuminen `FLY_RECHARGE`, liekin pituus `FLY_CONE` ja puolikulma `FLY_CONE_ANG`, lentonopeus `FLY_SPEED`, ohjauksen pehmeys `FLY_ACCEL` (kiihtyvyys sormen etäisyyden mukaan), vajoaminen `FLY_SINK`, osumasäde `R = s * 0.62` (updateDragonfly)
- Munapesä: hyllyt `EGG_SHELVES`, kuviot pareittain `EGG_PATTERNS` (sama `group` = sama väri), kierrokset `EGG_ROUNDS` ja kuvioiden arvonta `eggsPickPatterns`, pesät `EGG_NEST_FX`, hautomisaika `EGG_WARM_T`, hiipuminen `EGG_COOL`, puhuri `EGG_GUST_CALM` / `EGG_GUST_WARN` / `EGG_GUST_BLOW`
- Aarrevaaka: kierrokset `SCALE_ROUNDS` (Vaarin painon rajat `lo`/`hi`, lattian kivet `floor`, harakka `magpie`), arvonta `scaleGenerate`, kallistus `(sumR - sumL) * 0.075`, tasapainon odotus `stableT > 0.9`, harakan väli `SCALE_MAGPIE_WAIT` ja varoitus `SCALE_MAGPIE_WARN`
- Sienipomppu: osiot `BOUNCE_SECTIONS` (sienimäärä, pystyväli `dy`, sivusiirtymä `dx`, liikkuvien/lakastuvien osuus, takiaiset, reaktioaika `react`), pompun korkeus `BOUNCE_APEX` / jousi `BOUNCE_SPRING`, painovoima `BOUNCE_G`, ohjaus `BOUNCE_K` / `BOUNCE_D` / `BOUNCE_VMAX`; hyppyjen ulottuvuus `bounceReachable`
- Tulikärpässieppo: kierrokset `CATCH_ROUNDS` (paikat, tulikärpäset, nopeus, koit, välkkyminen, järjestys, koiden hakeutuminen `chase`), haavin vähimmäisnopeus `CATCH_NET_SPEED`, nappaussäteet `CATCH_HIT` / `CATCH_MOTH_HIT`
- Varjoperhonen: kierrokset `MOTH_ROUNDS` (koit, väli, nopeus, väistöt `jink`, lipuminen `drift`, pilkun heilunta `bob`, ikkuna, itiöt), pompun korkeus `MOTH_APEX`, pilkun osumasäde `MOTH_SPOT_R`, syöksyn korkeus `targetY` (updateMoth)
- Kuunsäde: kierrokset `BEAM_ROUNDS` (ruudukko, reitin peilit, kukat, hämäyspeilit, kivet, bonuskärpäset, kuun laskuaika `time`, koin väli `moth`), säteen kasvunopeus `BEAM_GROW`, kukkien hehkuaika `BEAM_HOLD`; arvonta `beamTryGenerate` tarkistaa, että ratkaisu toimii eikä alkuasento ratkaise
- Dyynilasku: osuudet `DUNE_SECTIONS` (dyynit `hills`/`half`/`amp`, liukuvauhti `speed`, esteitä `obs`, tyypit `kinds`, välit sekunteina `gap`), estetyypit `DUNE_OBS` (korkeus `hh`, puolileveys `hw`, skorpionin liike `move`), hyppy `DUNE_JUMP_G` / `DUNE_JUMP_H` / matala `DUNE_JUMP_CUT` + `DUNE_MIN_HOLD`, puskuri `DUNE_BUFFER`, osuma-alue `DUNE_PW`, ajoitusikkunan minimi `DUNE_MIN_WIN`, törmäyksen hidastus `DUNE_SLOW` / `DUNE_SLOW_K`, myrsky `DUNE_STORM_K` / `DUNE_STORM_LAG` / `DUNE_STORM_HIT`. Ikkuna ja tarvittava hyppy (low/high) lasketaan `duneObsWindow` / `duneObsFit`. Mitoitus botilla 29.9.2026 (hyppää optimikohdasta normaalijakautuneella ajoitusvirheellä): 0,05 s ei osumia ~85 s; 0,12 s ~1,5 osumaa; 0,2 s ~5 osumaa ja joskus osuus uusiksi; jatkuva hyppiminen tai hyppäämättä jättäminen ei pääse läpi
- Aarrevarpu: kierrokset `DOWSE_ROUNDS` (arkut, ylimääräiset kaivut, skorpionit, lämmön kantama `range`, tuulenpuuskat `gust`), löytösäde `DOWSE_HIT`, pistosäde `DOWSE_SCORP_R`, vaaran aistimissäde `DOWSE_SENSE`, paikallaan pito `DOWSE_STILL`, kaivuanimaatio `DOWSE_DIG_T`, jäljen kesto `DOWSE_TRAIL_LIFE`; lämpövyöhykkeet `dowseHeatColor`
- Hiekkapyörre: kierrokset `WHIRL_ROUNDS` (liukuvaiheen dyynit, vauhti ja esteet kuten `DUNE_SECTIONS`; etsinnän lämmön kantama, skorpionit, puhallusväli `charge`, puuskat `gust`); liukuvaihe käyttää Dyynilaskun funktioita (`duneRideFrame`, `duneBuildObstacles`) ja etsintä Aarrevarvun vakioita (`DOWSE_*`). Liukuvaiheet botilla: 0,05 s ei osumia, 0,12 s ~2 osumaa kolmessa vaiheessa
- Kamelikaravaani: kierrokset `CARAVAN_ROUNDS` (kamelit: ratkaisun säkkimäärä `n` tai valmiiksi raskas `pre`, kyltin rajat `lo`/`hi`, suurin säkki `vmax`, hämäyssäkit `extra`, myrskyn saapumisaika `time`), säkkejä selässä enintään `CARAVAN_MAX_LOAD`; arvonta `caravanGenerate`
- Pupupolku: kierrokset `BCODE_ROUNDS` (ruudukko, porkkanat, kolo, avain+portti, toistonapit `mult`, rivin pituus `slots`, lyhimmän reitin pituus `len`, pensaat), askeleen kesto `BCODE_STEP_T`, suurin toisto `BCODE_MAX_RUN`; ratkaisija `bcodeSolve` (leveyshaku), arvonta `bcodeGenerate`. Keskimäärin reitti 5,7 / 9,1 / 11,7 / 13,9 askelta ja 5,7 / 9,1 / 6,4 / 7,5 käskyä
- Loitsupolku: kierrokset `BLOOP_ROUNDS` (ruudukko, pupurivi `main`, ★-rivi `spell`, loitsuja pääohjelmassa `stars`, odotukset `waits`, myyrät reitillä `moles` ja vieressä `decoys`, porkkanat, reitin pituus `len`, pensaat, valmis loitsu `given`), askeleen kesto `BLOOP_STEP_T`, myyrien tahti `bloopMoleUpAt`; arvonta `bloopTryGenerate`, tarkistus `bloopSimulate`. Reitti 8 / 11 / 11 / 14 askelta, lyhin reitti keskimäärin 8,6 / 9,3 / 9,2 askelta
- Yhteispolku: kierrokset `DUO_ROUNDS` (ruudukko, aitojen määrä `walls`, laatat aidoittain `plates` ('n' lähtöpuoli, 'f' takana), sinisen kolon alue `homeB`, porkkanat, rivin pituus `slots`, ratkaisun askeleet `len`, pensaat), askeleen kesto `DUO_STEP_T`; säännöt `duoStep`, ratkaisija `duoSolve` (yhteinen leveyshaku), arvonta `duoTryGenerate`. Arvonta vie 8×5-kierroksilla n. 30–90 ms
- Rataspaja: kierrokset `GEAR_ROUNDS` (hila `cols`×`rows`, soittorasiat `targets`, ketjun pituus rasiaa kohti `len`, suuntavaatimus `dir`, ansa `trick` = suorin reitti väärään suuntaan, ylimääräiset rattaat `spare`, rikkinäiset tapit `broken`), moottorin nopeus `GEAR_SPEED`, voiton odotus `GEAR_WIN_T`; arvonta `gearTryGenerate`, verkon suunnat ja jumi `gearEvalNet`
- Värisäde: kierrokset `PRISM_ROUNDS` (ruudukko, reitin peilit ja lasit, kukat, hämäyspeilit `decoys` ja -lasit `dfilters`, kivet, perhoset, auringon laskuaika `time`, kimalaisen väli `bee`), värit `PRISM_COLORS` (bittimaski 1 punainen, 2 keltainen, 4 sininen), säteen kasvu `PRISM_GROW`, hehkuaika `PRISM_HOLD`; arvonta `prismTryGenerate` (n lasia reitillä = enintään n eri kukkaväriä)
- Myyräkuningas: kierrokset `MOLE_ROUNDS` (ruudukko, reitin peilit, väärin päin `wrong`, lasit, hämäyspeilit, kivet, pensaat, rivi `slots`, pupun reitin pituus `len`, toisto `mult`), askeleen kesto `MOLE_STEP_T`; arvonta `moleTryGenerate`. Keskimäärin pupun reitti 4,4 / 7,7 / 11,4 askelta ja 4,4 / 7,7 / 6,5 käskyä
- Tulivuoren jätti: kierrokset `GIANT_ROUNDS` (kivien määrä, heittoväli, lentoaika, ikkunan kesto), tulipallon kantama `GIANT_FIRE_RANGE`, puhalluksen väli `GIANT_FIRE_CD`, ikkunoiden paikat `GIANT_WINDOWS`, osuma-alue `w.r = s * 0.2` (giantWindowPos), sydänmenetyksen etäisyys `viewW * 0.14` (giantShatter)

## Tyyliopas

Pelin ilme on **tarrakirja**: pehmeät pyöreät muodot, joilla on tummempi
reunaviiva, kaksi sävyä ja kiilto, ja jotka seisovat maavarjon päällä.
Kaikki piirretään koodilla `js/art.js`:n apufunktioilla, jotta jokainen kenttä
näyttää samalta perheeltä. Metsä on mallikenttä; muut saaret siirretään samaan
ilmeeseen kenttä kerrallaan.

Säännöt:

- **Muoto**: `artBlob`/`artCircle`/`artRoundRect` tai oma polku + `artFillPath`.
  Liukuväri ylhäältä vaaleampi (`ART.shadeUp`), alhaalta tummempi (`ART.shadeDown`),
  reunaviiva perusväristä tummennettu (`ART.lineDark`), paksuus `ART.lineW` × säde.
- **Valkoiset hahmot** varjostetaan laventeliin (`shadeTo`), ei harmaaseen; reunaviiva
  annetaan `lineColor`-optiolla (yksisarvinen `UNI_LINE`, pupu `BUNNY_LINE`).
- **Raajat** ovat `artLimb`-viivoja (pyöreät päät, reunaviiva). Takimmaiset raajat
  varjosävyllä -> syvyys.
- **Kasvot**: `artEye` (valkuainen, pupilli, kiilto; `look` katseen suunta, `blink`),
  `artBlush` posket. Hahmo räpäyttää silmiä paikallaan.
- **Maavarjo** (`artShadow`) jokaisen hahmon ja ison esineen alla; ilmassa pienempi ja haaleampi.
- **Hehku** (`artGlow`) keräiltävissä, lyhdyissä ja taiassa — ei `shadowBlur`ia eikä
  `filter`-suodattimia (hidas vanhalla tabletilla).
- **Syvyys**: tausta kerroksiksi `renderBgLayers`-koukulla (`speed` 0.2 kaukainen,
  0.5–0.6 keski, 1 lähin). Kaukaiset kerrokset sävytetään taivaan väriin
  (`artMix(color, haze, t)`, ilmaperspektiivi) ja piirretään ilman reunaviivaa.
- **Valaistus**: kentän `light: { rays, tint, vignette }` piirretään maailman päälle,
  HUD:n alle. Aurinko/kuu ilmoittaa paikkansa `bgSun`-muuttujassa säteitä varten.
- **Liike**: pehmennykset (`easeOutCubic`, `easeOutBack`, `easeInOutSine`), litistys ja
  venytys (`artSquash`) lähtiessä, pysähtyessä ja osumasta, tärinä (`artShakeStart`)
  vain maailmalle, ei HUD:lle, pop-efektit (`artPop`) kerätessä ja löydettäessä.
  Kerätty esine lentää HUD-paikkaansa ja pomppauttaa sen.
- **Teksti** aina `UI_FONT`-pinolla (Fredoka), isoilla kirjaimilla; napit ovat
  SVG-ikoneita `index.html`:ssä, ei emojeja.
- **Paletti per saari**: pehmeät, kylläiset päävärit; taivaan yläreuna tummempi kuin
  horisontti; polku ja maa lämpimiä.

## Tekniikka

Canvas 2D, ei riippuvuuksia. Tausta esirenderöidään kerroksiksi (isot maailmat
pienennettynä vanhojen laitteiden canvas-rajan takia). Äänet WebAudiolla.

Testaus: `window.VT` on testauskahva — `VT.play('cave')`, `VT.tick(dt)`,
`VT.hold(true, x, y)`, `VT.jump()`, `VT.taskTap(x, y)`, `VT.hearts()`,
`VT.showHub()`, `VT.info()`. Paikallinen palvelin tarvitaan (tiedostot
ladataan erillisinä): `node tools/serve.js` ja avaa http://localhost:8765
(toinen portti: `node tools/serve.js . 3000` tai `PORT`-ympäristömuuttuja).
Piilotetussa selainpaneelissa `requestAnimationFrame` ei etene: aja kehyksiä
`for (i = 0; i < 120; i++) VT.tick(1/60)`.
