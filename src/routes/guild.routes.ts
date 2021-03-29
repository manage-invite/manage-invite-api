import { Router } from 'express';

const usersRouter = Router();

usersRouter.get('/', (req, res) => {
  return res.json("OK");
});

export default usersRouter;
