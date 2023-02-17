const router = require("express").Router();
const { ethers } = require("ethers");
const QRCode = require("qrcode");
const crypto = require("crypto");
const User = require("../models/User");
const Payment = require("../models/Payment");
const jwt = require("jsonwebtoken");

router.post("/create", async (req, res) => {
  await Payment.sync();
  const { amount, currency, description, s_callback, f_callback, name } = req.body;
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const hashedApiKey = crypto.createHash("sha256").update(apiKey).digest("hex");
  const isValidApiKey = await User.findOne({ where: { apiKey: hashedApiKey } });
  if (!isValidApiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payment_id = "bp_" + crypto.randomBytes(13).toString("hex");

  const newPayment = await Payment.create({
    payment_id,
    apiKey: hashedApiKey,
    amount,
    currency,
    description,
    s_callback,
    f_callback,
    name
  });

  await newPayment.save();
  return res.status(200).json({
    payment_id,
    amount,
    currency,
    description,
    s_callback,
    f_callback,
    name
  });
});

router.post("/web/create", async (req, res) => {
  await Payment.sync();
  const { amount, name, currency, description, s_callback, f_callback } = req.body;
  let token = req.headers.authorization;
  const tokenSplit = token.split(" ");
  if (tokenSplit.length !== 2) {
    return res.status(401).json({ error: "Invalid token" });
  }
  token = tokenSplit[1];
  let decoded;
  try {
    decoded = jwt.verify(token, "mysupersecret");
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: "Invalid / expired token" });
  }
  const apiKey = decoded.apiKey;
  if (!apiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payment_id = "bp_" + crypto.randomBytes(13).toString("hex");

  const newPayment = await Payment.create({
    payment_id,
    apiKey,
    amount,
    currency,
    description,
    name,
    s_callback,
    f_callback,
  });

  await newPayment.save();
  return res.status(200).json({
    payment_id,
    amount,
    currency,
    description,
    s_callback,
    f_callback,
    name
  });
});

router.get("/:paymentId", async (req, res) => {
  await Payment.sync();
  const { paymentId } = req.params;
  if (!paymentId) {
    return res.status(400).json({ error: "Missing parameter" });
  }

  const paymentData = await Payment.findOne({
    where: { payment_id: paymentId },
  });
  if (!paymentData) {
    return res.status(404).json({ error: "Payment not found" });
  }

  const userData = await User.findOne({
    where: { apiKey: paymentData.apiKey },
  });
  const data = {
    address: userData.dataValues.address,
    merchantName: userData.dataValues.name,
  };

  return res.status(200).json({ ...paymentData.dataValues, ...data });
});

router.put("/:paymentId", async (req, res) => {
  await Payment.sync();
  const { paymentId } = req.params;
  if (!paymentId) {
    return res.status(400).json({ error: "Missing parameter" });
  }

  const paymentData = await Payment.findOne({
    where: { payment_id: paymentId },
  });
  if (!paymentData) {
    return res.status(404).json({ error: "Payment not found" });
  }

  const { status } = req.body;
  if (!status || (status !== "success" && status !== "failed")) {
    return res.status(400).json({ error: "Invalid status" });
  }

  await paymentData.update({ status: status });
  return res.status(200).json({ payment_id: paymentId, status: "OK" });
});

router.get("/list", async (req, res) => {
  await Payment.sync();
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const hashedApiKey = crypto.createHash("sha256").update(apiKey).digest("hex");
  const isValidApiKey = await User.findOne({ where: { apiKey: hashedApiKey } });
  if (!isValidApiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const payments = await Payment.findAll({
    where: {
      apiKey: hashedApiKey,
    },
  });

  return res.status(200).json(payments);
});
router.get("/web/list", async (req, res) => {
  await Payment.sync();
  let token = req.headers.authorization;
  const tokenSplit = token.split(" ");
  if (tokenSplit.length !== 2) {
    return res.status(401).json({ error: "Invalid token" });
  }
  token = tokenSplit[1];
  let decoded;
  try {
    decoded = jwt.verify(token, "mysupersecret");
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: "Invalid / expired token" });
  }
  const apiKey = decoded.apiKey;
  if (!apiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const payments = await Payment.findAll({
    where: {
      apiKey,
    },
  });

  return res.status(200).json(payments);
});

router.get("/web/status/:paymentId", async (req, res) => {
  let token = req.headers.authorization;
  const tokenSplit = token.split(" ");
  if (tokenSplit.length !== 2) {
    return res.status(401).json({ error: "Invalid token" });
  }
  token = tokenSplit[1];
  let decoded;
  
  try {
    decoded = jwt.verify(token, "mysupersecret");
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: "Invalid / expired token" });
  }
  const apiKey = decoded.apiKey;
  if (!apiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const paymentData = await Payment.findOne({
    where: {
      apiKey,
    },
  });
  return res.status(200).json({ ...paymentData.dataValues });
});
module.exports = router;
