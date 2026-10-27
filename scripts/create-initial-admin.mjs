import "dotenv/config"

import argon2 from "argon2"
import { Client } from "pg"
import { createInterface } from "node:readline/promises"
import { StringDecoder } from "node:string_decoder"

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,64}$/
const PASSWORD_MIN_LENGTH = 12
const PASSWORD_MAX_LENGTH = 128

class InitialAdminError extends Error {}

async function promptUsername() {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    return (await readline.question("Nombre de usuario: ")).trim()
  } finally {
    readline.close()
  }
}

async function promptHidden(label) {
  const input = process.stdin

  if (!input.isTTY || typeof input.setRawMode !== "function") {
    throw new InitialAdminError(
      "La contraseña debe solicitarse desde una terminal interactiva.",
    )
  }

  process.stdout.write(label)
  input.setRawMode(true)
  input.resume()

  return new Promise((resolve, reject) => {
    const decoder = new StringDecoder("utf8")
    let value = ""

    function finish(error) {
      input.off("data", onData)
      input.setRawMode(false)
      input.pause()
      process.stdout.write("\n")

      if (error) reject(error)
      else resolve(value)
    }

    function onData(buffer) {
      for (const character of decoder.write(buffer)) {
        if (character === "\u0003") {
          finish(new InitialAdminError("Operación cancelada."))
          return
        }

        if (character === "\r" || character === "\n") {
          finish()
          return
        }

        if (character === "\u0008" || character === "\u007f") {
          value = [...value].slice(0, -1).join("")
          continue
        }

        if (!/[\u0000-\u001f\u007f-\u009f]/u.test(character)) {
          value += character
        }
      }
    }

    input.on("data", onData)
  })
}

async function createInitialAdmin(username, passwordHash) {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  let transactionStarted = false

  try {
    await client.connect()
    await client.query("BEGIN")
    transactionStarted = true

    // Serialize runs of this initializer so two operators cannot create
    // separate first administrators at the same time.
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      ["manage-gestamp-initial-admin"],
    )

    const existingAdmin = await client.query(
      'SELECT 1 FROM "User" WHERE "role" = \'ADMIN\'::"UserRole" LIMIT 1',
    )

    if (existingAdmin.rowCount > 0) {
      throw new InitialAdminError(
        "Ya existe una cuenta ADMIN. No se realizaron cambios.",
      )
    }

    const existingUsername = await client.query(
      'SELECT 1 FROM "User" WHERE "username" = $1 LIMIT 1',
      [username],
    )

    if (existingUsername.rowCount > 0) {
      throw new InitialAdminError(
        "Ese nombre de usuario ya existe. No se realizaron cambios.",
      )
    }

    await client.query(
      'INSERT INTO "User" ("username", "passwordHash", "role", "createdAt", "updatedAt") VALUES ($1, $2, \'ADMIN\'::"UserRole", NOW(), NOW())',
      [username, passwordHash],
    )

    await client.query("COMMIT")
    transactionStarted = false
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK").catch(() => {})
    }

    if (error instanceof InitialAdminError) throw error

    // Avoid printing driver errors, which can contain database connection data.
    throw new InitialAdminError(
      "No fue posible crear la cuenta. Revisa la configuración del servidor y vuelve a intentarlo.",
    )
  } finally {
    await client.end().catch(() => {})
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new InitialAdminError(
      "DATABASE_URL no está configurada en el entorno del servidor.",
    )
  }

  const username = await promptUsername()
  if (!USERNAME_PATTERN.test(username)) {
    throw new InitialAdminError(
      "El usuario debe tener entre 3 y 64 caracteres: letras, números, punto, guion o guion bajo.",
    )
  }

  const password = await promptHidden("Contraseña (entrada oculta): ")
  const confirmation = await promptHidden("Confirma la contraseña: ")

  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw new InitialAdminError(
      `La contraseña debe tener entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres.`,
    )
  }

  if (password !== confirmation) {
    throw new InitialAdminError("Las contraseñas no coinciden.")
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  })

  await createInitialAdmin(username, passwordHash)
  process.stdout.write("Cuenta ADMIN creada. Ya puedes iniciar sesión.\n")
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof InitialAdminError ? error.message : "No fue posible completar la operación."}\n`,
  )
  process.exitCode = 1
})
