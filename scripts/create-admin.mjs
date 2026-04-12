#!/usr/bin/env node

/**
 * Script interactivo para crear un usuario administrador con email verificado.
 *
 * Uso:
 *   node scripts/create-admin.mjs
 *
 * Requisitos:
 *   - Variables de entorno NEXT_PUBLIC_INSFORGE_URL e INSFORGE_ANON_KEY
 *     (cargadas desde .env.local o exportadas en el shell)
 *   - CLI de InsForge autenticada y proyecto enlazado
 */

import { createInterface } from "node:readline/promises";
import { stdin, stdout, exit, env } from "node:process";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Cargar variables de entorno desde .env.local si existe
// ---------------------------------------------------------------------------
function loadEnvFile() {
  const candidates = [".env.local", ".env"];
  for (const name of candidates) {
    try {
      const raw = readFileSync(resolve(name), "utf-8");
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!env[key]) env[key] = val;
      }
    } catch {
      // Archivo no existe, continuar
    }
  }
}

loadEnvFile();

// ---------------------------------------------------------------------------
// Validaciones (mismos criterios que el signup de la app)
// ---------------------------------------------------------------------------
function validateName(name) {
  if (!name || !name.trim()) return "El nombre es requerido.";
  if (name.trim().length > 100) return "Máximo 100 caracteres.";
  return null;
}

function validateEmail(email) {
  if (!email || !email.trim()) return "El email es requerido.";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email.trim())) return "Email inválido.";
  return null;
}

function validatePassword(password) {
  if (!password) return "La contraseña es requerida.";
  if (password.length < 8) return "Mínimo 8 caracteres.";
  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function askValid(rl, prompt, validator) {
  while (true) {
    const value = await rl.question(prompt);
    const err = validator(value);
    if (!err) return value.trim();
    console.error(`  ✗ ${err}`);
  }
}

function cliQuery(sql) {
  return execSync(`npx @insforge/cli db query "${sql}" --json`, {
    stdio: "pipe",
    encoding: "utf-8",
  });
}

function getUserIdByEmail(email) {
  const escaped = email.replace(/'/g, "''");
  const raw = cliQuery(`SELECT id FROM auth.users WHERE email = '${escaped}' LIMIT 1`);
  try {
    const parsed = JSON.parse(raw);
    const rows = parsed?.data ?? parsed?.rows ?? parsed;
    if (Array.isArray(rows) && rows.length > 0) return rows[0].id;
  } catch {
    // --json puede no estar soportado, intentar sin --json
    const raw2 = execSync(
      `npx @insforge/cli db query "SELECT id FROM auth.users WHERE email = '${escaped}' LIMIT 1"`,
      { stdio: "pipe", encoding: "utf-8" },
    );
    const match = raw2.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (match) return match[0];
  }
  return null;
}

function createProfileViaCli(userId) {
  try {
    execSync(
      `npx @insforge/cli db query "INSERT INTO user_profiles (user_id, role, is_active) VALUES ('${userId}', 'admin', true) ON CONFLICT (user_id) DO UPDATE SET role = 'admin', is_active = true"`,
      { stdio: "pipe" },
    );
    console.log("  ✓ Perfil admin creado vía CLI (activo)");
  } catch (e) {
    console.error("  ⚠ No se pudo crear el perfil:", e.stderr?.toString().trim());
    console.log(`    Manual: npx @insforge/cli db query "INSERT INTO user_profiles (user_id, role, is_active) VALUES ('${userId}', 'admin', true)"`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const baseUrl = env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = env.INSFORGE_ANON_KEY || env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    console.error(
      "Error: Faltan variables de entorno NEXT_PUBLIC_INSFORGE_URL y/o INSFORGE_ANON_KEY.\n" +
        "Asegúrate de tener un archivo .env.local con estas variables o expórtalas en tu shell.",
    );
    exit(1);
  }

  console.log("\n╔══════════════════════════════════════╗");
  console.log("║   Crear usuario administrador        ║");
  console.log("╚══════════════════════════════════════╝\n");

  const rl = createInterface({ input: stdin, output: stdout });

  try {
    const name = await askValid(rl, "Nombre completo: ", validateName);
    const email = await askValid(rl, "Email: ", validateEmail);
    const password = await askValid(rl, "Contraseña (mín. 8 caracteres): ", validatePassword);

    console.log(`\nCreando usuario "${name}" (${email}) como admin…\n`);

    // 1. Registrar el usuario usando el SDK
    const { createClient } = await import("@insforge/sdk");
    const insforge = createClient({ baseUrl, anonKey, isServerMode: true });

    const { data: signUpData, error: signUpError } = await insforge.auth.signUp({
      email,
      password,
      name,
    });

    let userId = signUpData?.user?.id;
    const needsVerification =
      signUpData?.requireEmailVerification === true ||
      signUpError?.message?.toLowerCase().includes("verification") ||
      signUpError?.message?.toLowerCase().includes("verify");

    const isAlreadyExists =
      signUpError?.message?.toLowerCase().includes("already") ||
      signUpError?.message?.toLowerCase().includes("exists");

    if (signUpError && !needsVerification && !isAlreadyExists) {
      console.error(`✗ Error al registrar: ${signUpError.message ?? ""}`);
      exit(1);
    }

    if (isAlreadyExists) {
      console.log("  ↳ La cuenta ya existe, buscando usuario…");
    }

    if (!userId) {
      console.log("  ↳ Buscando ID del usuario en la base de datos…");
      userId = getUserIdByEmail(email);
    }

    if (!userId) {
      console.error("✗ No se pudo obtener el ID del usuario. Verifica que la CLI esté autenticada.");
      exit(1);
    }

    console.log(`  ✓ Usuario registrado (ID: ${userId})`);

    // 2. Verificar email con código OTP y obtener sesión autenticada
    let accessToken = signUpData?.accessToken;

    if (isAlreadyExists) {
      console.log("  ✓ Usuario ya verificado (cuenta existente)");
    } else if (needsVerification) {
      console.log("\n  ✉ Se envió un código de verificación a tu email.");

      let verified = false;
      while (!verified) {
        const otp = await askValid(rl, "  Código de verificación (6 dígitos): ", (v) => {
          if (!v || !v.trim()) return "El código es requerido.";
          if (!/^\d{6}$/.test(v.trim())) return "Debe ser un código de 6 dígitos.";
          return null;
        });

        const { data: verifyData, error: verifyError } = await insforge.auth.verifyEmail({ email, otp });

        if (verifyError) {
          const msg = verifyError.message ?? "";
          console.error(`  ✗ ${msg || "Código inválido o expirado."}`);

          const retry = await rl.question("  ¿Reintentar? (s/n): ");
          if (retry.trim().toLowerCase() !== "s") {
            console.log("\n  Puedes verificar manualmente con:");
            console.log(`    npx @insforge/cli db query "UPDATE auth.users SET email_confirmed_at = now() WHERE id = '${userId}'"`);
            exit(1);
          }
        } else {
          verified = true;
          accessToken = verifyData?.accessToken ?? accessToken;
          console.log("  ✓ Email verificado");
        }
      }
    } else {
      console.log("  ✓ Email verificado (sin verificación requerida)");
    }

    // 3. Crear perfil admin activo en user_profiles
    // Usamos CLI directamente (SECURITY DEFINER) para evitar problemas de RLS
    createProfileViaCli(userId);

    console.log("\n══════════════════════════════════════");
    console.log("  ✓ ¡Admin creado exitosamente!");
    console.log(`    Email:    ${email}`);
    console.log(`    Rol:      admin`);
    console.log(`    Activo:   sí`);
    console.log(`    Verified: sí`);
    console.log("══════════════════════════════════════\n");
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error("Error inesperado:", err);
  exit(1);
});
