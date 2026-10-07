// Kódszerkesztő a feladatokhoz (CodeMirror 6), a kurzus színeivel, világos és sötét módban is.
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, indentOnInput, syntaxHighlighting, HighlightStyle, indentUnit } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { rust } from "@codemirror/lang-rust";
import { tags as t } from "@lezer/highlight";

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.modifier, t.operatorKeyword], color: "var(--cm-keyword)" },
  { tag: [t.typeName, t.className, t.namespace], color: "var(--cm-type)" },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.macroName], color: "var(--cm-fn)" },
  { tag: [t.string, t.character, t.special(t.string)], color: "var(--cm-string)" },
  { tag: [t.number, t.bool, t.atom], color: "var(--cm-number)" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--cm-comment)", fontStyle: "italic" },
  { tag: [t.propertyName, t.attributeName], color: "var(--cm-prop)" },
  { tag: [t.punctuation, t.operator, t.bracket], color: "var(--cm-punct)" },
]);

const theme = EditorView.theme({
  "&": { fontSize: "14px", backgroundColor: "var(--code-bg)", color: "var(--code-text)" },
  ".cm-content": { fontFamily: "var(--mono)", padding: "14px 0", caretColor: "var(--accent-2)" },
  ".cm-scroller": { fontFamily: "var(--mono)", lineHeight: "1.65" },
  ".cm-gutters": { backgroundColor: "var(--code-bg)", color: "#57534e", border: "none", paddingLeft: "6px" },
  ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.035)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "#a8a29e" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--accent-2)", borderLeftWidth: "2px" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "rgba(251,146,60,0.25) !important" },
  ".cm-matchingBracket": { backgroundColor: "rgba(251,146,60,0.2)", outline: "none" },
  "&.cm-focused": { outline: "none" },
});

export interface Editor {
  getValue(): string;
  setValue(code: string): void;
  focus(): void;
}

export function createEditor(host: HTMLElement, code: string, onChange: (code: string) => void, onRun: () => void): Editor {
  const view = new EditorView({
    parent: host,
    state: EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        history(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        indentUnit.of("    "),
        EditorState.tabSize.of(4),
        rust(),
        syntaxHighlighting(highlight),
        theme,
        keymap.of([
          { key: "Mod-Enter", run: () => (onRun(), true) },
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          indentWithTab,
        ]),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChange(u.state.doc.toString());
        }),
        EditorView.contentAttributes.of({ "aria-label": "Rust kódszerkesztő", spellcheck: "false" }),
      ],
    }),
  });
  return {
    getValue: () => view.state.doc.toString(),
    setValue: (c) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: c } }),
    focus: () => view.focus(),
  };
}
