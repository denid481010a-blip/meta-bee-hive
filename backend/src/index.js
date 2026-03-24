require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const db         = require("./db");

const PORT = process.env.PORT ?? 3002;

async function main() {
  // Init DB first
  await db.init();
  console.log("✅ DB initialized");

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Routes (loaded after DB is ready)
  const routes = require("./routes");
  app.use("/api", routes);

  app.listen(PORT, () => {
    console.log(`🍯 BEE HIVE API running on port ${PORT}`);
  });

  // Start blockchain indexer
  if (process.env.CONTRACT_ADDRESS && process.env.CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000") {
    const { startIndexer } = require("./indexer");
    startIndexer().catch(console.error);
  } else {
    console.log("⚠️  CONTRACT_ADDRESS not set — indexer disabled");
  }
}

main().catch(console.error);
