# CL Expertise Technique

Site vitrine statique de Christian Linossier et système de support IA. Le frontend reste sur GitHub Pages ; l’API, l’IA et les tickets sont hébergés sur l’offre gratuite Cloudflare Workers.

## Publication sur GitHub Pages

Le site est contenu dans le dossier `dist/`. Le workflow `.github/workflows/pages.yml` le publie automatiquement à chaque envoi sur la branche `main`.

1. Créez un dépôt GitHub public.
2. Envoyez le contenu de ce projet sur la branche `main`.
3. Dans **Settings → Pages → Build and deployment → Source**, choisissez **GitHub Actions**.
4. Relancez le workflow **Publier le site sur GitHub Pages** si la première exécution a précédé l’activation de Pages.

L’adresse publique apparaîtra dans le résumé du workflow puis dans **Settings → Pages**.

Le site ne nécessite ni compilation ni dépendance. Ouvrez `dist/index.html` pour une consultation locale.

## Architecture du support

```text
GitHub Pages (dist/)
  └── widget de chat + administration
        └── Cloudflare Worker (worker/)
              ├── Workers AI : réponses assistées
              ├── D1 : tickets et limitation anti-spam
              ├── Turnstile : CAPTCHA facultatif
              └── Resend : notification e-mail
```

Les secrets ne sont jamais présents dans `dist/`. Ils sont enregistrés exclusivement dans Cloudflare ou dans les secrets GitHub Actions.

## 1. Préparer Cloudflare

Créer un compte gratuit sur Cloudflare, puis depuis PowerShell dans ce dossier :

```powershell
pnpm install
pnpm exec wrangler login
pnpm exec wrangler d1 create cl-support-db
```

Copier l’identifiant `database_id` retourné dans `worker/wrangler.jsonc` à la place de `REMPLACER_PAR_ID_D1`, puis créer les tables :

```powershell
npm run db:remote
```

## 2. Créer les secrets Cloudflare

Créer un jeton administrateur long et aléatoire :

```powershell
pnpm exec wrangler secret put ADMIN_TOKEN --config worker/wrangler.jsonc
```

Créer un compte Resend gratuit, vérifier `cl-expertise-technique.fr`, puis créer une clé API. Ajouter ensuite :

```powershell
pnpm exec wrangler secret put RESEND_API_KEY --config worker/wrangler.jsonc
```

Turnstile est facultatif mais recommandé. Créer un widget pour `www.cl-expertise-technique.fr`, puis enregistrer sa clé secrète :

```powershell
pnpm exec wrangler secret put TURNSTILE_SECRET --config worker/wrangler.jsonc
```

Ne jamais placer ces trois valeurs dans `dist/config.js`.

## 3. Déployer l’API

```powershell
npm run deploy:worker
```

Le forfait gratuit applique automatiquement sa limite CPU. Ne pas ajouter de bloc `limits.cpu_ms` dans `worker/wrangler.jsonc`, car la personnalisation de cette limite est réservée à l’offre payante.

Cloudflare renvoie une adresse du type `https://cl-support-api.xxxxx.workers.dev`. La reporter dans `dist/config.js`, propriété `API_URL`. Reporter uniquement la clé **publique** Turnstile dans `TURNSTILE_SITE_KEY`, puis passer `SUPPORT_ENABLED` à `true`. Le widget reste volontairement masqué tant que cette activation n’est pas terminée, afin de ne jamais afficher un support cassé sur le site public.

Vérifier ensuite :

```text
https://cl-support-api.xxxxx.workers.dev/api/health
```

La réponse attendue est `{"ok":true,"service":"CL Support"}`.

## 4. Configurer Resend et OVHcloud

Dans Resend, ajouter le domaine `cl-expertise-technique.fr`. Resend fournit des entrées DNS DKIM/SPF à recopier dans la zone DNS OVHcloud. Conserver les entrées GitHub Pages et les entrées MX existantes : ne remplacer que les entrées explicitement demandées par Resend, sans supprimer les entrées de réception d’e-mail.

La configuration publique de l’expéditeur est centralisée dans `worker/wrangler.jsonc` :

- `SUPPORT_EMAIL` : destinataire des tickets ;
- `FROM_EMAIL` : expéditeur vérifié par Resend ;
- `FRONTEND_ORIGIN` : seul site autorisé par CORS ;
- `AI_MODEL` : modèle Workers AI ;
- `RETENTION_DAYS` : suppression automatique des anciens tickets.

## 5. Administration

L’interface se trouve à `/admin.html`. Elle demande `ADMIN_TOKEN` et permet de consulter, rechercher, classer et supprimer définitivement les tickets. Le jeton est conservé uniquement dans `sessionStorage` et disparaît à la fermeture de la session du navigateur.

## 6. Déploiement assisté du Worker

Le workflow manuel `.github/workflows/worker.yml` déploie le backend uniquement lorsque vous le lancez depuis l’onglet **Actions**, ce qui évite un déploiement incomplet avant la création de D1 et des secrets. Dans **GitHub → Settings → Secrets and variables → Actions**, créer :

- `CLOUDFLARE_API_TOKEN` : jeton Cloudflare limité à Workers Scripts Edit, D1 Edit et Workers AI Read ;
- `CLOUDFLARE_ACCOUNT_ID` : identifiant du compte Cloudflare.

Les secrets applicatifs `ADMIN_TOKEN`, `RESEND_API_KEY` et `TURNSTILE_SECRET` restent gérés directement par Cloudflare et ne sont pas nécessaires dans GitHub.

## 7. Tests de recette

1. Question simple : demander le téléphone → réponse automatique sans invention.
2. Question inconnue : demander une information absente → proposition de transfert humain.
3. Ticket : envoyer un formulaire valide → numéro `SUP-AAAA-00001`, présence dans `/admin.html`, e-mail reçu.
4. E-mail invalide : saisir `test@` → refus du navigateur et du Worker.
5. Spam : envoyer plus de 12 messages en une minute → réponse HTTP 429.
6. IA indisponible : retirer temporairement la liaison AI en test → réponse de secours et création de ticket toujours possible.
7. Mobile : ouvrir le widget sous 390 px de large → panneau lisible, envoi avec Entrée et bouton.
8. Secrets : rechercher `ADMIN_TOKEN`, `RESEND_API_KEY` et `TURNSTILE_SECRET` dans les fichiers servis sous `dist/` → aucune valeur secrète.
9. CORS : appeler l’API depuis une autre origine → réponse 403.
10. Suppression : supprimer un ticket dans l’administration → il ne doit plus apparaître.

## Mise à jour

- Contenu : `dist/index.html`
- Mise en forme : `dist/styles.css`
- Interactions : `dist/script.js`
- Support : `dist/support.js`
- Catalogue : `dist/catalogue.js`
- Administration : `dist/admin.html`
- Backend : `worker/src/index.js`
- Paramètres serveur : `worker/wrangler.jsonc`
- Logo : `dist/assets/logo-cl-expertise.png`

## Contact public affiché

- Téléphone : 06 64 80 73 63
- Email : cl.expertise.technique@gmail.com
- LinkedIn : christian-linossier
