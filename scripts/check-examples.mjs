import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const catalogue=JSON.parse(fs.readFileSync(path.join(root,'packages/contracts/components.json'),'utf8'));
const directory=fs.mkdtempSync(path.join(root,'.example-check-'));
try {
 const files=catalogue.map(component=>{const file=path.join(directory,`${component.name}.tsx`);fs.writeFileSync(file,component.example);return file;});
 const config=ts.readConfigFile(path.join(root,'tsconfig.json'),ts.sys.readFile);
 const {options}=ts.parseJsonConfigFileContent(config.config,ts.sys,root);
 const program=ts.createProgram(files,options);
 const diagnostics=ts.getPreEmitDiagnostics(program);
 if(diagnostics.length){console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:x=>x,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));process.exitCode=1;}
 else console.log(`${files.length} copyable catalogue examples typecheck independently.`);
}finally{fs.rmSync(directory,{recursive:true,force:true});}
