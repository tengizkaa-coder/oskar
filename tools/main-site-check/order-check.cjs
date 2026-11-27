// Run with PLAYWRIGHT_PATH and CHROME_PATH set, against a local server on BASE_URL.
const {chromium,devices}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
const base=process.env.BASE_URL || 'http://127.0.0.1:4189';
const phone='+7 (495) 095-95-99';
function assert(value,message){if(!value)throw Error(message)}
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH || undefined,args:['--no-sandbox','--single-process','--no-zygote']});try{
 if(process.env.NOJS==='1'){const c=await b.newContext({javaScriptEnabled:false});const q=await c.newPage();await q.goto(base+'/test/catalog/faq/');assert(await q.locator('.nojs-contact').isVisible(),'no-js telegram missing');assert(await q.locator('.nojs-contact').getAttribute('href')==='https://t.me/alkomsk_shop_bot','no-js destination'); console.log('OK: no-JS fallback');return;}
 const mobile=process.env.MOBILE==='1'; const c=await b.newContext({...mobile?devices['Pixel 7']:{viewport:{width:1280,height:800}}, permissions:['clipboard-read','clipboard-write']});const p=await c.newPage();
 async function clean(){assert(await p.locator('a[href^="tel:"]').count()===0,'tel exists before click');assert(!(await p.locator('body').innerText()).includes(phone),'visible phone before click');}
 async function open(trigger,how='escape'){
  await trigger.scrollIntoViewIfNeeded(); await trigger.click();let dialog=p.locator('.order-dialog');assert(await dialog.isVisible(),'dialog not open');assert((await dialog.locator('.order-number').innerText())===phone,'number');assert(await dialog.locator('.order-call').getAttribute('href')==='tel:'+phone.replace(/[^+\d]/g,''),'call link');assert(await dialog.locator('.order-call').evaluate(e=>e===document.activeElement),'initial focus');
  if(how==='copy'){await dialog.locator('.order-copy').click();await p.waitForFunction(()=>document.querySelector('.order-copy-status')?.textContent==='Номер скопирован');assert(await p.evaluate(()=>navigator.clipboard.readText())===phone,'clipboard');await dialog.locator('.order-close').click();}
  else if(how==='backdrop'){const r=await dialog.boundingBox();await p.mouse.click(r.x>4?2:r.x+r.width/2, r.y>4?2:r.y-3);}
  else if(how==='close')await dialog.locator('.order-close').click();else await p.keyboard.press('Escape');
  await dialog.waitFor({state:'detached'});assert(await dialog.count()===0,'dialog not removed');assert(await trigger.evaluate(e=>document.activeElement===e),'focus not restored');await clean();
 }
 for(const path of ['/test/','/test.html']){await p.goto(base+path);await clean();await open(p.locator('header .order-trigger').first(),'copy');await open(p.locator('#shelves .order-trigger').first(),'escape');if(mobile)await open(p.locator('.callbar .order-trigger'),'close');}
 await p.goto(base+'/test/catalog/');await clean();await open(p.locator('header .order-trigger'),'escape');await open(p.locator('.expanded-product .order-trigger').first(),'close');await p.locator('.add-basket').first().click();await p.locator('.basket-open').click();await open(p.locator('.basket-checkout'),'escape');assert(await p.locator('.basket-dialog').isVisible(),'basket closed');await p.locator('.basket-close').click();if(mobile){await open(p.locator('.catalog-order-bar .order-trigger'),'escape');await open(p.locator('.catalog-order-bar .order-trigger'),'backdrop');}else await open(p.locator('header .order-trigger'),'backdrop');
 if(mobile){await p.goto(base+'/',{referer:'https://www.google.com/'});assert(!await p.locator('html[data-blocked]').count(),'main search blocked');await clean();await open(p.locator('header .order-trigger'),'escape');await p.locator('.home-nav a[href="/catalog/"]').click();assert(!await p.locator('html[data-blocked]').count(),'main catalog blocked');await clean();await open(p.locator('.expanded-product .order-trigger').first(),'escape');}
 await p.goto(base+'/test/catalog/product/jameson/');await clean();await open(p.locator('.product-detail .order-trigger'),'escape');
 console.log('OK: '+(mobile?'mobile':'desktop')+' triggers, dialog, clipboard, focus, close and basket');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
