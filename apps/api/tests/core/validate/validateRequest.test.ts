import { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { ApiError } from "~/core/http/ApiError";
import {
  validateRequest,
  ZodEmptyObject,
} from "~/core/validate/validateRequest";

describe("validateRequest", () => {
  it("Successfully validate request body, query and params", async () => {
    const schema = z.object({
      body: z.object({
        email: z.email(),
      }),
      query: ZodEmptyObject,
      params: ZodEmptyObject,
    });

    const req = {
      body: {
        email: "test@test.com",
      },
      query: {},
      params: {},
    } as Request;
    const res = {} as Response;
    const next = jest.fn() as unknown as NextFunction;

    const validate = validateRequest(schema);

    const callMiddleware = () => validate(req, res, next);

    expect(callMiddleware).not.toThrow();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("Should throw ApiError.BadRequest if validation failed", async () => {

    const schema = z.object({
      body: z.object({
        email: z.email(),
        profile: z.object({
          name: z.string().min(2),
          age: z.coerce.number().min(18),
        }),
      }),

      query: z.object({
        page: z.coerce.number().int().min(1).max(10),
      }),

      params: z.object({
        userId: z.string().min(1),
      }),
    });

    const req = {
      body: {
        email: "naysaine",
        profile: {
          name: "a",
          age: "17",
        },
      },
      query: {
        page: "",
      },
      params: {
        userId: "",
      },
    } as unknown as Request;
    const res = {} as unknown as Response;
    const next = jest.fn() as unknown as NextFunction;

    const validate = validateRequest(schema);

    const callMiddleware = () => validate(req, res, next);

    try {
      callMiddleware();

      throw new Error("Should throw ApiError.BadRequest");
    } catch (error: any) {

      expect(error).toBeInstanceOf(ApiError);

      expect(error.statusCode).toBe(400);

      expect(error.message).toContain('Validation error');

      expect(error.message).toContain('body.email');
      expect(error.message).toContain('body.profile.name');
      expect(error.message).toContain('body.profile.age');
      expect(error.message).toContain('query.page');
      expect(error.message).toContain('params.userId');

      expect(error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'body.email', message: expect.any(String) }),
          expect.objectContaining({ path: 'body.profile.name', message: expect.any(String) }),
          expect.objectContaining({ path: 'body.profile.age', message: expect.any(String) }),
          expect.objectContaining({ path: 'query.page', message: expect.any(String) }),
          expect.objectContaining({ path: 'params.userId', message: expect.any(String) }),
        ])
      )

      expect(next).not.toHaveBeenCalled();
    }
  });
});
