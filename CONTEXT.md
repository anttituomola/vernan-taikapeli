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

**Liekki**:
Tulilennon tulihengityksen varanto: kolme liekkiä, joista puhallus kuluttaa
yhden; liekit palautuvat ajan kanssa ja tulimarja täyttää ne. Tulinappi on
hyppynapin paikalla.
_Vältä_: ammus, mana, energia

**Purjehdus**:
Lyhyt siirtymäkohtaus saaristosta Kaukamaalle ja takaisin: vene avomerellä,
manner nousee usvasta. Napautus ohittaa.
_Vältä_: välianimaatio, cutscene

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
Vernan koti, jonka huoneita sisustetaan tähdillä: sali, tornihuone, keittiö ja
pankkiholvi. Linnalla on oma karttanäkymä, **linnakartta**, jonne pääsee
saaristokartan ja Kaukamaan kartan linnanapista.
_Vältä_: koti yksinään, huoneisto (Linnasaaren linna on eri asia: finaalin paikka)

**Holvi**:
Linnan pankkiholvi, johon tähtiä talletetaan ja josta niitä nostetaan.
Talletus kasvaa **korkoa** kerran vuorokaudessa.
_Vältä_: pankki yksinään, säästölipas

### Hahmot

**Prinsessa**:
Pelaajan ohjaama päähenkilö.

**Yksisarvinen**:
Prinsessan ratsu ja opas; kantaa juoksukentissä ja ehdottaa uusintaa
puhekuplassa.

**Myrskynoita**:
Pelin antagonisti, jonka myrsky huuhtoi sateenkaaren värit mereen. Ei
koskaan suoraa taistelua — jokaisen saaren vartija on hänen jättämänsä
este.
