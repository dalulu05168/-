import test from 'node:test';import assert from 'node:assert/strict';
import {backendConfig,validateBackend} from '../backend-config.js';
test('independent desktop rejects original backend and has no fallback',()=>{
 assert.equal(validateBackend(backendConfig).ready,false);
 assert.equal(validateBackend({}).ready,false);
 assert.equal(validateBackend({url:'https://igcmvzoxminzvcgwimwi.supabase.co',publishableKey:'sb_publishable_test'}).ready,false);
 assert.equal(validateBackend({url:'https://new-independent.supabase.co',publishableKey:'sb_publishable_test'}).ready,true);
 assert.equal(validateBackend({url:'https://new-independent.supabase.co@igcmvzoxminzvcgwimwi.supabase.co',publishableKey:'sb_publishable_test'}).ready,false);
});
