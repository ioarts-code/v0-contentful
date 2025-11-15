import { draftMode } from "next/headers";

export async function GET(request: Request) {
  // `draftMode()` returns a Promise in this environment, await it
  (await draftMode()).disable();
  return new Response("Draft mode is disabled");
}
