import { test, expect, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

let server: Server;
let baseUrl: string;

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
    const relative = normalize(pathname).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]/, "");
    const filePath = join(process.cwd(), relative || "tests/playwright/fixtures/field-tracking.html");
    try {
      const body = await readFile(filePath);
      const extension = extname(filePath);
      const type = extension === ".js" ? "text/javascript" :
        extension === ".css" ? "text/css" : "text/html";
      res.writeHead(200, { "content-type": type });
      res.end(body);
    } catch (_) {
      res.writeHead(404);
      res.end("not found");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("test server did not bind");
  baseUrl = "http://127.0.0.1:" + address.port;
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

async function ready(page: Page) {
  await page.goto(baseUrl+'/tests/playwright/fixtures/field-tracking.html');
  await page.waitForFunction(()=>(window as any).ready);
}
test('real clip renders, seeks, selects, filters and synchronizes events independently',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(String(e)));
  await ready(page);const a=page.locator('#field-one');const b=page.locator('#field-two');
  await expect(a.locator('.field-entity')).toHaveCount(23);
  await a.getByRole('button',{name:'Next frame',exact:true}).click();
  await expect(a.locator('.field-time')).toHaveText('0.24 / 20.04 s');
  await expect(b.locator('.field-time')).toHaveText('0.04 / 20.04 s');
  await a.getByLabel('Player',{exact:true}).selectOption('home-2');
  await a.getByLabel('Timeline',{exact:true}).evaluate((el:HTMLInputElement)=>{el.value='5';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await expect(a.locator('[data-entity="home-2"]')).toHaveAttribute('aria-pressed','true');
  expect(await a.locator('.field-trail').getAttribute('d')).toContain('L');
  await a.getByLabel('Show home',{exact:true}).uncheck();await expect(a.locator('.field-entity')).toHaveCount(12);
  await a.getByLabel('Labels',{exact:true}).uncheck();await expect(a.locator('.field-entity text').first()).toHaveText('');
  await a.locator('.field-events button').nth(3).click();await expect(a.locator('.field-time')).toHaveText('1.80 / 20.04 s');
  await expect(a.locator('.field-events button').nth(3)).toHaveAttribute('aria-current','true');
  expect(errors).toEqual([]);
});
test('playback, reduced motion, resize, removal and destroy retain owner boundaries',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await ready(page);
  const a=page.locator('#field-one');const b=page.locator('#field-two');
  await a.getByLabel('Playback speed').selectOption('2');await a.getByRole('button',{name:'Play',exact:true}).click();
  await expect.poll(async()=>Number(await a.getByLabel('Timeline',{exact:true}).inputValue())).toBeGreaterThan(.4);
  await a.getByRole('button',{name:'Pause',exact:true}).click();const time=await a.getByLabel('Timeline',{exact:true}).inputValue();await page.waitForTimeout(100);expect(await a.getByLabel('Timeline',{exact:true}).inputValue()).toBe(time);
  await page.setViewportSize({width:430,height:900});await page.waitForTimeout(300);await expect(a.locator('.myIO-field-root')).toHaveCount(1);
  expect(Number(await a.locator('.myIO-field-root').getAttribute('width'))).toBeLessThan(430);
  expect((await a.boundingBox())!.height).toBeLessThan(650);
  const textSize=await a.locator('.field-entity text').first().evaluate(el=>{const svg=el.ownerSVGElement!;return parseFloat(getComputedStyle(el).fontSize)*svg.getBoundingClientRect().width/111;});expect(textSize).toBeGreaterThan(8);
  expect(await a.getByLabel('Timeline',{exact:true}).inputValue()).toBe(time);
  await b.getByRole('button',{name:'Next frame',exact:true}).focus();await page.keyboard.press('Enter');await expect(b.locator('.field-time')).toHaveText('0.24 / 20.04 s');
  await page.evaluate(()=>{(window as any).charts[0].removeLayers(['Match view']);});await expect(a.locator('.myIO-field-root')).toHaveCount(0);await expect(b.locator('.myIO-field-root')).toHaveCount(1);
  await b.getByRole('button',{name:'Play',exact:true}).click();await page.evaluate(()=>{(window as any).charts[1].destroy();});await expect(b.locator('.myIO-field-root')).toHaveCount(0);
});
test('mapped coordinates, marker keyboard selection, trails and end state',async({page})=>{
  await ready(page);
  await page.evaluate(()=>{
    const w=window as any, old=w.charts[0], config=old.config, element=old.dom.element;
    old.destroy();
    config.layers[0].data=w.clip.tracking.slice().reverse().map((r:any)=>({...r,east:r.x,north:r.y,stamp:r.time,who:r.entity_id}));
    config.layers[0].mapping={...config.layers[0].mapping,x_var:'east',y_var:'north',time:'stamp',entity:'who'};
    w.charts[0]=new w.myIOchart({element,width:1000,height:780,config});
  });
  const a=page.locator('#field-one'), marker=a.locator('[data-entity="home-2"]');
  await marker.focus();await page.keyboard.press('Enter');await expect(a.getByLabel('Player',{exact:true})).toHaveValue('home-2');
  await a.getByLabel('Timeline',{exact:true}).focus();await page.keyboard.press('ArrowRight');
  expect(Number(await a.getByLabel('Timeline',{exact:true}).inputValue())).toBeGreaterThan(.04);
  await a.getByLabel('Timeline',{exact:true}).evaluate((el:HTMLInputElement)=>{el.value='2.04';el.dispatchEvent(new Event('input',{bubbles:true}));});
  const expected=await page.evaluate(()=>{const r=(window as any).clip.tracking.find((r:any)=>r.entity_id==='home-2'&&r.time===2.04);return `translate(${r.x},${r.y})`;});
  await expect(marker).toHaveAttribute('transform',expected);
  await a.getByLabel('Trail length',{exact:true}).evaluate((el:HTMLInputElement)=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});expect(await a.locator('.field-trail').getAttribute('d')).not.toContain('L');
  await a.getByLabel('Timeline',{exact:true}).evaluate((el:HTMLInputElement)=>{el.value='19.94';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await a.getByRole('button',{name:'Play',exact:true}).click();await expect(a.locator('.field-time')).toHaveText('20.04 / 20.04 s');await expect(a.getByRole('button',{name:'Play',exact:true})).toBeVisible();
  await a.getByRole('button',{name:'Reset',exact:true}).click();await expect(a.locator('.field-time')).toHaveText('0.04 / 20.04 s');
});
test('same-label type replacement disposes field playback and controls',async({page})=>{
  await ready(page);
  await page.locator('#field-one').getByRole('button',{name:'Play',exact:true}).click();
  const result=await page.evaluate(()=>{
    const chart=(window as any).charts[0], controller=chart.runtime.field.controller;
    const config={...chart.config,layers:[{...chart.config.layers[0],type:'point',data:[{x:1,y:2}],mapping:{x_var:'x',y_var:'y'}}]};
    chart.updateChart(config);
    return {playing:controller.state.playing,field:chart.runtime.field};
  });
  expect(result).toEqual({playing:false,field:null});
  await expect(page.locator('#field-one .myIO-field-root')).toHaveCount(0);
  await expect(page.locator('#field-two .myIO-field-root')).toHaveCount(1);
});
test('data replacement cancels the prior owner and removes missing markers',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>{
    const w=window as any, chart=w.charts[0], old=chart.runtime.field.controller;
    old.play();
    chart.updateData([{label:'Match view',data:w.clip.tracking.map((r:any)=>r.entity_id==='home-2'?{...r,x:null}:r)}]);
    old.dispose();old.dispose();
    return {playing:old.state.playing,roots:chart.dom.element.querySelectorAll('.myIO-field-root').length};
  });
  expect(result).toEqual({playing:false,roots:1});
  await expect(page.locator('#field-one [data-entity="home-2"]')).toHaveCount(0);
  await expect(page.locator('#field-two [data-entity="home-2"]')).toHaveCount(1);
});
test('invalid mapped columns and nonnumeric coordinates emit errors without marks',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>{
    const chart=(window as any).charts[0], errors:string[]=[];
    chart.on('error',(e:any)=>errors.push(e.message));
    let layer={...chart.config.layers[0],mapping:{...chart.config.layers[0].mapping,time:'typo'}};
    chart.updateChart({...chart.config,layers:[layer]});
    const missing=chart.dom.element.querySelectorAll('.field-entity').length;
    layer={...layer,mapping:{...layer.mapping,time:'time'},data:[{x:'bad',y:1,time:0,entity_id:'a'}]};
    chart.updateChart({...chart.config,layers:[layer]});
    return {errors,missing,roots:chart.dom.element.querySelectorAll('.myIO-field-root').length};
  });
  expect(result.missing).toBe(0);expect(result.roots).toBe(0);
  expect(result.errors.some(e=>e.includes('existing column'))).toBe(true);
  expect(result.errors.some(e=>e.includes('numeric'))).toBe(true);
});
