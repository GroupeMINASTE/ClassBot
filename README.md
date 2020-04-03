# ClassBot

ClassBot est un bot Discord pour gérer l'edt et les devoirs pendant la période de confinement.

## Configuration

Variables d'environment à définir :

- `MYSQL_HOST` : Host de la base de données à utiliser
- `MYSQL_DATABASE` : Nom de la base de données à utiliser
- `MYSQL_USERNAME` : Nom d'utilisateur de la base de données à utiliser
- `MYSQL_PASSWORD` : Mot de passe de la base de données à utiliser
- `TOKEN` : Token du bot Discord
- `OWNER` : ID de l'utilisateur qui a le droit de gérer les professeurs
- `ROLE` : ID du rôle à mentionner lors de l'annonce des cours/devoirs
- `CHANNEL` : ID de la channel dans laquelle sont faites ces annonces
- `TZ` : Timezone (optionel)

## Commandes

- `$prof <id> <matière>` : Ajoute un prof pour la matière
- `$cours <matière> <jour/mois/année> <heure:minutes>` : Ajoute un cours dans la matière aux horaires données
- `$liste` : Liste les cours et les devoirs
