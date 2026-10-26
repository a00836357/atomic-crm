/* eslint-disable no-console -- command-line script: printing is its output */
// Imports a backup of the former InsureCRM into the Supabase project.
//
//   node scripts/old-crm/import.mjs <backup.json>          preview only
//   node scripts/old-crm/import.mjs <backup.json> --apply  import
//
// --apply signs in with your CRM account (prompted, never stored) so the
// records are created with your permissions, as if typed in the app.
import fs from "node:fs";
import { input, password } from "@inquirer/prompts";
import { createClient } from "@supabase/supabase-js";

import { BANK_TAG, IMPORT_TAG, convertBackup, summarize } from "./convert.mjs";

const [backupPath] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const apply = process.argv.includes("--apply");

if (!backupPath) {
  console.error(
    "Uso: node scripts/old-crm/import.mjs <respaldo.json> [--apply]",
  );
  process.exit(1);
}

const STAGE_LABELS = {
  opportunity: "Contacto inicial",
  appointment: "Cita agendada",
  "proposal-sent": "Propuesta enviada",
  won: "Cerrado",
  lost: "No interesado",
};

const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
const today = new Date().toISOString().slice(0, 10);
const result = convertBackup(backup, today);
const stats = summarize(result);

console.log("\nVista previa de la importación");
console.log(`  Contactos:      ${stats.contacts}`);
console.log(`  Oportunidades:  ${stats.deals}`);
console.log(`  Notas:          ${stats.notes}`);
console.log(`  Tareas:         ${stats.tasks}`);
console.log(`  Omitidos:       ${stats.skipped}`);
for (const s of result.skipped) {
  console.log(
    `    - ${s.record.name ?? "(sin nombre)"} [${s.source}]: ${s.reason}`,
  );
}
console.log("\nContactos:");
for (const c of result.contacts) {
  const deals =
    c.deals.map((d) => STAGE_LABELS[d.stage]).join(", ") || "sin oportunidad";
  console.log(
    `  - ${c.first_name} ${c.last_name} (${deals}) ${c.tags.join(", ")}`,
  );
}

if (!apply) {
  console.log("\nNo se importó nada. Agrega --apply para importar.\n");
  process.exit(0);
}

const env = Object.fromEntries(
  fs
    .readFileSync(".env.production.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => [
      line.slice(0, line.indexOf("=")),
      line.slice(line.indexOf("=") + 1),
    ]),
);
const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SB_PUBLISHABLE_KEY,
  {
    auth: { persistSession: false },
  },
);

const check = ({ data, error }, what) => {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
};

console.log("\nInicia sesión con tu cuenta del CRM:");
const email = await input({ message: "Correo:" });
const pass = await password({ message: "Contraseña:", mask: "*" });
check(
  await supabase.auth.signInWithPassword({ email, password: pass }),
  "Inicio de sesión",
);

try {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [sale] = check(
    await supabase.from("sales").select("id").eq("user_id", user.id),
    "Usuario",
  );

  const existingTags = check(
    await supabase.from("tags").select("id, name"),
    "Etiquetas",
  );
  const importTag = existingTags.find((t) => t.name === IMPORT_TAG);
  if (importTag) {
    const already = check(
      await supabase
        .from("contacts")
        .select("id")
        .contains("tags", [importTag.id])
        .limit(1),
      "Contactos",
    );
    if (already.length) {
      throw new Error(
        `Ya hay contactos con la etiqueta "${IMPORT_TAG}": la importación ya se hizo. No se importó nada para no duplicar.`,
      );
    }
  }

  const tagIds = {};
  for (const [name, color] of [
    [IMPORT_TAG, "#e5e7eb"],
    [BANK_TAG, "#fde68a"],
  ]) {
    const found = existingTags.find((t) => t.name === name);
    tagIds[name] = found
      ? found.id
      : check(
          await supabase
            .from("tags")
            .insert({ name, color })
            .select("id")
            .single(),
          "Etiqueta",
        ).id;
  }

  const indexByStage = {};
  let done = 0;
  for (const c of result.contacts) {
    const { deals, notes, tasks, tags, ...fields } = c;
    const contact = check(
      await supabase
        .from("contacts")
        .insert({
          ...fields,
          tags: tags.map((t) => tagIds[t]),
          sales_id: sale.id,
        })
        .select("id")
        .single(),
      `Contacto ${c.first_name} ${c.last_name}`,
    );
    for (const deal of deals) {
      indexByStage[deal.stage] = (indexByStage[deal.stage] ?? -1) + 1;
      check(
        await supabase.from("deals").insert({
          ...deal,
          contact_ids: [contact.id],
          sales_id: sale.id,
          index: indexByStage[deal.stage],
        }),
        `Oportunidad de ${c.first_name}`,
      );
    }
    for (const note of notes) {
      check(
        await supabase.from("contact_notes").insert({
          ...note,
          contact_id: contact.id,
          sales_id: sale.id,
        }),
        `Nota de ${c.first_name}`,
      );
    }
    for (const task of tasks) {
      check(
        await supabase.from("tasks").insert({
          ...task,
          contact_id: contact.id,
          sales_id: sale.id,
        }),
        `Tarea de ${c.first_name}`,
      );
    }
    done++;
    process.stdout.write(`\r  Importados ${done}/${result.contacts.length}`);
  }
  console.log("\n\nListo. Revisa tus contactos en el CRM.\n");
} finally {
  await supabase.auth.signOut();
}
