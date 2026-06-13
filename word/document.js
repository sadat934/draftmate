// Store the last selected text and its location info
let lastSelection = {
  text: "",
  startIndex: -1,
  length: 0
};

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
    
    // Get the range to capture position info
    const range = selection.getRange();
    range.load("text");
    
    await context.sync();
    
    // Store selection info for later replacement
    if (selection.text) {
      lastSelection = {
        text: selection.text,
        range: range // Store the range object to use with search
      };
    }
    
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
    selection.insertText(text, "Replace");
    await context.sync();
  });
}

export async function replaceSelection(text) {
  return runWord(async (context) => {
    // Use stored selection info to find and replace the text
    if (lastSelection.text) {
      // Search for the original selected text in the document
      const searchResults = context.document.body.search(lastSelection.text, {
        matchCase: true,
        matchWholeWord: false
      });
      searchResults.load("items");
      await context.sync();
      
      if (searchResults.items.length > 0) {
        // Replace the first occurrence (the one that was selected)
        searchResults.items[0].insertText(text, "Replace");
        await context.sync();
        // Clear the stored selection after use
        lastSelection = { text: "", startIndex: -1, length: 0 };
        return;
      }
    }
    
    // Fallback: try to use current selection
    const selection = context.document.getSelection();
    selection.load("text");
    await context.sync();
    
    if (!selection.text || selection.text.trim() === "") {
      throw new Error("No text is selected. Please select text in your document first, or click 'Refresh' to capture your selection.");
    }
    
    selection.insertText(text, "Replace");
    await context.sync();
  });
}

export async function insertAfterSelection(text) {
  return runWord(async (context) => {
    // Use stored selection info to find and insert after the text
    if (lastSelection.text) {
      // Search for the original selected text in the document
      const searchResults = context.document.body.search(lastSelection.text, {
        matchCase: true,
        matchWholeWord: false
      });
      searchResults.load("items");
      await context.sync();
      
      if (searchResults.items.length > 0) {
        // Insert after the first occurrence
        searchResults.items[0].insertText(`\n${text}`, "After");
        await context.sync();
        // Clear the stored selection after use
        lastSelection = { text: "", startIndex: -1, length: 0 };
        return;
      }
    }
    
    // Fallback: try to use current selection
    const selection = context.document.getSelection();
    selection.insertText(`\n${text}`, "After");
    await context.sync();
  });
}

export async function applyHeadingSuggestions(suggestions) {
  return runWord(async (context) => {
    const body = context.document.body;
    const paragraphs = body.paragraphs;
    paragraphs.load("items");
    await context.sync();

    // Apply heading suggestions to all specified paragraphs
    for (const suggestion of suggestions) {
      const paragraph = paragraphs.items[suggestion.paragraphIndex];
      if (!paragraph) continue;
      
      paragraph.insertText(suggestion.title, "Replace");
      paragraph.style = styleForLevel(suggestion.level);
    }

    await context.sync();
  });
}

function styleForLevel(level) {
  if (level === 1) return "Heading 1";
  if (level === 2) return "Heading 2";
  return "Heading 3";
}
