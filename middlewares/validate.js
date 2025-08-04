import { ZodError } from "zod";

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body); // validated + parsed
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: err.issues.map((e) => ({
          field: e.path[0],
          message: e.message,
        })),
      });
    }
    next(err);
  }
};
