# Vernan taikapolku

Selainpeli 6-vuotiaalle: prinsessa ja yksisarvinen pelastavat sateenkaaren
värit saari kerrallaan Myrskynoidan myrskyn jälkeen. Tämä on pelin
domainkielen sanasto — tekninen rakenne dokumentoidaan README:ssä.

## Language

### Maailma

**Saari**:
Yksi pelin maailma: kokonaisuus, jolla on nimi, sokkelo ja vartija. Värisaaria
on seitsemän, yksi jokaista sateenkaaren väriä kohti; kahdeksas, Tivolisaari,
on sateenkaaren päässä ja sen vartija palauttaa **kultatähden** kaaren huipulle.
_Vältä_: maailma, world, taso

**Kenttä**:
Yksi pelattava vaihe saarella; kentällä on oma ohjaustapansa (ratsastus,
juoksu, lento, piirtäminen tai napautus).
_Vältä_: vaihe, level, phase

**Vartija**:
Saaren viimeinen kenttä. Sen läpäisy palauttaa yhden sateenkaaren värin
saaristokartalle ja avaa seuraavan saaren.
_Vältä_: bossi, loppuvastus, finaali (finaali on Linnasaaren vartijan nimi)

**Sokkelo**:
Saaren karttalabyrintti, jossa nappulaa liikutetaan huoneesta huoneeseen.
_Vältä_: hub, labyrintti yksinään, kartta (sekava saaristokartan kanssa)

**Huone**:
Sokkelon ruutu, joka vastaa yhtä kenttää. Läpäisty huone jää
kulkukelpoiseksi ja sen voi pelata uudestaan.
_Vältä_: ovi, portti (portti on kentän sisäinen este)

**Saaristokartta**:
Pelin ylin navigaatio: vene kulkee saarten välillä, ja sateenkaari täyttyy
värillä aina kun saaren vartija on läpäisty.
_Vältä_: merikartta, pääkartta

**Kaukamaa**:
Saariston takainen manner, jonne pääsee saaristokartan avomerimerkistä kun
kultatähti loistaa. Sen kartta on saaristokartan rinnakkainen ylätason
näkymä; alueet ovat siellä paikkoja.
_Vältä_: manner yksinään, uusi maailma, toinen kartta

**Paikka**:
Kaukamaan maailma (esim. Lohikäärmelaakso): saaren vastine mantereella, jolla
on nimi, sokkelo ja vartija. Yksisarvinen kävelee paikkojen välillä polkua.
_Vältä_: alue, laakso yleisnimenä, saari (mantereella)

**Pomppu**:
Hohtometsän verbi: prinsessa pomppii itsestään sienten hatuilla, ja sormi ohjaa
sivuttain. Lyhtysieni on pompun tarkistuspiste.
_Vältä_: hyppy (hyppy on hyppynapin ele)

**Sipaisu**:
Hohtometsän verbi: liikkuva sormi vetää hohtavaa haavia, joka nappaa
tulikärpäsiä ja hajottaa varjokoita. Paikallaan oleva sormi ei nappaa.
_Vältä_: pyyhkäisy, veto, raahaus (raahaus siirtää esinettä)

**Liuku**:
Aurinkodyynien verbi: hiekkalauta liukuu itsestään, ja napautus hyppää
esteen yli (lyhyt napautus matala hyppy, pohjassa pitäminen korkea ja pitkä).
_Vältä_: lasku (lasku on laskutehtävä), liito (liito on Kotkalennon lento)

**Etsintä**:
Aarrevarvun verbi: sormen perässä kulkeva taikavarpu jättää lämpöjäljen, joka
kertoo, kuinka lähellä haudattu arkku on; paikallaan pidetty sormi kaivaa.
_Vältä_: haku, kaivaminen yksinään (kaivaa Fenni-kettu)

**Ohjelmointi**:
Porkkanakummun verbi: nuolista kootaan ohjelmarivi, ja ▶ ajaa sen; pupu
hyppii käsky kerrallaan. Toistonappi (×2, ×3) kertaa viimeisen nuolen.
_Vältä_: koodaus, reitti (reitti on tehtävä, josta kenttä syntyi)

**Kääntö**:
Kuunsäteen verbi: napautus kääntää kristallipeiliä neljänneskierroksen, ja
kuunsäde kimpoaa peilistä uuteen suuntaan.
_Vältä_: pyöritys, rotaatio (pyöritys on jatkuva liike)

**Liekki**:
Tulilennon tulihengityksen varanto: kolme liekkiä, joista puhallus kuluttaa
yhden; liekit palautuvat ajan kanssa ja tulimarja täyttää ne. Tulinappi on
hyppynapin paikalla.
_Vältä_: ammus, mana, energia

**Rattaat**:
Kellopajan verbi: ratas raahataan tappiin, ja se pyörii heti, jos se
koskettaa pyörivää ratasta (vastakkaiseen suuntaan). Kolme toisiaan
koskettavaa ratasta **jumittuu**. **Soittorasia** on ketjun kohde.
_Vältä_: hammaspyörä (liian tekninen), vaihde

**Rautatievaihde**:
Junamatkan valinta: rata haarautuu kahdeksi raiteeksi, ja vaihdevivun
napautus kääntää vaihteen haaralle, jonka kyltissä on matkustajan aseman kuva.
Lyhyesti **vaihde** vain Junamatkan yhteydessä.
_Vältä_: risteys, haara yksinään

**Yhteispeli**:
Lapsi ja aikuinen pelaavat samalla tabletilla kumpikin omaa pupuaan (vasen
puoli pinkki, oikea sininen). Yhteispolulla ohjelmat ajetaan yhtä aikaa;
Pupuparin pihalla molemmat ohjaavat reaaliajassa omalla puolellaan.
**Laatta** pitää samanvärisen **portin** auki niin kauan kuin pupu seisoo
sen päällä. Pupuparin pihalla lisäksi **luukku** (avaimen ojennus aidan yli)
ja **STOP-laatta**, joka pysäyttää toisen puolen traktorin.
_Vältä_: kaksinpeli (ei kilpailla), moninpeli

**Purjehdus**:
Lyhyt siirtymäkohtaus saaristosta Kaukamaalle ja takaisin: vene avomerellä,
manner nousee usvasta. Napautus ohittaa.
_Vältä_: välianimaatio, cutscene

**Tökkäys**:
Napautus koristeeseen tai otukseen, joka ei kuulu peliin: se heilahtaa, kipinöi
ja soi (`props.js`), mutta mikään ei muutu pelissä. Toistuva tökkäys (3. tai 5.)
voi paljastaa pienen **yllätyksen**.
_Vältä_: klikkaus, osuma (osuma on vihollisen kosketus)

**Sateenvarjo**:
Myrskyvuoren verbi: sormi raahaa isoa sateenkaarivarjoa (sormi pitää varren
päästä), ja varjo suojaa prinsessaa sateelta ja rakeilta. Varjolla otetaan
kiinni myös **aurinkokipinät**. Kastuminen ei vie sydäntä: prinsessa
**hytisee** hetken.
_Vältä_: suoja, kilpi, sateenvarjoviiva (se on Sadesuojan kynäviiva)

**Säde**:
Auringonsäde: jokainen Kaukamaan paikka antaa auringolle yhden säteen.
Myrskynoidan kentässä säde on raahattava hehkuva pallo sateenkaaren värissä;
sateeseen viety säde kasvattaa oman **raitansa** sateenkaareen.
_Vältä_: pallo yksinään, valo, väri (väri on saarten palautettava sateenkaaren väri)

### Pelin käsitteet

**Tehtävä**:
Kentän tehtäväkaaren pysäyttämä minipeli (lasku, muisti, raahaus, lukeminen),
jonka ratkaisu avaa tien eteenpäin. Väärä vastaus ei rankaise, paitsi
kuvatehtävissä se arpoo uuden tehtävän.
_Vältä_: minipeli, pulma, task

**Sydän**:
Kentän elämät (3). Osuma viholliseen tai vaaraan vie yhden; loppuun
mennessä palataan viimeiselle sytytetylle lyhdylle. Kaikissa kentissä ei
ole sydämiä.
_Vältä_: elämä, hp

**Tähti**:
Läpäistyistä kentistä ansaitsema valuutta, jolla ostetaan huonekaluja
linnan sisustukseen.
_Vältä_: kolikko, piste

**Linna**:
Vernan koti, jonka huoneita sisustetaan tähdillä: sali, tornihuone, keittiö,
pankkiholvi, puutarha, kanatarha ja ponitalli. Linnalla on oma karttanäkymä, **linnakartta**, jonne pääsee
saaristokartan ja Kaukamaan kartan linnanapista.
_Vältä_: koti yksinään, huoneisto (Linnasaaren linna on eri asia: finaalin paikka)

**Holvi**:
Linnan pankkiholvi, johon tähtiä talletetaan ja josta niitä nostetaan.
Talletus kasvaa **korkoa** kerran vuorokaudessa.
_Vältä_: pankki yksinään, säästölipas

**Puutarha**:
Linnan ulkohuone keittiön vieressä, jonne istutetaan kasveja ja jossa ne
kasvavat **kastelulla** (kastelukannu raahataan kasvin kohdalle). Kypsästä
kasvista saadaan **satoa**, jonka pupu syö.
_Vältä_: piha yksinään, kasvimaa, Puutarha-kenttä (ensimmäisen saaren kenttä on eri asia)

**Kanatarha**:
Linnan ulkohuone puutarhan vieressä, jossa hoidetaan kanoja: **ruokinta**
(jyväsäkki kaukalolle) ja **vesi** (vesikannu kuppiin). Hoidetut kanat
**munivat** pesään kerran päivässä; muna kerätään **koriin**, ja korista muna
viedään **hautomoon**, josta seuraavana päivänä kuoriutuu **tipu**. Tipu kasvaa
kanaksi kolmessa päivässä. Kanat ovat eläimiä, eivät tavaroita.
_Vältä_: kanala (= kanatalo tarhan sisällä), maatila, munat valuuttana

**Ponitalli**:
Linnan ulkohuone kanatarhan vieressä, jossa hoidetaan poneja: **heinä**
(heinäkori seimeen), **vesi** (vesisanko kaukaloon) ja **harjaus** (harjalla
hangataan aamun mutaläiskät pois). Hoidettu poni laukkaa kierroksen ja saa
**ruusukkeen**, joka lentää **ruusuketaululle**. Taululta ruusuke viedään
**karsinan** olkipesään, jossa seuraavana päivänä nukkuu **varsa**. Varsa
kasvaa poniksi kolmessa päivässä; kultaisesta ruusukkeesta syntyy
yksisarvisvarsa. Ponit ovat eläimiä, eivät tavaroita.
_Vältä_: hevostalli, karsina (= olkipesä tallin sisällä), ruusukkeet valuuttana

### Hahmot

**Prinsessa**:
Pelaajan ohjaama päähenkilö.

**Yksisarvinen**:
Prinsessan ratsu ja opas; kantaa juoksukentissä ja ehdottaa uusintaa
puhekuplassa.

**Myrskynoita**:
Pelin vastavoima: hän valtasi linnan, sulki puput saliin ja puhalsi
sateenkaaren värit saarille. Finaalissa hän **pakenee** luudalla (ei häviä),
ja hänen **myrskypilvensä** näkyy kartalla aina sen paikan yllä, jonne hän
pakeni seuraavaksi. Kaukamaan lopussa selviää, että hän oli äreä, koska
osaa tehdä vain sadetta — kukaan ei ollut kutsunut häntä sateenkaarijuhliin.
Sateesta ja auringosta syntyy sateenkaari, ja noidasta tulee **ystävä**.
_Vältä_: paha noita, konna, vihollinen (lapselle hän on äreä, ei paha)

## Tarina

Tarina kerrotaan **kuvakirjan sivuina** (`js/story.js`): lyhyt iso
**tavutettu** teksti (kuten lukutehtävissä) ja animoitu kuva, napautus kääntää
sivua. Luvut kertovat, **mitä on edessä**, eivät mitä jo tapahtui (palaute
15.10.2026: jälkikäteen kerrotut luvut hämmensivät). Tallennus muistaa
näytetyt luvut; ne voi lukea uudestaan linnan **tarinakirjasta**.

**Luku**:
Yksi kuvakirjan kohtaus (1–5 sivua), joka näytetään kerran.
_Vältä_: välianimaatio, cutscene, tarina yksinään

**Maan alku**:
Luku, joka näytetään, kun maahan (saari tai paikka) saavutaan ensimmäistä
kertaa eikä sitä ole läpäisty: missä ollaan ja mitä täältä etsitään (värin
pisara, kultatähti, revontulikettu tai auringon säde). Taustana maailman
oma sokkelomaisema.

Kaari:

1. **Alku** (uusi peli): linna sateenkaaren alla, Myrskynoita valtaa linnan
   ja puhaltaa värit saarille. Lähdetään pelastamaan puput.
2. **Koti** (heti Linnasaaren finaalin jälkeen): puput vapaina, noita
   pakenee, linna on taas koti (linnanappi ilmestyy).
3. **Saaret**: kunkin saaren alussa kerrotaan, mikä väri sieltä löytyy;
   myrskypilvi leijuu kartalla aina seuraavan saaren yllä. Värin paluu
   näkyy sateenkaaren paljastuksena kartalla.
4. **Tivolisaari** (alku): sateenkaaren päästä löytyy kultatähti.
5. **Revontulimaa** (alku): pilvi pakeni pohjoiseen, Revontulikettu tietää
   tien. Ketun läpäisy avaa avomerimerkin Kaukamaalle.
6. **Kaukamaa**: aurinko on myrskypilven takana; jokaisen paikan alussa
   kerrotaan, että täältä löytyy auringolle **säde**. Kun säteet ovat koossa,
   Myrskyvuori aukeaa (luku 'vuori').
7. **Myrskyvuori** (alku): noita osaa tehdä vain sadetta, eikä häntä
   kutsuttu sateenkaarijuhliin; sade ja aurinko yhdessä tekevät
   sateenkaaren, autetaan häntä. **Ystävä** (finaalin jälkeen): noita
   muuttaa linnan torniin, ja juhlitaan kaikkien kanssa.

**Linna kasvaa**: maailmojen vartijat avaavat linnaan huoneita. Sali aukeaa
Linnasaaresta, keittiö Karkkisaaresta, torni Kuutamosaaresta, puutarha
Hoivasaaresta, pankkiholvi Vuorisaaresta, ponitalli Tivolisaaresta ja
kanatarha Maalaiskylästä. Vanha tallennus (ennen tarinaa) pitää kaikki
huoneet auki.
