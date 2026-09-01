# Vernan taikapolku

Selainpeli 6-vuotiaalle: prinsessa ratsastaa yksisarvisella taikametsän läpi,
nappaa karkailevia tähtiä, väijyy pensaissa piileskeleviä pupuja ja avaa
kaksi taikaporttia väriloitsuilla — samalla vältellen myrskypilviä ja
pupuja varastelevaa peikkoa. Lopuksi ratsastetaan linnaan juhlimaan.
Aloitusruudusta voi hypätä suoraan: **Metsä**, **Peikko**, **Linna**
tai **Puutarha**. Koko peli on yksi tiedosto: `index.html`.

## Siirto tabletille

Kaksi vaihtoehtoa, valitse helpompi:

1. **USB-kaapelilla**: kopioi `index.html` tabletin Lataukset-kansioon,
   avaa tabletin Tiedostot-sovellus ja avaa tiedosto Chromella.
2. **Netin kautta**: raahaa `index.html` osoitteessa <https://app.netlify.com/drop>
   (ilmainen, ei tiliä pakko), avaa saatu osoite tabletin selaimella ja
   lisää se aloitusnäytölle.

Peli ei tarvitse nettiyhteyttä pelaamiseen eikä asennuksia.

## Pelin kulku (taso 1)

Maailma on viiden ruudun levyinen ja rauhallisesti rytmitetty: keräiltävät
ovat ryppäissä, joiden välissä on tyhjiä maisemaosuuksia.

- Pidä sormea pohjassa → yksisarvinen ratsastaa sormen mukaan.
  Napauta maata → kävelee siihen kohtaan.
- **Tähdet (10 kpl)** leijuvat ja pakenevat lähestyjää — nappaa sormella.
  Ohi mennyt napautus säikäyttää tähden uuteen paikkaan.
- **Puput (3 kpl)** kurkkivat pensaista hetken kerrallaan.
  Kaksi hutia → pupu vaihtaa lähimpään toiseen pensaaseen.
- **Myrskypilvet (2 kpl)** partioivat omilla alueillaan ja tiputtavat
  salamapisaroita. Osuma sirottaa 3 kerättyä tähteä lähimaastoon.
- **Peikko** partioi porttien välissä. Ohi saa ratsastaa vauhdissa;
  jos jää paikalleen peikon viereen, se vie yhden pupun pensaaseen.
- **Kaksi taikaporttia**: 4 värin loitsu (3 palloa) ja 5 värin loitsu
  (4 palloa). Katso järjestys, toista napauttamalla. Väärästä ei rangaista.
- **Maali**: kun kaikki on kerätty, linnan ylle syttyy majakkatähti —
  ratsasta linnalle, niin juhla alkaa. **Jatka** avaa tason 2.
- **Opastenuoli** ruudun laidassa näyttää aina suunnan lähimpään
  keräämättömään asiaan (tai linnaan), joten mikään ei jää löytymättä.

## Taso 2 (linnan jälkeen)

Juhlan jälkeen **Jatka** vie hämärään puutarhaan. Prinsessa on jaloin,
hyppii sienitasanteilla ja naputtaa taikasauvaa.

- Pidä sormea pohjassa → juoksee sormen suuntaan. Irti → pysähtyy.
- Vihreä **↑** vasemmalla alhaalla → hyppy (ei tipu pois pelistä).
- Lyhyt napautus → sauva ampuu kipinän. Osuma nappaa perhosen.
- Unelias pöllö tukkii yhden tasanneen — herätä kipinällä.
- 8 perhosta → juhla.

## Vaikeuden säätö (index.html:n luvut)

- Pupun kurkkausaika: `bn.phaseT > 1.2` (sekunteina)
- Loitsujen pituus/pallot: `makeGate(0.40, 4, 3)` ja `makeGate(0.72, 5, 4)`
- Peikon jahtausnopeus: `viewW * 0.045`
- Peikko varastaa paikallaan: `troll.stillT > 0.55`
- Hypyn teho: `princess.vy = -viewH * 1.02`
- Perhosten määrä: `BUTTERFLY_COUNT = 8`
- Pilvien pudotustahti: `cl.dropT = 3.5 + Math.random() * 2.0`
- Tähtien pakonopeus: `viewW * 0.06`

## Jatkokehitysideoita (taso 3+)

- Talvimaisema, pidemmät loitsut
- Edistymisen tallennus (localStorage)

## Tekniikka

Yksi HTML-tiedosto, Canvas 2D, ei riippuvuuksia. Tausta esirenderöidään
kerran offscreen-canvasille, joten peli pyörii kevyesti vanhallakin
Android-tabletilla. Äänet tehdään WebAudiolla (ei äänitiedostoja).
Selaimen `window.VT` on testauskahva (tila + `tick`/`tap`).
