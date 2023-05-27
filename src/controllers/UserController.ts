/* import userService from "../services/UserService";
import { Request, Response } from "express";

async function createUser(req: Request, res: Response) {
  const { email, name } = req.body;
  try {
    const user = await userService.createUser(email, name);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export default { createUser };
 */