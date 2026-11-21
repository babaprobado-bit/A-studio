const RULES=[
 {id:'private-key',severity:'critical',pattern:/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,message:'Özel anahtar benzeri içerik bulundu.'},
 {id:'token-shape',severity:'critical',pattern:/\b(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,message:'Token biçimine benzeyen gizli değer bulundu.'},
 {id:'secret-assignment',severity:'critical',pattern:/\b(?:api[_-]?key|access[_-]?token|password|client[_-]?secret)\s*[:=]\s*[^,\s]{8,}/i,message:'Gizli bilgi ataması olabilecek ifade bulundu.'},
 {id:'policy-override',severity:'high',pattern:/\b(?:override|disable|bypass)\b.{0,60}\b(?:system policy|safety rule|security setting|guardrail)\b/i,message:'Güvenlik veya sistem politikasını geçersiz kılma ifadesi bulundu.'}
];
export function scanAgentContent(value,{source='prompt',maxChars=50000}={}){const text=String(value??'').slice(0,Math.max(0,Math.min(100000,Number(maxChars)||50000))),findings=[],lines=text.split(/\r?\n/);
 for(let i=0;i<lines.length;i++)for(const rule of RULES)if(rule.pattern.test(lines[i]))findings.push({ruleId:rule.id,severity:rule.severity,line:i+1,message:rule.message});
 const blocked=findings.some(x=>x.severity==='critical'||x.severity==='high');return {source:String(source||'prompt').slice(0,40),scannedChars:text.length,findings,blocked,summary:findings.length?findings.length+' bulgu bulundu.':'Bilinen yüksek riskli örüntü bulunmadı.'};}
