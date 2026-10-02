import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { AppError } from '../middleware/error.middleware';
import { sendSuccess } from '../utils/response';

export async function getAllUsers(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await User.find().select('-__v');
    sendSuccess(res, { count: users.length, users }, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    sendSuccess(res, { user }, 'User retrieved');
  } catch (error) {
    next(error);
  }
}
