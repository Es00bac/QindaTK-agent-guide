// SPDX-License-Identifier: LGPL-3.0-or-later
// Read an ephemeral Sites write credential from a single stdin line.
// Nothing from the credential is written to disk, URLs, or persistent Git config.
import {createInterface} from 'node:readline';
import {spawn} from 'node:child_process';
if(process.stdin.isTTY)process.stdin.setRawMode(true);
const reader=createInterface({input:process.stdin,terminal:false});
process.stdout.write('Ready for ephemeral source credential.\n');
const line=await new Promise(resolve=>reader.once('line',resolve));
reader.close();process.stdin.pause();
if(process.stdin.isTTY)process.stdin.setRawMode(false);
const credential=JSON.parse(line);
if(credential.auth_mode!=='http_extra_header'||!credential.token||!/^https:\/\//.test(credential.remote_url)||!/^[A-Za-z0-9_./-]+$/.test(credential.branch))throw new Error('Unsupported source credential');
const environment={...process.env,GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_COUNT:'2',GIT_CONFIG_KEY_0:'http.extraHeader',GIT_CONFIG_VALUE_0:`Authorization: Bearer ${credential.token}`,GIT_CONFIG_KEY_1:'credential.helper',GIT_CONFIG_VALUE_1:''};
for(const name of ['GIT_TRACE','GIT_TRACE_CURL','GIT_CURL_VERBOSE'])delete environment[name];
const child=spawn('git',['push',credential.remote_url,`HEAD:refs/heads/${credential.branch}`],{env:environment,stdio:['ignore','pipe','pipe']});
let output='';child.stdout.on('data',data=>output+=data);child.stderr.on('data',data=>output+=data);
const code=await new Promise((resolve,reject)=>{child.once('close',resolve);child.once('error',reject);});
process.stdout.write(output.replaceAll(credential.token,'[REDACTED]'));
if(code!==0)process.exit(code||1);
process.stdout.write('Exact source pushed to Sites.\n');
