# Vernan taikapolku

Selainpeli 6-vuotiaalle: prinsessa ratsastaa yksisarvisella taikametsän läpi,
nappaa karkailevia tähtiä, väijyy pensaissa piileskeleviä pupuja ja avaa
kaksi taikaporttia väriloitsuilla — samalla vältellen myrskypilviä ja
pupuja varastelevaa peikkoa. Koko peli on yksi tiedosto: `index.html`.

## Siirto tabletille

Kaksi vaihtoehtoa, valitse helpompi:

1. **USB-kaapelilla**: kopioi `index.html` tabletin Lataukset-kansioon,
   avaa tabletin Tiedostot-sovellus ja avaa tiedosto Chromella.
2. **Netin kautta**: raahaa `index.html` osoitteessa <https://app.netlify.com/drop>
   (ilmainen, ei tiliä pakko), avaa saatu osoite tabletin selaimella ja
   lisää se aloitusnäytölle.

Peli ei tarvitse nettiyhteyttä pelaamiseen eikä asennuksia.

## Pelin kulku (taso 1)

- Napauta maata → yksisarvinen kävelee sinne.
- **Tähdet (10 kpl)** leijuvat ja pakenevat lähestyjää — nappaa sormella.
  Ohi mennyt napautus säikäyttää tähden kokonaan uuteen paikkaan.
- **Puput (3 kpl)** kurkkivat pensaista alle sekunnin kerrallaan.
  Kaksi hutia → pupu vaihtaa pensasta.
- **Myrskypilvet (2 kpl)** jahtaavat ja tiputtavat salamapisaroita.
  Osuma sirottaa 3 kerättyä tähteä takaisin maastoon — väistä liikkumalla!
- **Peikko** partioi loppumatkalla. Kiinni jäädessä se varastaa pupun
  takaisin pensaaseen. Yksisarvinen on peikkoa nopeampi.
- **Kaksi taikaporttia**: 4 värin loitsu (3 palloa) ja 5 värin loitsu
  (4 palloa). Katso järjestys, toista napauttamalla. Väärästä ei rangaista.
- Kun kaikki on kerätty: sateenkaari, konfetit ja juhlat. ↻ aloittaa alusta.

## Vaikeuden säätö (index.html:n luvut)

- Pupun kurkkausaika: `bn.phaseT > 0.95` (sekunteina)
- Loitsujen pituus/pallot: `makeGate(0.45, 4, 3)` ja `makeGate(0.80, 5, 4)`
- Peikon jahtausnopeus: `viewW * 0.115`
- Pilvien pudotustahti: `cl.dropT = 2.2 + Math.random() * 1.3`
- Tähtien pakonopeus: `viewW * 0.085`

## Jatkokehitysideoita (taso 2+)

- Uusi maisema (yö/talvi), pidemmät loitsut, liikkuvia perhosia
- Edistymisen tallennus (localStorage)
- Taikasauva-mekaniikka: piirrä kuvio ruudulle

## Tekniikka

Yksi HTML-tiedosto, Canvas 2D, ei riippuvuuksia. Tausta esirenderöidään
kerran offscreen-canvasille, joten peli pyörii kevyesti vanhallakin
Android-tabletilla. Äänet tehdään WebAudiolla (ei äänitiedostoja).
Selaimen `window.VT` on testauskahva (tila + `tick`/`tap`).
