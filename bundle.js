const myFiles = ["./src/index.ts"];

await Bun.build({
    entrypoints: myFiles,
    outdir: "./dist",
});
