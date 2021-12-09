# Load testing Key Vault's Decrypt endpoint

To run the server:

```sh
npm install
cp sample.env .env
```

Then replace the placeholder values with your values in `.env`

Finally, run `npm run start`

To start the load test:

```sh
npm install -g artillery
artillery run load-test.yml
```
