const {buildSync}=require('esbuild');
buildSync({stdin:{contents:"export {createClient} from '@supabase/supabase-js';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'browser',target:['chrome140'],minify:true,outfile:'vendor-supabase.js',legalComments:'eof'});
