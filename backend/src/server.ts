// src/server.ts
import app from "./app";

const PORT = process.env.APP_PORT || 8000;

app.listen(PORT, () => {
  console.log(`伺服器運行在PORT: ${PORT}`);
});
