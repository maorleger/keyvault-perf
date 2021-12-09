// Read env vars first
require("dotenv").config();
var createError = require("http-errors");
var express = require("express");
var logger = require("morgan");
var { CryptographyClient, KeyClient } = require("@azure/keyvault-keys");
var { AzureCliCredential, DefaultAzureCredential } = require("@azure/identity");

// Load application insights with all the bells and whistles.
require("applicationinsights")
  .setup()
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true, true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .setAutoCollectConsole(true)
  .setUseDiskRetryCaching(true)
  .setSendLiveMetrics(true)
  .start();

var app = express();

app.use(logger("dev"));
app.use(express.json());

let cryptoClient = undefined;
let encryptedVal = undefined;

app.get("/setup", async function (req, res) {
  const credential = new DefaultAzureCredential();
  const keyClient = new KeyClient(process.env.KEYVAULT_URI, credential);
  const key = await keyClient.createRsaKey(`load-test-${Date.now()}`);
  cryptoClient = new CryptographyClient(key, credential);
  encryptedVal = (
    await cryptoClient.encrypt({
      algorithm: "RSA-OAEP-256",
      plaintext: Buffer.from("Hello, world!"),
    })
  ).result;

  res.send("Created");
  res.status(201);
  res.end();
});

app.get("/decrypt", async function (req, res) {
  if (!encryptedVal) {
    res.status(400).send("Setup has not been run yet!");
  } else {
    const label = `decrypt${Date.now()}`;
    console.time(label);
    const result = await cryptoClient.decrypt({
      algorithm: "RSA-OAEP-256",
      ciphertext: encryptedVal,
    });
    console.timeEnd(label);
    res.write(`done ${label}: ${result.result.toString()}`);
    res.end();
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send("error");
});

module.exports = app;
