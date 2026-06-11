import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getAdminByEmail, createAdmin } from "../services/admin.service";
import { signToken } from "../jwt";
import * as crypto from 'crypto';
import { COOKIE_NAME } from '../../shared/const';

const hashPassword = (password: string) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  
  login: publicProcedure
    .input(z.object({ email: z.string().trim().toLowerCase().email(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const admin = getAdminByEmail(input.email);
      if (!admin || !admin.password) {
        throw new Error("Credenciales inválidas");
      }
      
      const hashed = hashPassword(input.password);
      if (hashed !== admin.password) {
        throw new Error("Credenciales inválidas");
      }

      const token = await signToken({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'admin'
      });

      // Set cookie
      ctx.res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24h
      });

      return { success: true };
    }),

  register: publicProcedure
    .input(z.object({ name: z.string().trim(), email: z.string().trim().toLowerCase().email(), password: z.string().min(6) }))
    .mutation(async ({ input, ctx }) => {
      // En un caso real, validaríamos que solo se pueda registrar si no hay admins o usando un invite code.
      // Aquí permitiremos el registro del primer admin libremente por simplicidad inicial.
      try {
        const hashed = hashPassword(input.password);
        createAdmin(input.name, input.email, hashed);
        return { success: true };
      } catch (error: any) {
        if (error.message && error.message.includes('UNIQUE')) {
          throw new Error("El email ya está registrado");
        }
        throw error;
      }
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(COOKIE_NAME, {
      maxAge: -1,
      secure: true,
      sameSite: 'none',
      httpOnly: true,
      path: '/',
    });
    return { success: true };
  }),
});
