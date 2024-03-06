const filePath = "./README.md";

const text = await Deno.readTextFile(filePath);

const lines = text.split("\n");

let code = "";
let codeBlock = "";
let inCodeBlock = false;

for (const line of lines) {
  if (line.startsWith("---")) {
    inCodeBlock = true;
  } else if (inCodeBlock && codeBlock === "" && line.startsWith("```")) {
    codeBlock += "\n";
  } else if (inCodeBlock && codeBlock !== "" && line.startsWith("```")) {
    code += codeBlock;
    codeBlock = "";
  } else if (inCodeBlock && codeBlock !== "") {
    codeBlock += line + "\n";
  }
}

Deno.writeTextFile("README.test.ts", code);
