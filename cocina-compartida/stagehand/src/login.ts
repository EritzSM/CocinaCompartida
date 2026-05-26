import type { Stagehand } from "@browserbasehq/stagehand";
import { waitForURL } from "./utils.js";
import "./env.js";

export async function loginConIA(sh: Stagehand) {
  const baseUrl = process.env.BASE_URL ?? "http://localhost";
  const email = process.env.TEST_EMAIL!;
  const password = process.env.TEST_PASSWORD!;

  const page = sh.context.activePage()!;
  await page.goto(`${baseUrl}/login`);
  await page.waitForLoadState("load");
  await page.waitForTimeout(800);

  // 3 sh.act — probado y funciona con el modelo Groq
  await sh.act(`escribe "${email}" en el campo de correo electrónico o email`);
  await sh.act(`escribe "${password}" en el campo de contraseña`);
  await sh.act("haz click en el botón de Iniciar Sesión o Login para enviar el formulario");

  await waitForURL(page, /\/home$/, 15000);
  await page.waitForLoadState("load");
}
