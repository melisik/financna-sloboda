# Rozhodnutia

| ID | Dátum | Rozhodnutie | Dôvod |
|----|-------|-------------|-------|
| D-001 | 2026-10-13 | Projekt je samostatný a nenadväzuje na existujúce projekty. | Voľný štart; prevzatie z iných projektov len vedome. |
| D-002 | 2026-10-13 | Názov „Finančná sloboda“ je pracovný. | Predpoklad zmeny názvu. |
| D-003 | 2026-10-13 | Finančná sloboda = nezávislosť od zamestnania; produkt spája sporenie, investovanie a cielenú spotrebu v jednom balíku. | Zadanie zakladateľa. |
| D-004 | 2026-10-13 | Cieľ sa dynamicky prepočítava po každom čiastkovom rozhodnutí a každé rozhodnutie sa zaznamenáva. | Zadanie zakladateľa. |
| D-005 | 2026-10-13 | Fáza 1: len pre zakladateľa; fáza 2: používatelia v EÚ. | Zadanie zakladateľa. |
| D-006 | 2026-10-13 | „Rozhodnutie“ = transakcia. | Zadanie zakladateľa. |
| D-007 | 2026-10-13 | Produkt nevyberá ani neodporúča investície; počíta s výnosom existujúcej investície používateľa. Cieľ si nastaví používateľ s podporou odporúčaní. | Zadanie zakladateľa; rozsah odporúčaní treba potvrdiť. |
| D-008 | 2026-10-13 | MVP počíta cieľ podľa pravidla 4 % (ročné výdavky × 25) s viditeľnými predpokladmi; projekcia podľa výnosu a inflácie je odložená. | Jednoduchosť pre MVP; zadanie zakladateľa. |
| D-009 | 2026-10-13 | MVP je webová aplikácia s ručným zadávaním transakcií a lokálnym ukladaním dát (s exportom/importom). Neskôr mobilná aplikácia s integráciami na banku a investičné aplikácie. | Jednoduchosť a ochrana citlivých dát v osobnej fáze; zadanie zakladateľa. |
| D-010 | 2026-10-13 | Existujúca investícia sa v MVP zadáva ručne: aktuálna hodnota a predpokladaný ročný výnos (viditeľný predpoklad). | Jednoduchosť; bez trhových dát. |
| D-011 | 2026-10-13 | Odporúčania pri nastavení cieľa: parametre a predvolené hodnoty podľa tabuľky vo vízii v0.6 (výdavky, miera výberu 4 % [3–4 %], reálny výnos 4 % [2–6 %], mesačné sporenie, rezerva 3 mesiace [3–6]). MVP ukazuje aj odhadovaný dátum cieľa ako rozsah. | Potvrdené zakladateľom; číselné hodnoty treba overiť v zdrojoch. |
| D-012 | 2026-10-13 | MVP je mobile-first (telefón), používanie týždenne; evidujú sa len výdavky nad prahovú sumu (100–500 €), prah je parameter. | Zadanie zakladateľa. |
| D-013 | 2026-10-13 | Ročné výdavky v dôchodku zadáva používateľ ručne; mesačné sporenie sa odvodzuje z transakcií sporenie/investícia; prah platí len pre výdavky, predvolene 100 €; evidovaný výdavok znižuje kapitál (cieľová suma sa nemení). Upresňuje D-011. | Potvrdené zakladateľom; vyriešený konflikt prahu a odvodzovania výdavkov. |
| D-014 | 2026-10-13 | Pri výdavku sa volí zdroj úhrady (predvolene z príjmu; z kapitálu znižuje kapitál). Kapitál sa oficiálne prepočítava raz mesačne na konci mesiaca (hodnota investícií + sporenie zadáva používateľ); po transakcii sa ukáže len predbežný dopad ako krátky text bez farieb. Upresňuje D-004 a D-013. | Potvrdené zakladateľom; nižšia záťaž, menej výkyvov. |
| D-015 | 2026-10-13 | Externý reviewer dokumentov je aplikácia Claude (nahradila ChatGPT). | Rozhodnutie zakladateľa. |
| D-016 | 2026-10-13 | UX MVP: rozsah dátumov ako text „od – do“ (graf neskôr); svetlý/tmavý režim podľa systému; pri vynechanom mesačnom vyhodnotení jemná pripomienka a viditeľný dátum posledného vyhodnotenia, bez automatických zmien; po vyhodnotení jedna veta o rozdiele oproti predbežnému dopadu. | Zadanie zakladateľa; štvrtá otázka navrhnutá Claude a schválená zakladateľom. |
| D-017 | 2026-10-13 | FR: rezerva nie je v kapitáli ani v cieli; výdavky pod prahom sa neukladajú; mesačné sporenie = súčet sporenia a investícií za 12 mesiacov ÷ 12. | Potvrdené zakladateľom (O-1, O-2, O-4). |
| D-018 | 2026-10-13 | Import zálohy nahradí aktuálne dáta až po potvrdení; zlúčenie sa môže doplniť neskôr. | Potvrdené zakladateľom (O-3). |
| D-019 | 2026-10-13 | Dátum cieľa sa zobrazuje do 50 rokov; ďalej „viac ako 50 rokov“. Bez kapitálu a sporenia: „Bez sporenia a výnosu sa cieľ nedosiahne“. | Potvrdené zakladateľom (O-5). |
