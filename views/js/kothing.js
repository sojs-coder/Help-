var editor = KothingEditor.create("des", {
  display: "block",
  codeMirror: CodeMirror,
  width: "100%",
  height: "auto",
  popupDisplay: "full",
  katex: katex,
  toolbarItem: [
    ["undo", "redo"],
    ["font", "fontSize", "formatBlock"],

    [
      "bold",
      "underline",
      "italic",
      "strike",
      "subscript",
      "superscript",
      "fontColor",
      "hiliteColor"
    ],
    ["outdent", "indent", "align", "list", "horizontalRule"],
    ["link", "table", "image", "audio", "video"],
    ["lineHeight", "textStyle"],
    ["showBlocks", "codeView"],
    ["math"],
    ["preview", "fullScreen"],
    ["removeFormat"],
    ["save"]
  ],
  charCounter: true,
  callBackSave: (contents) => {
    document.getElementById("content").value = contents;
  }
});
document.getElementById("go").addEventListener("click", () => {
  document.getElementById("des-content").value = editor.getContents();
  document.getElementById('form').submit();
});
