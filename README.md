# ClassBot

ClassBot est un bot Discord pour gérer l'edt et les devoirs pendant la période de confinement.

## Installation

### Heroku

Il est connseillé de déployer le bot via le PaaS Heroku, puisqu'il a été conçu pour fonctionner dessus au début. Pour celà, il faut fork ce dépôt github, puis le sélectionner dans les paramètres de déploiement dans la section github.

Les variables de configuration sont à entrer dans les paramètres (config vars).

### Localement

Pour cela, il faut cloner le dépôt, puis lancer le bot avec la commande `node app.js`.

Les variables de configuration sont à entrer dans un fichier `.env`.

## Configuration

Il est nécessaire de créer un bot Discord sur [le site développeur de Discord](https://discordapp.com/developers/applications). Le token du bot est à copier et à insérer dans les variables de configuration.

Il est aussi nécessaire d'avoir une base de donnée MySQL externe pour le stockage. Si vous l'hébergez vous même, il suffit d'installer localement mysql, sinon on en trouve gratuitement sur [db4free.net](https://www.db4free.net) pour ce type d'usage peu gourmant.

Pour finir, il faut définir les variables de configuration avant de démarrer l'application :

- `HOST` : Host du serveur (pour le refresh heroku, optionnel)
- `MYSQL_HOST` : Host de la base de données à utiliser
- `MYSQL_DATABASE` : Nom de la base de données à utiliser
- `MYSQL_USERNAME` : Nom d'utilisateur de la base de données à utiliser
- `MYSQL_PASSWORD` : Mot de passe de la base de données à utiliser
- `TOKEN` : Token du bot Discord
- `OWNER` : ID de l'utilisateur qui a le droit de gérer les professeurs
- `ROLE` : ID du rôle à mentionner lors de l'annonce des cours/devoirs
- `CHANNEL` : ID de la channel dans laquelle sont faites ces annonces
- `TZ` : Timezone (optionnel)

## Commandes

- `$prof <id> <matière>` : Ajoute un prof pour la matière
- `$cours <matière> <jour/mois/année> <heure:minutes>` : Ajoute un cours dans la matière aux horaires données
- `$devoirs <matière> <jour/mois/année> <heure:minutes> <contenu>` : Ajoute des devoirs
- `$matières` : Liste les matières et les professeurs
- `$liste` : Liste les cours et les devoirs
