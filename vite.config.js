import { defineConfig } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
export default defineConfig({
  base: '/diffuse-showreel/', server: { port: 5173, strictPort: true }, build: { target: 'es2022' },
  plugins:[{
    name:'local-verification-evidence',
    configureServer(server){server.middlewares.use('/__showreel_metrics',(req,res,next)=>{
      if(req.method!=='POST')return next();
      if(!/^http:\/\/(127\.0\.0\.1|localhost):5173$/.test(req.headers.origin||'')){res.statusCode=403;return res.end();}
      let body='';req.on('data',part=>{body+=part;if(body.length>65536)req.destroy();});
      req.on('end',()=>{try{const report=JSON.parse(body);if(!report.viewport||!report.performance)throw new Error('Invalid report');const dir=resolve('.local/evidence');mkdirSync(dir,{recursive:true});writeFileSync(resolve(dir,'edge-latest.json'),JSON.stringify({captured:new Date().toISOString(),...report},null,2));res.statusCode=204;res.end();}catch{res.statusCode=400;res.end();}});
    });}
  }]
});
