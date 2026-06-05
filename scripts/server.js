import { createServer } from "node:http";
import handler from "../server.js";

const port = Number.parseInt(process.env.PORT || "3000", 10);

const server = createServer(handler);

server.listen(port, () => {
  console.log(`100GIGZ server listening on http://localhost:${port}`);
});
