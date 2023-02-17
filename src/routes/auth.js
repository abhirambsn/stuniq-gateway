const router = require("express").Router();
const ethers = require("ethers");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Payment = require("../models/Payment");

router.post("/create", async (req, res) => {
  console.log("Account Creation Started");
  await User.sync();
  // Store data to the DB
  const { name, password, email, image } = req.body;
  const privKey = `0x${crypto.randomBytes(32).toString("hex")}`;
  let wallet = new ethers.Wallet(privKey);
  const apiKey = crypto.randomBytes(16).toString("hex");
  const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
  const userObj = {
    address: wallet.address,
    privateKey: crypto.createHash("sha256").update(privKey).digest("hex"),
    name,
    password: crypto.createHash("sha256").update(password).digest("hex"),
    image,
    apiKey: apiKeyHash,
    email,
  };
  const newUser = await User.create(userObj);
  await newUser.save();
  const token = jwt.sign({ email, apiKey }, "mysupersecret", {
    expiresIn: "1h",
  });
  return res
    .status(201)
    .json({ privateKey: privKey, address: wallet.address, apiKey, token });
});

router.post("/web/login", async (req, res) => {
  await User.sync();
  const { email, password } = req.body;
  const passwordHash = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
  const user = await User.findOne({
    where: {
      email,
    },
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  if (user.password !== passwordHash) {
    return res.status(401).json({ error: "Invalid password" });
  }
  const token = jwt.sign({ email, apiKey: user.apiKey }, "mysupersecret", {
    expiresIn: "1h",
  });
  return res.status(200).json({ token });
});

router.get("/web/profile", async (req, res) => {
  await Payment.sync();
  let token = req.headers.authorization;
  console.log(token);
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

  const email = decoded?.email;
  try {
    const user = await User.findOne({
      where: {
        email,
      },
    });
    const allPaymentCount = await Payment.count({
      where: {
        apiKey: decoded.apiKey,
      },
    });

    const successfulPaymentCount = await Payment.count({
      where: {
        apiKey: decoded.apiKey,
        status: "success",
      },
    });

    const paymentValue = await Payment.sum("amount", {
      where: {
        apiKey: decoded.apiKey,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found", valid: null });
    }
    return res.status(200).json({
      ...user.dataValues,
      stats: {
        paymentCount: allPaymentCount,
        successfulPayment: successfulPaymentCount,
        paymentValue,
      },
      valid: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error, valid: false });
  }
});

router.put("/update", async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const hashedApiKey = crypto.createHash("sha256").update(apiKey).digest("hex");
  const isValidApiKey = await User.findOne({ where: { apiKey: hashedApiKey } });
  if (!isValidApiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { address, privateKey } = req.body;
  const email = isValidApiKey.dataValues.email;
  if (!address || !privateKey) {
    return res.status(400).json({ error: "Invalid address or private key" });
  }
  try {
    const user = await User.findOne({
      where: {
        email,
      },
    });

    await user.update({
      address,
      privateKey: crypto.createHash("sha256").update(privateKey).digest("hex"),
    });

    return res
      .status(200)
      .json({ message: "Address and private key updated", status: "ok" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error getting user" });
  }
});

router.put("/web/update", async (req, res) => {
  let token = req.headers.authorization;
  console.log(token);
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

  const email = decoded?.email;
  const { address, privateKey } = req.body;
  if (!address || !privateKey) {
    return res.status(400).json({ error: "Invalid address or private key" });
  }
  try {
    const user = await User.findOne({
      where: {
        email,
      },
    });

    await user.update({
      address,
      privateKey: crypto.createHash("sha256").update(privateKey).digest("hex"),
    });

    return res
      .status(200)
      .json({ message: "Address and private key updated", status: "ok" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error getting user" });
  }
});

router.delete('/delete', async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const hashedApiKey = crypto.createHash("sha256").update(apiKey).digest("hex");
  const isValidApiKey = await User.findOne({ where: { apiKey: hashedApiKey } });
  if (!isValidApiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const email = isValidApiKey.dataValues.email;

  try {
    await User.destroy({
      where: {
        email,
      },
    })
  
    await Payment.destroy({
      where: {
        apiKey: hashedApiKey,
      },
    })
  
    return res.status(200).json({message: "Account deleted", status: "ok"})
  } catch(error) {
    console.error(error);
    return res.status(500).json({error: "Error deleting account"})
  }
})


router.delete('/web/delete', async (req, res) => {
  let token = req.headers.authorization;
  console.log(token);
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

  try {
    await User.destroy({
      where: {
        email: decoded.email,
      },
    })
  
    await Payment.destroy({
      where: {
        apiKey: decoded.apiKey,
      },
    })
  
    return res.status(200).json({message: "Account deleted", status: "ok"})
  } catch(error) {
    console.error(error);
    return res.status(500).json({error: "Error deleting account"})
  }
})

module.exports = router;
