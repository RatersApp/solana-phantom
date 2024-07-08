# TetraCodeio Phantom<=>Solana Sandbox.
> production: npm run build
> development: npm run start

Change configs in ./src/constants.ts

[Live page](https://solana-phantom.ratersapp.com/)

#Deploy:
Put ./backend/.nginx configuration in your server. For example, /etc/nginx/sites-available/phantom
Adjust folder on your server:
/var/www/html/PHANTOM-SOLANA-SANDBOX/backend
/var/www/html/PHANTOM-SOLANA-SANDBOX/frontend
Put files in backend into backend on the server, build fronend and put files from build into frontend folder on your server.