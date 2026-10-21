// graphify OpenCode plugin (OpenCode V2 API)
//
// Injects a one-time reminder into the session system context when a graph
// exists at graphify-out/graph.json.
//
// Ported to the OpenCode V2 plugin contract. V2 requires a default export with
// a stable `id` plus an `effect` or `setup` function. The original V1 hook
// (`export const GraphifyPlugin = async (...) => ({ "tool.execute.before": ... })`)
// is rejected by V2 with:
//   PluginModule.LoadError: Plugin must export a default definition with an id
//   and an effect or setup function.
//
// The V1 version also mutated every bash command by prepending `echo "<reminder>" ; ...`,
// which is fragile (PowerShell rejects `&&`, quoting/backtick hazards). This port
// uses the V2 session "context" hook instead, so no command is ever rewritten.
import { existsSync } from "node:fs";
import { join } from "node:path";

const REMINDER =
  "[graphify] A knowledge graph for this project exists at graphify-out/. " +
  "For focused questions, prefer the graphify skill or `graphify query \"<question>\"` " +
  "(a scoped subgraph, usually far smaller than grepping raw files). " +
  "Read graphify-out/GRAPH_REPORT.md for broad architecture context.";

export default {
  id: "graphify",
  async setup(ctx) {
    const directory = ctx?.location?.directory ?? process.cwd();
    let reminded = false;

    await ctx.session.hook("context", (event) => {
      if (reminded) return;
      if (!existsSync(join(directory, "graphify-out", "graph.json"))) return;
      event.system.push({ type: "text", text: REMINDER });
      reminded = true;
    });
  },
};
