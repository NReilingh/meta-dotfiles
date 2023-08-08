import { type Args } from '../core.ts';

export default function inherit (args: Args) {
  const result = confirm("Already joined to an existing repo?");
  if (!result) {
    alert("Run mf join <target> first");
  }

  const inheritFrom = args.shift();

  if (!inheritFrom) {
    console.log("Target required");
    Deno.exit(1);
  }

  alert("Create a new branch from init tag for the hostname and merge in the target branch");
  alert("Continue as per mf init");
}
