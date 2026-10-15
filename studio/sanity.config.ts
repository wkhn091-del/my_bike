import { defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { schemaTypes, SINGLETON_TYPES } from "./schemaTypes";
import { structure } from "./structure";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
if (!projectId) throw new Error("SANITY_STUDIO_PROJECT_ID is missing (studio/.env).");

const previewOrigin = process.env.SANITY_STUDIO_PREVIEW_URL ?? "http://localhost:3000";

export default defineConfig({
  name: "ridewithyoav",
  title: "RideWithYoav",
  projectId,
  dataset: process.env.SANITY_STUDIO_DATASET ?? "production",
  plugins: [
    structureTool({ title: "תוכן", structure }),
    presentationTool({
      title: "תצוגה מקדימה",
      previewUrl: { initial: previewOrigin, previewMode: { enable: "/api/draft-mode/enable" } },
      allowOrigins: [previewOrigin],
    }),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({ schemaType }) => !SINGLETON_TYPES.has(schemaType)),
  },
  document: {
    actions: (actions, { schemaType }) =>
      SINGLETON_TYPES.has(schemaType) ? actions.filter(({ action }) => action && ["publish", "discardChanges", "restore"].includes(action)) : actions,
  },
});
