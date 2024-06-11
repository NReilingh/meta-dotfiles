import { type Args } from '../core.ts';
import { Command } from '@effect/cli';
import { Console } from 'effect';

export default Command.make('join', {}, () => Console.log("Hello from join command"));

// export default function join (args: Args) {
//   const target = args.shift();
//
//   if (!target) {
//     console.log("Target required");
//     Deno.exit(1);
//   }
//
//   alert(`Git clone ${target} to ~/.files/store/dotfiles`);
//
//   alert("Checkout init tag");
//   alert("Create branch with hostname from init");
//   alert("Continue as per dfi init");
// }
//
