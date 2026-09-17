import 'dotenv/config';
import app from './app.mjs';
import { testDatabaseConnection } from './config/db.mjs';

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);

  await testDatabaseConnection();
});