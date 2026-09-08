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
- `css/game.css` — napit ja karttanäyttö
- `js/worlds.js` — **saarirekisteri (`WORLDS`)**: pelin ainoa totuus maailmoista ja kentistä.
  Vaiheen sauma: `init/update/draw/tap/resize/renderBg/respawn`. Rekisteristä johdetaan
  `PHASES` (kenttäkoukut), `HUB_WORLDS` (sokkelot), `ISLANDS` (saaristokartta) ja `scriptManifest()`.
- `js/state.js` — jaettu tila, sokkelon ajonaikainen tila
- `js/audio.js` — WebAudio
- `js/progress.js` — edistymisen tallennus (localStorage), sydämet, tarkistuspisteet
- `js/world.js` — koko, taustojen esirenderöinti
- `js/draw-actors.js` — tähti, pupu, yksisarvinen
- `js/fx.js` — kipinät, konfetti, opastenuoli
- `js/ambient.js` — tunnelmahiukkaset, etualan siluetit ja kentän alkukortti (PHASES: `ambient`, `fg`)
- `js/flow-sea.js` — saaristokartta (ylin navigaatio), saaret ja sateenkaari
- `js/flow-hub.js` — saaren karttalabyrintti, vaiheen käynnistys ja kentän elinkaaren
  yhteinen alku (`levelBegin`: tilan nollaus ja nappien ilme rekisterin lipuista; skipTo
  ja uusinta kutsuvat sitä ennen kentän omaa init-koukkua)
- `js/flow-home.js` — linnan sisustus (tähtikauppa, raahaus, puput)
- `js/play-forest.js` — metsä + tehtäväkaarten perusrunko
- `js/tasks-extra.js` — uudet tehtävätyypit (vähennys, kuvio, vertailu, rytmi)
- `js/play-garden.js` … `play-sky.js` — vaiheet 2–5
- `js/platformer.js` — jaettu tasohyppelyfysiikka (liikkuvat tasot, kantaminen)
- `js/play-cave.js`, `play-swamp.js`, `play-bridge.js` — vaiheet 6–8
- `js/play-finale.js` — linnan finaali
- `js/tasks-drag.js` — raahaustehtävät (muoto varjoon, täydennä kuva) ja muistipeli
- `js/play-beach.js`, `play-candy.js`, `play-tower.js` — maailma 2 (vaiheet 10–12)
- `js/play-reef.js`, `play-nightwood.js`, `play-clouds.js`, `play-moon.js` — maailma 3 (vaiheet 13–16)
- `js/tasks-mix.js` — värien sekoitus: 'mix'-tehtävä ja Taikakeittiön pata
- `js/play-herd.js`, `play-kitchen.js` — maailma 5 (vaiheet 21–22)
- `js/tasks-more.js` — lajittele, järjestä koon mukaan, peilikuva ja yhdistä pisteet
- `js/play-mine.js`, `play-rapids.js`, `play-lighthouse.js`, `play-summit.js` — maailma 6 (vaiheet 23–26)
- `js/tasks-read.js` — lukemisen tehtävät: kuva→sana, kokoa sana tavuista, alkukirjain
- `js/play-letterfield.js`, `play-wordshop.js` — maailma 7 (vaiheet 27 ja 29); Tavukoski ja Kirjainpilvet käyttävät `play-rapids.js`-moottoria (tilat `syl` ja `letters`)
- `js/pen-core.js` — Taikakynän ydin: viivat, muste, kynätila, pintoja seuraava kävely, muodontunnistus
- `js/play-pen.js`, `play-rain.js`, `play-bunnybridge.js`, `play-scribble.js` — maailma 4 (vaiheet 17–20)
- `js/update-draw.js` + `js/main.js` — silmukka ja syöte

**Uusi vaihe** = tiedosto `js/play-….js` ja yksi `levels`-alkio js/worlds.js:n
`WORLDS`-rekisteriin (`kind`, `script`, huoneen kirjain `room`, ohjaus ja koukut;
kirjain myös saaren `map`-karttaan). Kentän numero, `next`-ketju,
`HUB_ROOMS`/`HUB_ORDER` ja skriptien latauslista johdetaan rekisteristä.
**Uusi saari** = yksi `WORLDS`-alkio: nimi, `island`-tiedot (sijainti,
vartijahuone `finaleKind`, koristeet), `map` ja `levels`.
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
Karkkisaari: Arvoitusten torni). Saaria on seitsemän, yksi sateenkaaren
väriä kohti (`SEA_FOG`-taulukkoon voi lisätä sumuisen saaren vihjeeksi).

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
- **Sotkumörkö** ♥ — vartija. Kolme porttia näyttää muodon (ympyrä, kolmio,
  neliö): piirrä sama muoto kynä kädessä, ja portti aukeaa; väärä muoto
  tärisyttää porttia. Mörkö heittää tahroja, jotka leijuvat hetken ja putoavat:
  ympyrä leijuvan tahran ympärille vangitsee sen. Lopuksi salama (siksak)
  rauhoittaa mörön ja avaa oven. Tehtävät: kuvio.

### Hoivasaari (maailma 5)

Aukeaa, kun Sotkumörkö on rauhoitettu. Molemmat kentät ovat kiireettömiä: ei
sydämiä. Taikakeittiö on saaren vartija.

- **Pupupaimen** — ratsastus niityllä. Kolme pupua alussa liittyy laumaan, kun
  yksisarvinen tulee lähelle, ja seuraa perässä. Pöllön huuto ja syöksy
  pelästyttävät lähellä olevat puput pensaisiin piiloon (korvat ja huutomerkki
  näkyvät); napautus kutsuu pupun takaisin. Kaikki kolme pupukoloon. Nuoli
  näyttää piilossa olevan pupun tai kolon. Tehtävät: lue sana (2 tavua), laske.
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
- **Kirjainpilvet** ♥ — vartija. Sama hyppely taivaalla: pilvissä on
  **kirjaimia**, ja sana kirjoitetaan kirjain kerrallaan ylös asti (3-kirjaiminen
  sana pilvisaarelle, 4-kirjaiminen Sanapöllön luo). Väärä kirjain pudottaa.
  Sanapöllö herää, kun molemmat sanat on kirjoitettu. Tehtävät: alkukirjain,
  kuva→sana.

♥ = **sydämet käytössä**: 3 sydäntä, osuma vie yhden. Kun sydämet loppuvat,
palataan viimeiselle sytytetylle lyhdylle ja lyhdyn jälkeen kerätyt esineet
palautuvat. Kenttä itse ei ala alusta.

### Linnan sisustus

Jokainen läpäisty kenttä (myös uusinta) antaa **2 tähteä**, ja +1 jos sydämet
säilyivät täysinä; juhlassa näkyy "+n". Tähtisaldo näkyy kartoilla vasemmalla
ylhäällä. Linnasaaren linnan napautus avaa kuplan, jossa on ovi (sisustus) ja
finaali. Huoneistossa on kaksi huonetta: **sali** (sydäntapetti, ikkuna) ja
**tornihuone** (tähtitaivas, pyöreä kuuikkuna, kivilattia). Huoneiden välillä
kuljetaan ovesta (salissa oikealla, tornissa vasemmalla); puput tulevat perässä.
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

- Metsä, jää, suo ja rannikko: pidä sormea pohjassa ratsastaaksesi, napauta kerätäksesi.
- Puutarha, lampi, luola, finaali, karkkilaakso ja torni: pidä pohjassa
  juostaksesi, **↑** hyppää, lyhyt napautus ampuu sauvalla (missä sauva on).
- Hyppy myös **toisella sormella**: kun yksi sormi juoksee, napautus millä
  tahansa toisella sormella mihin tahansa hyppää. Vasen alakulma napin
  ympärillä (27 vmin) hyppää sekin, vaikka napista osuisi ohi.
- Raahaustehtävät: paina palaa, vedä ja päästä irti kohteen päällä.
- Taikakynä: pidä pohjassa kävelläksesi; kynänappi ottaa kynän käteen, jolloin
  sormella piirretään.
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

- **Kuva→sana** — kuva kuplassa ja kolme sanakorttia tavutettuna; kuvan
  napautus lukee sanan (tavut soivat). Väärä kortti himmenee, oikea luetaan.
- **Kokoa sana** (raahaus) — kuva kuplassa, tyhjät tavupaikat väliviivoilla
  ja tavukortit alhaalla (sanan tavut + 2 hämäystä). Raahaa tavut paikoilleen;
  seuraava paikka hehkuu. Valmis sana luetaan.
- **Alkukirjain** — iso kirjain kuplassa ja neljä kuvaa; valitse kuva, jonka
  sana alkaa kirjaimella. Väärä kuva himmenee; kirjaimen napautus soittaa sen.

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
- Sekoita väri: värit `MIX_COLORS` (tasks-mix.js), vaikeus `{ mixLevel }`; Taikakeittiön tilausmäärä `K_ORDERS`
- Pupupaimen: pöllön varoitus `1.2` s, pelästymissäde `viewW * 0.35`, pupun nopeus `viewW * 0.26`
- Lue sana: sanat `WORD_LIST` (tasks-extra.js), tavujen enimmäismäärä `makeTask(fx, 'word', { maxSyl })`, tavun kesto `WORD_SYL_T`
- Rannikko: aallon väli `6 + Math.random() * 3`, rapujen nopeus `viewW * 0.06`
- Karkkilaakso: pompun voima `viewH * 1.15` (platformer.js), kuulakarkkien nopeus `viewW * 0.07`
- Torni: kattokruunujen heilunta `speed: 1.1`, kulma `0.55`
- Merenpohja: meduusojen nopeus/amplitudi `jellyDefs`, virtauksen voima `viewW * 0.35`, uinnin kiihtyvyys `viewW * 0.42` / `viewH * 0.55`
- Kuutamometsä: kiiltomadon valoaika `GLOW_ON = 1.5` jaksosta `GLOW_CYCLE = 2.9`, pöllön varoitus `1.2` s, syöksyn nopeus `dt * 1.3`
- Pilvipolku: haihtumisaika `PUFF_STAND = 0.7`, paluu `PUFF_BACK = 2.5`, myrskypallot `viewW * 0.07`
- Kuun vartija: tähtien väli `1.8 + Math.random() * 0.9`, varoitus `0.9` s, putoamiskiihtyvyys `viewH * 1.3`
- Sisustus: tähdet per kenttä `awardStars()` (progress.js, saldo `starCoins`), hinnat `HOME_ITEMS` (flow-home.js), kaupan sivukoko `HOME_SHOP_PAGE`, huoneet `HOME_ROOMS`, maalit `HOME_PAINTS`, rusetit `HOME_BOWS`
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

## Tekniikka

Canvas 2D, ei riippuvuuksia. Tausta esirenderöidään (isot maailmat
pienennettynä vanhojen laitteiden canvas-rajan takia). Äänet WebAudiolla.

Testaus: `window.VT` on testauskahva — `VT.play('cave')`, `VT.tick(dt)`,
`VT.hold(true, x, y)`, `VT.jump()`, `VT.taskTap(x, y)`, `VT.hearts()`,
`VT.showHub()`, `VT.info()`. Paikallinen palvelin tarvitaan (tiedostot
ladataan erillisinä): `node tools/serve.js` ja avaa http://localhost:8765.
