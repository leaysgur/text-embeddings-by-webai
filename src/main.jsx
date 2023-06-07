import { For } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { render } from "solid-js/web";
// Currently this requires Node.js polyfills...
// import {} from "@visheratin/web-ai";
import {
  ListTextModels,
  TextModelType,
  TextModel,
} from "@visheratin/web-ai/dist/text";
import { cosineSimilarity } from "./math";

const MODELS = ListTextModels(TextModelType.FeatureExtraction);
// Worker is supported but requires bundler tweaks...
const USE_WORKER = import.meta.env.PROD;

const App = () => {
  const [state, setState] = createStore({
    modelId: MODELS[14].id,
    model: null,
    entries: [],
    generating: false,
    results: [],
  });
  const updateState = (updater) => setState(produce(updater));

  const setModel = (ev) =>
    updateState((draft) => {
      draft.model = null;
      draft.entries = [];
      draft.results = [];
      draft.modelId = ev.currentTarget.value;
    });

  const loadModel = async (ev) => {
    ev.currentTarget.disabled = true;
    ev.currentTarget.textContent = "Loading...";

    console.log("Web AI loading...");
    console.time("Web AI loaded");
    const { model } = await TextModel.create(state.modelId, USE_WORKER);
    console.timeEnd("Web AI loaded");

    updateState((draft) => (draft.model = model));
  };

  const addEntry = () =>
    updateState((draft) => draft.entries.push({ embeddings: null }));
  const deleteEntry = (entryIdx) =>
    updateState(
      (draft) =>
        (draft.entries = draft.entries.filter((_, idx) => idx !== entryIdx))
    );

  const generateEmbeddings = async (entryIdx, text) => {
    if (text.trim() === "") return;
    if (state.model === null) return;

    updateState((draft) => {
      draft.generating = true;
      draft.entries[entryIdx].embeddings = "Generating...";
    });

    const { result: embeddings } = await state.model.process(text);
    updateState((draft) => {
      draft.entries[entryIdx].embeddings = embeddings;
      draft.generating = false;
    });
  };

  const calcDisabled = () => {
    if (state.generating) return true;
    if (state.entries.some((e) => !Array.isArray(e.embeddings))) return true;
    if (state.entries.filter((e) => Array.isArray(e.embeddings)).length < 2)
      return true;
    return false;
  };
  const calcCosineSimilarity = async () => {
    updateState((draft) => (draft.results = []));

    const results = [];
    const header = [""];
    for (const [idx] of Object.entries(state.entries))
      header.push(`#${Number(idx) + 1}`);
    results.push(header);

    for (const [idx, e1] of Object.entries(state.entries)) {
      const row = [`#${Number(idx) + 1}`];
      for (const [, e2] of Object.entries(state.entries)) {
        const cosSim = cosineSimilarity(e1.embeddings, e2.embeddings);
        row.push(cosSim);
      }
      results.push(row);
    }

    updateState((draft) => (draft.results = results));
  };

  return (
    <>
      <h1>Web AI Embeddings</h1>
      <p>Some models may take more than 1min~ to load, be patient!</p>

      <select onChange={setModel} value={state.modelId}>
        {MODELS.map((m) => (
          <option>{m.id}</option>
        ))}
      </select>
      <button onClick={loadModel} disabled={state.modelId === null}>
        {state.model === null ? "Load model" : "Loaded"}
      </button>
      {" | "}
      <fieldset disabled={state.model === null} style="display: contents">
        <button onClick={addEntry}>Add entry</button>
        <button onClick={calcCosineSimilarity} disabled={calcDisabled()}>
          Calc cosine similarity
        </button>
      </fieldset>

      <hr />

      <For each={state.entries}>
        {(entry, idx) => (
          <div style="display: grid; gap: 5px; grid-template-columns: max-content 1fr 1fr max-content">
            <span>#{idx() + 1}</span>
            <textarea
              placeholder="Enter sentence..."
              onBlur={(ev) => generateEmbeddings(idx(), ev.currentTarget.value)}
            />
            <textarea readOnly>{JSON.stringify(entry.embeddings)}</textarea>
            <button onClick={() => deleteEntry(idx())}>x</button>
          </div>
        )}
      </For>

      <hr />

      <table border="1" style="width: 100%">
        <tbody>
          <For each={state.results}>
            {(row) => (
              <tr>
                <For each={row}>
                  {(v) => (
                    <td
                      style={{
                        color: 0.5 < v ? "crimson" : "inherit",
                        ["background-color"]: 0.8 < v ? "pink" : "inherit",
                      }}
                    >
                      {v}
                    </td>
                  )}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </>
  );
};

render(() => <App />, document.getElementById("app"));
