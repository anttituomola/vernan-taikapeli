# Vernan taikapolku

Selainpeli 6-vuotiaalle: prinsessa ja yksisarvinen pelastavat sateenkaaren
värit saari kerrallaan Myrskynoidan myrskyn jälkeen. Tämä on pelin
domainkielen sanasto — tekninen rakenne dokumentoidaan README:ssä.

## Language

### Maailma

**Saari**:
Yksi pelin maailma: kokonaisuus, jolla on nimi, sokkelo ja vartija. Saaria
on seitsemän, yksi jokaista sateenkaaren väriä kohti.
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
