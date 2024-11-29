# Repertuaariaruande API

See on Node.js rakendus, mis haldab repertuaare ja nende seotud info SQLite andmebaasis. 
API võimaldab lisada uusi repertuaare, uuendada olemasolevaid, saada kõiki repertuaare koos ridadega ja otsida teoseid.


## Paigaldus ja kasutamine

Et rakendus käivitada, järgi järgmisi samme:

1. **Paigalda sõltuvused: Veendu, et sul on paigaldatud Node.js.**
   ```bash
   node install 
   npm install

2. **Seadista SQLite andmebaas: Veendu, et andmebaasi fail arendaja-kandideerimise-ylesanne.db asub kataloogis .database/**
    .

    ├── database/               
    │   └── arendaja-kandideerimise-ylesanne.db  

3. **Käivita rakendus:**
   ```bash 
   node index.js

4. **Server on nüüd saadaval aadressil http://localhost:3000. API lõpp-punkt on http://localhost:3000/api/**

## Projekti struktuur
    .

    ├── app.js                     # Rakenduse algusfail, kus seadistatakse Express server ja marsuudid
    ├── routes/                    # Kaust, mis sisaldab kõiki rakenduse marsuute
    │   └── index.js               # Marsuudid ja töötlused repertuaaride ja töödega
    ├── database/                  # Kaust, kus asub andmebaasi fail
    │   └── arendaja-kandideerimise-ylesanne.db  # SQLite andmebaasi fail
    └── package-lock.json          # Node.js projekt, mis sisaldab sõltuvusi ja skripte
    └── package.json
