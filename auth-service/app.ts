import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

app.post("/login", (req: Request, res: Response) => {
  const { username } = req.body;
  const token = jwt.sign(
    { sub: username, iss: "LocalIdP" },
    "secretkey",
    { expiresIn: "1h" }
  );
  res.json({ token });
});

app.listen(4000, () => {
  console.log("Auth-Service (IdP local) corriendo en puerto 4000");
});
