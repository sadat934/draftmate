async function runWord(callback) {
  if (!window.Word) {
    throw new Error("Microsoft Word APIs are not available. Open this page inside Word to use document actions.");
  }

  return Word.run(callback);
}

export async function getSelectedText() {
  return runWord(async (context) => {
    const selection = context.document.getSelection();
    selection.load("text");
    await context.sync();
    return selection.text || "";
  });
}

export async function getDocumentText() {
  return runWord(async (context) => {
    const body = context.document.body;
    body.load("text");
    await context.sync();
    return body.text || "";
  });
}

export async function insertAtCursor(text) {
  return runWord(async (context) => {
    const selection = context.document.getSelection();
    selection.insertText(text, Word.InsertLocation.replace);
    await context.sync();
  });
}

export async function replaceSelection(text) {
  return insertAtCursor(text);
}

export async function insertAfterSelection(text) {
  return runWord(async (context) => {
    const selection = context.document.getSelection();
    selection.insertText(`\n${text}`, Word.InsertLocation.after);
    await context.sync();
  });
}

export async function applyHeadingSuggestions(suggestions) {
  return runWord(async (context) => {
    const body = context.document.body;
    const paragraphs = body.paragraphs;
    paragraphs.load("items/text");
    await context.sync();

    suggestions.forEach((suggestion) => {
      const paragraph = paragraphs.items[suggestion.paragraphIndex];
      if (!paragraph) return;
      paragraph.insertText(suggestion.title, Word.InsertLocation.replace);
      paragraph.styleBuiltIn = styleForLevel(suggestion.level);
    });

    await context.sync();
  });
}

function styleForLevel(level) {
  if (level === 1) return Word.Style.heading1;
  if (level === 2) return Word.Style.heading2;
  return Word.Style.heading3;
}
