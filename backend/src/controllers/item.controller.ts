import { Request, Response, NextFunction } from 'express';
import { Item } from '../models/item.model';
import { AppError } from '../middleware/error.middleware';
import { sendSuccess } from '../utils/response';

export async function createItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { title, description, category, status } = req.body;
    const item = await Item.create({
      title,
      description,
      category,
      status,
      owner: req.user.id,
    });

    sendSuccess(res, { item }, 'Item created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function getItems(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const items = await Item.find(filter).populate('owner', 'name email').sort({ createdAt: -1 });
    sendSuccess(res, { count: items.length, items }, 'Items retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getItemById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'name email');
    if (!item) {
      throw new AppError('Item not found', 404);
    }
    sendSuccess(res, { item }, 'Item details retrieved');
  } catch (error) {
    next(error);
  }
}

export async function updateItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      throw new AppError('Item not found', 404);
    }

    // Ownership or admin check
    if (req.user && item.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('Unauthorized to update this item', 403);
    }

    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    sendSuccess(res, { item: updated }, 'Item updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function deleteItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      throw new AppError('Item not found', 404);
    }

    // Ownership or admin check
    if (req.user && item.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('Unauthorized to delete this item', 403);
    }

    await item.deleteOne();
    sendSuccess(res, null, 'Item deleted successfully');
  } catch (error) {
    next(error);
  }
}
