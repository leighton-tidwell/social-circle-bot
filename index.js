require("dotenv").config();
const { Client, Intents } = require("discord.js");
const mongoose = require("mongoose");
const { TOKEN, MONGODB_URI } = process.env;

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
});

const FindMatchSchema = new mongoose.Schema({
  socketid: {
    type: String,
    required: true,
  },
});

const findMatchModel = mongoose.model("FindMatch", FindMatchSchema);

// Set up mongoose connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error: "));
db.once("open", () => {
  console.log("MongoDB connected successfully!");
});

let totalInQueue = 0;
client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const clientsFindingMatch = await findMatchModel.find();
  totalInQueue = clientsFindingMatch.length;

  const guild = await client.guilds.fetch("893211096763207770");
  const playerRole = guild.roles.cache.get("893211495717023795");
  const botRole = guild.roles.cache.get("894290066283843605");

  const queueChannel = await guild.channels.create(
    `Players in queue: ${totalInQueue}`,
    {
      type: "GUILD_VOICE",
      permissionOverwrites: [
        {
          id: playerRole,
          deny: ["CONNECT"],
        },
        {
          id: botRole,
          allow: ["MANAGE_CHANNELS", "VIEW_CHANNEL"],
        },
      ],
    }
  );

  const { id } = queueChannel;

  findMatchModel.watch().on("change", async (data) => {
    if (data.operationType === "insert") totalInQueue += 1;
    else totalInQueue -= 1;

    console.log("Detected change.");

    const queue = await guild.channels.fetch(id);
    queue.setName(`Players in queue: ${totalInQueue}`);
  });
});

client.login(TOKEN);
